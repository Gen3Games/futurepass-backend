import { ApiPromise, WsProvider } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { Keyring } from '@polkadot/keyring'
import { ISubmittableResult } from '@polkadot/types/types'
import { hexToU8a } from '@polkadot/util'
import { getApiOptions } from '@therootnetwork/api'
import Redis from 'ioredis'
import { REDIS_FUTUREPASS_CREATED_CHANNEL_NAME } from '../utils/constants'

export class FuturepassCreationQueue {
  private keyring = new Keyring({ type: 'ethereum' })
  private keyPair = this.keyring.addFromSeed(hexToU8a(this.privateKey))
  private queueKey = 'futurepass_creation_queue'
  private singleInstanceLock = 'force_single_instance_queue'
  private lockValue = `${process.pid}:${Date.now()}`
  private lockTtlSeconds = 120
  private lockRetryDelay = 5000
  private retryLimit = 50
  private retryCount = 0
  private initialRetryDelay = 100
  private isQueueRunning = false
  private retryTimer: NodeJS.Timeout | null = null
  private luaScriptSha
  private api
  private luaScript = `
        local queue_name = KEYS[1]
        local max_items = tonumber(ARGV[1])
        local range_start = tonumber(ARGV[2])
        local range_end = tonumber(ARGV[3])
        local queue_length = redis.call('LLEN', queue_name)

        if queue_length > max_items then
            local overflow_items = redis.call('LRANGE', queue_name, max_items, -1)
            redis.call('RPUSH', queue_name .. ':overflow', unpack(overflow_items))
            redis.call('LTRIM', queue_name, 0, max_items - 1)
        end
        local range_items = redis.call('LRANGE', queue_name, range_start, range_end)
        redis.call('DEL', queue_name)

        -- Move overflow items back to the main queue
        local overflow_length = redis.call('LLEN', queue_name .. ':overflow')
        if overflow_length > 0 then
            local overflow_range = redis.call('LRANGE', queue_name .. ':overflow', 0, -1)
            redis.call('RPUSH', queue_name, unpack(overflow_range))
            redis.call('DEL', queue_name .. ':overflow')
        end

        return range_items
    `
  constructor(
    private redis: Redis,
    private privateKey: string,
    private rootNetworkSocket: string,
    private logger,
    private maxItems: number
  ) {}

  private acquireLock = async () => {
    const result = await this.redis.set(
      this.singleInstanceLock,
      this.lockValue,
      'EX',
      this.lockTtlSeconds,
      'NX'
    )

    return result === 'OK'
  }

  private refreshLock = async () => {
    const currentLockValue = await this.redis.get(this.singleInstanceLock)

    if (currentLockValue !== this.lockValue) {
      return false
    }

    const result = await this.redis.set(
      this.singleInstanceLock,
      this.lockValue,
      'EX',
      this.lockTtlSeconds,
      'XX'
    )

    return result === 'OK'
  }

  private scheduleLockRetry = () => {
    if (this.retryTimer != null) {
      return
    }

    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      void this.startQueue()
    }, this.lockRetryDelay)
  }

  private executeRetrieveBatchTransaction = async () => {
    await this.redis.watch(this.queueKey)

    const result = await this.redis
      .multi()
      .evalsha(
        this.luaScriptSha as string,
        1,
        this.queueKey,
        this.maxItems,
        0,
        -1
      )
      .exec()
    await this.redis.unwatch()

    if (!result) {
      return []
    }
    const batchOfEoas = result[0][1] as string[]

    if (batchOfEoas) {
      if (batchOfEoas.length) {
        this.logger.info(
          `futurepass_creation_queue poll_finished - ${
            batchOfEoas.length
          } - ${JSON.stringify(batchOfEoas)}`
        )
      }
      return batchOfEoas as unknown[] as string[]
    } else {
      throw new Error('futurepass_creation_queue Transaction failed')
    }
  }

  private startQueueWithRetries = async () => {
    let delay = this.initialRetryDelay
    while (this.retryCount < this.retryLimit) {
      const hasLock = await this.refreshLock()

      if (!hasLock) {
        throw new Error('Queue lock lost')
      }

      let batchOfEoas: string[] = []

      try {
        batchOfEoas = await this.executeRetrieveBatchTransaction()
        this.retryCount = 0
      } catch (err) {
        this.retryCount++
        if (this.retryCount >= this.retryLimit) {
          throw new Error('Max retries reached')
        }

        this.logger.error(
          `futurepass_creation_queue Retry ${this.retryCount}/${this.retryLimit} after ${delay}ms`,
          4007000
        )
        this.logger.error(
          `futurepass_creation_queue startQueueWithRetries - ${err.message}`,
          4007000
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2 // exponential backoff
      }

      if (!batchOfEoas.length) {
        continue
      }

      const performBatchRetries = 5
      let performBatchRetryCount = 0

      try {
        while (performBatchRetryCount < performBatchRetries) {
          await this.performBatch(batchOfEoas)
          performBatchRetryCount = 0
          break
        }
      } catch (err) {
        performBatchRetryCount++
        this.logger.error(
          `futurepass_creation_queue performBatch failed - ${err.message}`,
          4007000
        )
        if (performBatchRetryCount >= performBatchRetries) {
          throw Error(
            `futurepass_creation_queue performBatch function failed - ${err.message}`
          )
        }
      }
    }
  }

  public startQueue = async () => {
    if (this.isQueueRunning) {
      return
    }

    // Using locking mechanism to only run the queue in one replica
    const shouldInit = await this.acquireLock()
    this.logger.info(`start_queue_lock ${shouldInit ? 1 : 0}`)

    if (!shouldInit) {
      this.scheduleLockRetry()
      return
    }

    this.isQueueRunning = true

    try {
      this.luaScriptSha = await this.redis.script('LOAD', this.luaScript)
      this.api = await this.getApi()
      await this.startQueueWithRetries()
    } catch (err) {
      console.error('Error:', err)
      this.logger.error(`error getApi - ${err.message}`, 4007000)
    } finally {
      this.isQueueRunning = false
      await this.unLockQueue()
    }
  }

  public unLockQueue = async () => {
    const currentLockValue = await this.redis.get(this.singleInstanceLock)

    if (currentLockValue !== this.lockValue) {
      return 0
    }

    return this.redis.del(this.singleInstanceLock)
  }

  callExtrinsic = (
    extrinsic: SubmittableExtrinsic<'promise', ISubmittableResult>,
    nonce?: number
  ) => {
    return new Promise<ISubmittableResult>((resolve) => {
      const method = async () => {
        const unsub = await extrinsic.signAndSend(
          this.keyPair,
          {
            nonce,
          },
          async (result) => {
            if (result.status.isFinalized) {
              unsub()
              resolve(result)
            }
          }
        )
      }
      method()
    })
  }

  addToQueue = async (eoa: string, _startTime = Date.now()) => {
    const total = await this.redis.lpush(this.queueKey, eoa)
    this.logger.info(
      `futurepass_creation_queue requestCreation total - ${total} - ${eoa}`
    )
    this.startQueue()
  }

  private getApi = async () => {
    return await ApiPromise.create({
      ...getApiOptions(),
      provider: new WsProvider(this.rootNetworkSocket),
    })
  }

  private performBatch = async (eoas: string[]) => {
    this.logger.info(
      `futurepass_creation_queue performing_batch - length: ${eoas.length} - JSON.stringify(eoas)`
    )
    const notifyResult: Promise<number>[] = []
    const calls = eoas.map((eoa) => {
      notifyResult.push(
        this.redis.publish(
          REDIS_FUTUREPASS_CREATED_CHANNEL_NAME,
          JSON.stringify({ eoa })
        )
      )
      return this.api.tx['futurepass']['create'](eoa)
    })

    const extrinsic = this.api.tx['utility']['batch'](calls)
    const nonce = await this.api.rpc.system.accountNextIndex(
      this.keyPair.address
    )
    const currentNonce = parseInt(nonce.toString())

    await this.callExtrinsic(extrinsic, currentNonce)
    await Promise.allSettled(notifyResult)
    this.logger.info(
      `futurepass_creation_queue Finished - Total processed ${eoas.length}`
    )
  }
}

import { EventEmitter } from 'events'
import Redis from 'ioredis'
import { REDIS_FUTUREPASS_CREATED_CHANNEL_NAME } from '../utils/constants'

export class RedisSubscribers {
  constructor(private redis: Redis, private eventEmitter: EventEmitter) {}

  public start = async () => {
    await this.redis.subscribe(REDIS_FUTUREPASS_CREATED_CHANNEL_NAME)

    this.redis.on('message', (channel, message) => {
      if (channel === REDIS_FUTUREPASS_CREATED_CHANNEL_NAME) {
        this.eventEmitter.emit(REDIS_FUTUREPASS_CREATED_CHANNEL_NAME, message)
      }
    })
  }
}

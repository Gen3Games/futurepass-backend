import Redis from 'ioredis'
import { FuturepassCreationQueue } from './futurepassCreationQueue'

// Mocking dependencies
jest.mock('ioredis')
jest.mock('@polkadot/api')
jest.mock('@therootnetwork/api')

describe('FuturepassCreationQueue', () => {
  let mockRedis: jest.Mocked<Redis>
  let futurepassQueue: FuturepassCreationQueue

  beforeEach(() => {
    mockRedis = new Redis() as jest.Mocked<Redis>
    futurepassQueue = new FuturepassCreationQueue(
      mockRedis,
      '0xc1f80443352850309ea40266d387bb8c1aa3a21d41929617fae3bf44fb13a3d9',
      'rootNetworkSocket',
      {
        info: jest.fn(),
      },
      450
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('startQueue', () => {
    it('should start the queue', async () => {
      const setnxMock = jest.spyOn(mockRedis, 'setnx').mockResolvedValue(1)
      const startQueueWithRetriesMock = jest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- this is just for testing
        .spyOn(futurepassQueue as any, 'startQueueWithRetries')
        .mockResolvedValueOnce(undefined)

      await futurepassQueue.startQueue()

      expect(setnxMock).toHaveBeenCalledWith(
        futurepassQueue['singleInstanceLock'],
        'INIT_LOCK'
      )
      expect(startQueueWithRetriesMock).toHaveBeenCalled()
    })

    it('should not start the queue if lock is already set', async () => {
      jest.spyOn(mockRedis, 'setnx').mockResolvedValue(0)
      const startQueueWithRetriesMock = jest.spyOn(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- this is just for testing
        futurepassQueue as any,
        'startQueueWithRetries'
      )

      await futurepassQueue.startQueue()

      expect(startQueueWithRetriesMock).not.toHaveBeenCalled()
    })
  })
})

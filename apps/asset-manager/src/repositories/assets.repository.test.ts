import { Readable } from 'stream'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommandOutput,
} from '@aws-sdk/client-s3'

import _ from 'multer'
import stylelint from 'stylelint'
import { config } from '../config'
import {
  parseS3responseToString,
  getAssetCategory,
  validateCssFile,
  uploadAssets,
  updateOrCreateManifestFile,
} from './assets.repository'

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectsCommand: jest.fn(),
}))

jest.mock('@aws-sdk/client-cloudfront', () => ({
  CloudFrontClient: jest.fn(() => ({
    send: jest.fn(),
  })),
  CreateInvalidationCommand: jest.fn(),
}))

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid'),
}))

jest.mock('stylelint', () => ({
  lint: jest.fn(),
}))

jest.mock('stream', () => ({
  Readable: jest.requireActual('stream').Readable,
}))

describe('parseS3responseToString', () => {
  it('parses the S3 response to a string', async () => {
    const mockData = Buffer.from('test data')
    const mockStream = new Readable()
    mockStream.push(mockData)
    mockStream.push(null)
    const mockResponse = {
      Body: mockStream,
    } as GetObjectCommandOutput

    const result = await parseS3responseToString(mockResponse)
    expect(result).toBe('test data')
  })
})

describe('getAssetCategory', () => {
  it('returns the correct asset category', () => {
    expect(getAssetCategory('image/png')).toBe('images')
    expect(getAssetCategory('font/ttf')).toBe('fonts')
    expect(getAssetCategory('application/json')).toBe('config')
    expect(getAssetCategory('text/css')).toBe('styles')
  })

  it('throws an error for unsupported file types', () => {
    expect(() => getAssetCategory('unsupported/type')).toThrow(
      'Unsupported file type: unsupported/type'
    )
  })
})

describe('validateCssFile', () => {
  it('validates the CSS file and throws an error for invalid CSS', async () => {
    const errors = [
      {
        line: 26,
        column: 4,
        endLine: 26,
        endColumn: 7,
        rule: 'selector-type-no-unknown',
        severity: 'error',
        text: 'Unexpected unknown type selector "asd" (selector-type-no-unknown)',
        url: undefined,
      },
    ]
    const mockFile = {
      mimetype: 'text/css',
      size: 1000,
      buffer: Buffer.from('.invalid-css { color: #fff }'),
    } as Express.Multer.File

    ;(stylelint.lint as jest.Mock).mockResolvedValue({
      errored: true,
      results: [{ warnings: errors }],
    })

    await expect(validateCssFile(mockFile)).rejects.toThrow(
      JSON.stringify(errors)
    )
    expect(stylelint.lint).toHaveBeenCalled()
  })

  it('throws an error if the file is not a CSS file', async () => {
    const mockFile = {
      mimetype: 'text/html',
      size: 1000,
      buffer: Buffer.from(''),
    } as Express.Multer.File

    await expect(validateCssFile(mockFile)).rejects.toThrow('File is not a CSS')
  })

  it('throws an error if the CSS file size exceeds the limit', async () => {
    const mockFile = {
      mimetype: 'text/css',
      size: 6 * 1024 * 1024,
      buffer: Buffer.from(''),
    } as Express.Multer.File

    await expect(validateCssFile(mockFile)).rejects.toThrow(
      'CSS file max size exceeded'
    )
  })
})

describe('uploadAssets', () => {
  it('uploads assets to S3 and handles validations', async () => {
    const mockFile = {
      mimetype: 'image/png',
      originalname: 'test.png',
      buffer: Buffer.from('test'),
    } as Express.Multer.File

    const files = {
      file1: [mockFile],
    }

    const mockSend = jest.fn().mockResolvedValue({})
    ;(S3Client as jest.Mock).mockImplementation(() => ({ send: mockSend }))

    const result = await uploadAssets(files, 'test-uuid')

    expect(result).toEqual([expect.objectContaining({ status: 'fulfilled' })])
    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: config.assetsBucketName,
      Key: `futurepass/test-uuid/assets/images/test.png`,
      Body: mockFile.buffer,
      ContentType: mockFile.mimetype,
    })
  })
})

describe('updateOrCreateManifestFile', () => {
  it('updates the manifest file if it exists', async () => {
    const mockSend = jest.fn()
    mockSend.mockResolvedValueOnce({
      Body: Readable.from([Buffer.from('{"files": {}}')]),
    })
    mockSend.mockResolvedValueOnce({})
    ;(S3Client as jest.Mock).mockImplementation(() => ({ send: mockSend }))

    const manifestContent = { 'images/test.png': 'url' }
    const result = await updateOrCreateManifestFile(
      'futurepass/test-uuid',
      manifestContent
    )

    expect(result).toEqual({ files: manifestContent })
  })

  it('creates a new manifest file if it does not exist', async () => {
    const mockSend = jest.fn()
    mockSend.mockRejectedValueOnce(new Error('NoSuchKey'))
    mockSend.mockResolvedValueOnce({})
    ;(S3Client as jest.Mock).mockImplementation(() => ({ send: mockSend }))

    const manifestContent = { 'images/test.png': 'url' }
    const result = await updateOrCreateManifestFile(
      'test-uuid',
      manifestContent
    )

    expect(result).toEqual({ files: manifestContent })
  })
})

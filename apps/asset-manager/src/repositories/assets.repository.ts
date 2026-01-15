import { Readable } from 'stream'
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from '@aws-sdk/client-cloudfront'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommandOutput,
  GetObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3'
import { transform } from 'lodash'
import stylelint from 'stylelint'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../config'

type UploadParams = {
  files: { [key: string]: Express.Multer.File[] }
  uuid: string
}

const s3Client = new S3Client()
const cloudFrontClient = new CloudFrontClient()
const S3_KEY_PREFIX = 'futurepass'

export const uploadToS3 = async (
  Bucket: string,
  Key: string,
  Body: Buffer,
  ContentType: string
) => {
  const params = {
    Bucket,
    Key,
    Body,
    ContentType,
  }
  const command = new PutObjectCommand(params)
  return s3Client.send(command)
}

export const parseS3responseToString = (
  s3Response: GetObjectCommandOutput
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const responseDataChunks: Buffer[] = []
    const stream = s3Response.Body as Readable
    stream.once('error', (err) => reject(err))
    stream.on('data', (chunk) => responseDataChunks.push(chunk))
    stream.once('end', () =>
      resolve(Buffer.concat(responseDataChunks).toString())
    )
  })
}

export const getManifestFile = async (clientManifestKey: string) => {
  const clientManifestCommand = new GetObjectCommand({
    Bucket: config.assetsBucketName,
    Key: clientManifestKey,
  })
  const clientManifest = await s3Client.send(clientManifestCommand)
  return JSON.parse(await parseS3responseToString(clientManifest))
}

export const invalidateDistribution = async (clientUuid: string) => {
  // Create CloudFront invalidation
  const invalidationParams = {
    DistributionId: config.futurepassCdnDistributionId,
    InvalidationBatch: {
      Paths: {
        Quantity: 1,
        Items: [`/${S3_KEY_PREFIX}/${clientUuid}/*`],
      },
      CallerReference: uuidv4(),
    },
  }

  const invalidationCommand = new CreateInvalidationCommand(invalidationParams)
  await cloudFrontClient.send(invalidationCommand)
}

export const getAssetCategory = (mimetype: string, fileName?: string) => {
  let assetType = ''
  if (['image/png', 'image/jpeg'].includes(mimetype)) {
    assetType = 'images'
  }
  if ('font/ttf' == mimetype) {
    assetType = 'fonts'
  }
  if ('application/json' == mimetype) {
    if (fileName?.includes('translation')) {
      assetType = 'i18n'
    } else {
      assetType = 'config'
    }
  }
  if ('text/css' == mimetype) {
    assetType = 'styles'
  }

  if (!assetType) {
    throw Error(`Unsupported file type: ${mimetype}`)
  }
  return assetType
}

export const validateCssFile = async (file: Express.Multer.File) => {
  const maxSizeMB = 5 * 1024 * 1024
  if (file.mimetype != 'text/css') {
    throw Error('File is not a CSS')
  }

  if (file.size > maxSizeMB) {
    throw Error('CSS file max size exceeded')
  }

  const cssContent = file.buffer.toString('utf8')
  // Validate the CSS content with stylelint
  const lintResult = await stylelint.lint({
    code: cssContent,
    config: {
      rules: {
        'no-empty-source': true, // Prevent empty files
        'color-no-invalid-hex': true, // Disallow invalid hex colors
        'function-calc-no-unspaced-operator': true, // Disallow unspaced operators in calculations
        'string-no-newline': true, // Disallow (unescaped) newlines in strings
        'unit-no-unknown': true, // Disallow unknown units
        'no-duplicate-at-import-rules': true, // Disallow duplicate `@import` rules
        'no-unknown-animations': true, // Disallow unknown animations
        'selector-type-no-unknown': [true, { ignore: ['custom-elements'] }], // Disallow unknown type selectors
        'property-no-unknown': true, // Disallow unknown properties
        'selector-pseudo-class-no-unknown': true, // Disallow unknown pseudo-class selectors
        'selector-pseudo-element-no-unknown': true, // Disallow unknown pseudo-element selectors
        'at-rule-no-unknown': [
          true,
          { ignoreAtRules: ['extends', 'tailwind'] },
        ], // Disallow unknown at-rules, except common preprocessor rules
      },
    },
  })

  if (lintResult.errored) {
    const errors = lintResult.results[0].warnings
    console.error(errors)
    throw Error(JSON.stringify(errors))
  }
}

export const uploadAssets = async (
  files: { [key: string]: Express.Multer.File[] },
  clientUuid: string
) => {
  const allFiles = transform(
    files,
    (result, value) => result.push(...value),
    [] as Express.Multer.File[]
  )

  const promises = allFiles.map(async (file) => {
    const category = getAssetCategory(file.mimetype, file.originalname)
    const s3Key = `${S3_KEY_PREFIX}/${clientUuid}/assets/${category}/${file.originalname}`

    if (file.mimetype == 'text/css') {
      await validateCssFile(file)
    }
    await uploadToS3(config.assetsBucketName, s3Key, file.buffer, file.mimetype)
    return {
      category,
      s3Key,
      fileName: file.originalname,
    }
  })
  return Promise.allSettled(promises)
}

export const updateOrCreateManifestFile = async (
  clientUuid: string,
  manifestContent: { [key: string]: string }
) => {
  const clientManifestKey = `${S3_KEY_PREFIX}/${clientUuid}/assets/manifest.json`
  try {
    const clientManifestContent = await getManifestFile(clientManifestKey)
    const updatedManifest = {
      files: {
        ...clientManifestContent.files,
        ...manifestContent,
      },
    }

    console.log('update manifest', updatedManifest)
    await uploadToS3(
      config.assetsBucketName,
      clientManifestKey,
      Buffer.from(JSON.stringify(updatedManifest)),
      'application/json'
    )
    return updatedManifest
  } catch (error) {
    console.log('new manifest url', manifestContent)
    const newManifest = { files: manifestContent }
    // If the manifest does not exist, create a new one
    await uploadToS3(
      config.assetsBucketName,
      clientManifestKey,
      Buffer.from(JSON.stringify(newManifest)),
      'application/json'
    )
    return newManifest
  }
}

export const handleUpload = async ({ files, uuid }: UploadParams) => {
  const generatedManifestContent: { [key: string]: string } = {}

  const uploadResults = await uploadAssets(files, uuid)

  const errors: string[] = []

  uploadResults.map((uploadResult) => {
    if (uploadResult.status == 'rejected') {
      errors.push(uploadResult.reason.message)
      return
    }

    const { category, fileName, s3Key } = uploadResult.value
    const manifestKey = `${category}/${fileName}`
    const manifestValue = `${config.futurepassCdn}/${s3Key}`
    generatedManifestContent[manifestKey] = manifestValue
  })
  // if no assets to upload then skip
  if (!Object.keys(generatedManifestContent).length) {
    return {
      errors,
      manifestContent: generatedManifestContent,
    }
  }
  const manifestContent = await updateOrCreateManifestFile(
    uuid,
    generatedManifestContent
  )

  await invalidateDistribution(uuid)

  return {
    errors,
    manifestContent,
  }
}

export const handleDelete = async (fileNames: string[], uuid: string) => {
  try {
    const clientManifestKey = `${S3_KEY_PREFIX}/${uuid}/assets/manifest.json`
    const clientManifestContent = await getManifestFile(clientManifestKey)

    const deleteParams = {
      Bucket: config.assetsBucketName,
      Delete: {
        Objects: fileNames.map((Key) => {
          const value = clientManifestContent['files'][Key]
          if (!value) {
            throw new Error(`Key ${Key} doesn't exist in manifest file`)
          }
          const keyToDelete = value
            .replace(
              new RegExp('\\b' + `${config.futurepassCdn}/` + '\\b', 'g'),
              ''
            )
            .trim()
          /* eslint-disable-next-line @typescript-eslint/no-dynamic-delete */
          delete clientManifestContent['files'][Key]
          return {
            Key: keyToDelete,
          }
        }),
      },
    }

    const deleteCommand = new DeleteObjectsCommand(deleteParams)

    await s3Client.send(deleteCommand)

    await uploadToS3(
      config.assetsBucketName,
      clientManifestKey,
      Buffer.from(JSON.stringify(clientManifestContent)),
      'application/json'
    )
    await invalidateDistribution(uuid)
    console.log('deleted items', deleteParams.Delete.Objects)
    console.log('updated manifest', clientManifestContent)
  } catch (error) {
    console.log(error)
  }
}

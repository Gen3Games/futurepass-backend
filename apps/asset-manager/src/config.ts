export const config = {
  futurepassCdn:
    process.env.FUTUREPASS_CDN_DOMAIN || 'https://cdn.futureverse.dev',
  assetsBucketName: process.env.ASSETS_BUCKET_NAME || 'customer_web_assets',
  futurepassCdnDistributionId:
    process.env.FUTUREPASS_CDN_CLOUDFRONT_DISTRIBUTION_ID,
}

const { getAffectedCommits } = require('./utils')

module.exports = {
  verifyConditions: async (pluginConfig, context) => {
    const { commits, logger } = context

    const packageName = process.env.PACKAGE_NAME
    if (!packageName) {
      throw new Error('PACKAGE_NAME environment variable is required')
    }

    // Filter commits that affect the specified directory
    const affectedCommits = getAffectedCommits({
      commits,
      dir: `libs/${packageName}`,
    })

    logger.log(
      `Found ${affectedCommits.length} affected commits in libs/${process.env.PACKAGE_NAME}`
    )

    if (affectedCommits.length === 0) {
      logger.log(`No changes in libs/${process.env.PACKAGE_NAME}`)
      return null
    }

    // Dynamically import @semantic-release/changelog
    const { verifyConditions } = await import('@semantic-release/changelog')
    console.log('CHANGELO_CONFIG', pluginConfig)
    // Generate changelog for the filtered commits
    return verifyConditions(pluginConfig, {
      ...context,
      commits: affectedCommits,
    })
  },
}

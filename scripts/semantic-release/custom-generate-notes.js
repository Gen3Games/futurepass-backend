const { getAffectedCommits } = require('./utils')

module.exports = {
  generateNotes: async (pluginConfig, context) => {
    const { commits, logger } = context;

    const packageName = process.env.PACKAGE_NAME;
    if (!packageName) {
      throw new Error('PACKAGE_NAME environment variable is required');
    }

    // Filter commits that affect the specified directory
    const affectedCommits = getAffectedCommits({ commits, dir: `libs/${packageName}` });

    logger.log(`Found ${affectedCommits.length} affected commits in libs/${packageName}`);

    if (affectedCommits.length === 0) {
      logger.log(`No changes in libs/${process.env.PACKAGE_NAME}`);
      return null;
    }

    // Dynamically import @semantic-release/release-notes-generator
    const { generateNotes } = await import('@semantic-release/release-notes-generator');

    // Generate notes for the filtered commits
    return generateNotes(pluginConfig, { ...context, commits: affectedCommits });
  }
};

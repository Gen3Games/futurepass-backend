const { getAffectedCommits } = require('./utils')

module.exports = {
  analyzeCommits: async (pluginConfig, context) => {
    const { commits } = context;

    const packageName = process.env.PACKAGE_NAME;
    if (!packageName) {
      throw new Error('PACKAGE_NAME environment variable is required');
    }

    // Filter commits that affect the specified directory
    const affectedCommits = getAffectedCommits({ commits, dir: `libs/${packageName}` });

    if (context.commits.length === 0) {
      console.log(`No relevant changes in libs/${packageName}`);
    } else {
      console.log(`Found ${context.commits.length} relevant commits in libs/${packageName}`);
    }
    const { analyzeCommits } = await import('@semantic-release/commit-analyzer');
    // Analyze the filtered commits
    return analyzeCommits(pluginConfig, { ...context, commits: affectedCommits });
  }
};

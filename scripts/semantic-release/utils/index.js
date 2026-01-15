const { execSync } = require('child_process');

const getAffectedCommits = ({ commits, dir }) => {
  return commits.filter((commit) => {
    try {
      const result = execSync(
        `git diff --name-only ${commit.hash}^ ${commit.hash} -- ${dir}`
      )
        .toString()
        .trim()
      return result.length > 0
    } catch (error) {
      console.error(`Error checking commit ${commit.hash}:`, error)
      return false
    }
  })
}

module.exports = {
  getAffectedCommits,
}

const { Octokit } = require('@octokit/rest');

// GitHub API for storage
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const REPO_OWNER = 'PageDAO';
const REPO_NAME = 'registry-db';
const FILE_PATH = 'data/registry.json';

// Get the current registry
async function getRegistry() {
  try {
    // Fetch from GitHub
    const response = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH,
      ref: 'master'
    });
    
    const content = Buffer.from(response.data.content, 'base64').toString();
    return JSON.parse(content);
  } catch (error) {
    console.error('Error fetching registry:', error);
    // Return empty registry as fallback
    return {
      base: [],
      ethereum: [],
      polygon: [],
      zora: [],
      optimism: []
    };
  }
}

// Update the registry
async function updateRegistry(data) {
  try {
    // Get current file to get the SHA
    const currentFile = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH,
      ref: 'master'
    });

    // Update file in GitHub
    const response = await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH,
      message: 'Update registry via API',
      content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
      sha: currentFile.data.sha,
      branch: 'master'
    });
    
    return { success: true, commit: response.data.commit };
  } catch (error) {
    console.error('Error updating registry:', error);
    throw error;
  }
}

// Authenticate requests (implement your auth strategy)
async function authenticate(token) {
  // Simple token validation for example
  return token === process.env.API_TOKEN;
}

module.exports = { getRegistry, updateRegistry, authenticate };

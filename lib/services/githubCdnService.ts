/**
 * GitHub CDN Service
 * Cross-feature service for hosting files on GitHub + jsDelivr CDN
 * Supports: images, documents, receipts, vehicle photos
 */
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type FileCategory = 'products' | 'vehicles' | 'receipts' | 'documents' | 'general';

interface UploadOptions {
  category: FileCategory;
  id: string;
  content: Buffer;
  mimeType: string;
  message?: string;
}

interface UploadResult {
  cdnUrl: string;
  githubUrl: string;
  path: string;
  commitSha: string;
  size: number;
}

interface CdnConfig {
  repo: string;
  branch: string;
  token: string;
}

function getConfig(): CdnConfig {
  const repo = process.env.GITHUB_CDN_REPO || process.env.PRODUCT_IMAGES_REPO;
  const branch = process.env.GITHUB_CDN_BRANCH || process.env.PRODUCT_IMAGES_BRANCH || 'main';
  const token = process.env.PRODUCT_IMAGES_TOKEN;

  if (!repo || !token) {
    throw new Error('Missing GITHUB_CDN_REPO or PRODUCT_IMAGES_TOKEN env vars');
  }

  return { repo, branch, token };
}

function buildUrls(config: CdnConfig, path: string): { cdnUrl: string; githubUrl: string } {
  const [owner, repo] = config.repo.split('/');
  
  // jsDelivr CDN URL
  const cdnUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${config.branch}/${path}`;
  
  // Direct GitHub raw URL (fallback)
  const githubUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${config.branch}/${path}`;
  
  return { cdnUrl, githubUrl };
}

function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/json': 'json',
  };
  return map[mimeType] || 'bin';
}

/**
 * Check if file exists in GitHub and return SHA for updates
 */
async function getFileSha(url: string, token: string): Promise<string | undefined> {
  try {
    const checkCmd = `curl -s -w "\\nHTTP_CODE:%{http_code}" \
      "${url}" \
      -H "Authorization: Bearer ${token}" \
      -H "Accept: application/vnd.github+json" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      -H "User-Agent: RPM-CDN/1.0"`;

    const { stdout } = await execAsync(checkCmd);
    const httpCodeMatch = stdout.match(/HTTP_CODE:(\d+)$/);
    const httpCode = httpCodeMatch ? parseInt(httpCodeMatch[1], 10) : 0;
    const responseBody = stdout.replace(/\nHTTP_CODE:\d+$/, '');

    if (httpCode === 200) {
      const data = JSON.parse(responseBody);
      return data.sha;
    }
  } catch {
    // File doesn't exist
  }
  return undefined;
}

/**
 * Upload file to GitHub CDN
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const config = getConfig();
  const { category, id, content, mimeType, message } = options;

  const ext = getExtensionFromMimeType(mimeType);
  const path = `files/${category}/${id}.${ext}`;
  const url = `https://api.github.com/repos/${config.repo}/contents/${path}`;
  const base64Content = content.toString('base64');

  // Check if file exists
  const sha = await getFileSha(url, config.token);

  // Build request body
  const body: Record<string, string> = {
    message: message || `Upload ${category}: ${id}`,
    content: base64Content,
    branch: config.branch,
  };
  if (sha) {
    body.sha = sha;
  }

  // Execute curl PUT
  const curlCmd = `curl -s -X PUT "${url}" \
    -H "Authorization: Bearer ${config.token}" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -H "User-Agent: RPM-CDN/1.0" \
    -d '${JSON.stringify(body).replace(/'/g, "'\"'\"'")}'`;

  const { stdout, stderr } = await execAsync(curlCmd);

  if (stderr) {
    console.error('Curl stderr:', stderr);
  }

  if (!stdout) {
    throw new Error('GitHub API: No response');
  }

  const result = JSON.parse(stdout);
  const commitSha = result.commit?.sha || result.content?.sha;

  if (!commitSha) {
    console.error('GitHub API unexpected response:', Object.keys(result));
    throw new Error('GitHub API: Missing commit SHA in response');
  }

  const { cdnUrl, githubUrl } = buildUrls(config, path);

  return {
    cdnUrl,
    githubUrl,
    path,
    commitSha,
    size: content.length,
  };
}

/**
 * Delete file from GitHub CDN
 */
export async function deleteFile(category: FileCategory, id: string, ext: string): Promise<void> {
  const config = getConfig();
  const path = `files/${category}/${id}.${ext}`;
  const url = `https://api.github.com/repos/${config.repo}/contents/${path}`;

  // Get SHA
  const sha = await getFileSha(url, config.token);
  if (!sha) {
    throw new Error('File not found in CDN');
  }

  const body = {
    message: `Delete ${category}: ${id}`,
    sha,
    branch: config.branch,
  };

  const curlCmd = `curl -s -X DELETE "${url}" \
    -H "Authorization: Bearer ${config.token}" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -H "User-Agent: RPM-CDN/1.0" \
    -d '${JSON.stringify(body).replace(/'/g, "'\"'\"'")}'`;

  const { stdout, stderr } = await execAsync(curlCmd);

  if (stderr) {
    console.error('Curl delete stderr:', stderr);
  }

  if (!stdout) {
    throw new Error('Delete failed: No response');
  }
}

/**
 * Get CDN URL for a file (without uploading)
 */
export function getCdnUrl(category: FileCategory, id: string, ext: string): string {
  const config = getConfig();
  const path = `files/${category}/${id}.${ext}`;
  const [owner, repo] = config.repo.split('/');
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${config.branch}/${path}`;
}

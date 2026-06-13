import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * In-memory cache for tool descriptions
 * Avoids repeated file system reads
 */
const descriptionCache = new Map<string, string>();

/**
 * Load tool description from markdown file with caching
 * @param toolName - Name of the tool (e.g., 'get-product')
 * @returns The markdown description content
 */
export function loadToolDescription(toolName: string): string {
  // Check cache first
  if (descriptionCache.has(toolName)) {
    return descriptionCache.get(toolName)!;
  }

  // Load from file system
  const descriptionPath = join(
    process.cwd(),
    'lib',
    'bot',
    'tools',
    toolName,
    'description.md'
  );

  try {
    const content = readFileSync(descriptionPath, 'utf-8');
    descriptionCache.set(toolName, content);
    return content;
  } catch (error) {
    console.error(`Failed to load description for tool "${toolName}":`, error);
    return '';
  }
}

/**
 * Clear the description cache (useful for testing)
 */
export function clearDescriptionCache(): void {
  descriptionCache.clear();
}

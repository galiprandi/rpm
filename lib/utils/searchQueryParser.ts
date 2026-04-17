/**
 * Search Query Parser
 * 
 * Parses advanced search queries with the following syntax:
 * - "phrase" → exact match (substring)
 * - term1+term2 → required AND (split by +)
 * - term1 term2 → optional OR (split by space)
 * 
 * Spec: /specs/components/product-service-selector.md
 * 
 * @example
 * parseSearchQuery('led+cronos')
 * // { required: ['led', 'cronos'], optional: [], phrases: [] }
 * 
 * @example
 * parseSearchQuery('filtro aire')
 * // { required: [], optional: ['filtro', 'aire'], phrases: [] }
 * 
 * @example
 * parseSearchQuery('"LED-123"')
 * // { required: [], optional: [], phrases: ['led-123'] }
 */

export interface ParsedSearchTerms {
  required: string[];   // Terms that must ALL be present (AND logic)
  optional: string[];   // Terms where at least one must be present (OR logic)
  phrases: string[];    // Exact phrases that must be present
}

/**
 * Parse a search query into structured terms
 * 
 * Rules:
 * 1. Text in quotes is treated as exact phrase
 * 2. Terms separated by + are required (AND)
 * 3. Terms separated by space are optional (OR) - only when no + is used
 */
export function parseSearchQuery(query: string): ParsedSearchTerms {
  const terms: ParsedSearchTerms = {
    required: [],
    optional: [],
    phrases: [],
  };

  // Extract quoted phrases first (exact substring match)
  const phraseRegex = /"([^"]+)"/g;
  let match;
  let remainingQuery = query;

  while ((match = phraseRegex.exec(query)) !== null) {
    terms.phrases.push(match[1].toLowerCase());
    remainingQuery = remainingQuery.replace(match[0], ' ');
  }

  // Split by + to get required terms (AND logic)
  // Filter out empty segments that could result from leading/trailing +
  const rawSegments = remainingQuery
    .split('+')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const segment of rawSegments) {
    // A segment can have multiple words - they form a phrase that must be present
    const cleanSegment = segment.toLowerCase();
    if (cleanSegment.includes(' ')) {
      // Multi-word segment: treat as a required phrase
      terms.required.push(cleanSegment);
    } else {
      // Single word: required term
      terms.required.push(cleanSegment);
    }
  }

  // If no + was used (only one segment and no phrases), treat as optional OR
  if (terms.required.length === 1 && terms.phrases.length === 0) {
    const singleSegment = terms.required[0];
    // Check if it has spaces - if so, split into optional terms
    if (singleSegment.includes(' ')) {
      terms.optional = singleSegment.split(/\s+/).filter(w => w.length > 0);
      terms.required = [];
    } else {
      terms.optional = [singleSegment];
      terms.required = [];
    }
  }

  return terms;
}

/**
 * Check if a search query uses advanced syntax
 */
export function isAdvancedSearch(query: string): boolean {
  return query.includes('+') || query.includes('"');
}

/**
 * Normalize search query for display/logging
 */
export function normalizeSearchQuery(query: string): string {
  const terms = parseSearchQuery(query);
  
  if (terms.phrases.length > 0) {
    return `exact:"${terms.phrases[0]}"${terms.required.length > 0 ? ' + ' + terms.required.join(' + ') : ''}`;
  }
  
  if (terms.required.length > 0) {
    return `required:(${terms.required.join(' AND ')})`;
  }
  
  return `optional:(${terms.optional.join(' OR ')})`;
}

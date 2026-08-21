import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

import * as constants from './tools/constants.js'
import * as literatureSearch from './tools/literature-search.js'
import * as pubmed from './tools/pubmed.js'
import * as stats from './tools/stats.js'
import * as units from './tools/units.js'

export * as constants from './tools/constants.js'
export * as literatureSearch from './tools/literature-search.js'
export * as pubmed from './tools/pubmed.js'
export * as stats from './tools/stats.js'
export * as units from './tools/units.js'

export const name = 'skill-science'
export const inject = ['tools']

const JSON_TEXT_OUTPUT = {
  schema: { type: 'object' as const, additionalProperties: true },
  render: (_args: unknown, value: unknown) => [
    { type: 'text' as const, text: JSON.stringify(value, null, 2) },
  ],
}

export function apply(ctx: Context): void {
  // 1. Physical constants lookup
  ctx.tools.register(
    defineTool({
      name: 'lookup_physical_constant',
      description:
        'Look up standard CODATA 2018 physical and chemical constants by symbol (c, h, hbar, G, e, k_B, N_A, R, epsilon_0, m_e, m_p, sigma_SB).',
      parameters: {
        symbol: {
          type: 'string',
          required: true,
          description: 'Symbol of the constant to lookup (e.g., "c", "h", "k_B", "N_A", "G")',
        },
      },
      output: JSON_TEXT_OUTPUT,
      execute({ symbol }) {
        return Promise.resolve(constants.lookupConstant(symbol))
      },
    }),
  )

  // 2. Unit conversion
  ctx.tools.register(
    defineTool({
      name: 'convert_unit',
      description:
        'Accurately convert values between scientific units across categories: length, mass, energy, pressure, and temperature.',
      parameters: {
        value: { type: 'number', required: true, description: 'Numeric value to convert' },
        from: { type: 'string', required: true, description: 'Source unit symbol' },
        to: { type: 'string', required: true, description: 'Target unit symbol' },
        category: {
          type: 'string',
          required: true,
          description: 'Category: "length", "mass", "energy", "pressure", or "temperature"',
        },
      },
      output: JSON_TEXT_OUTPUT,
      execute({ value, from, to, category }) {
        let result: number
        switch (category) {
          case 'length':
            result = units.convertLength(value, from, to)
            break
          case 'mass':
            result = units.convertMass(value, from, to)
            break
          case 'energy':
            result = units.convertEnergy(value, from, to)
            break
          case 'pressure':
            result = units.convertPressure(value, from, to)
            break
          case 'temperature':
            result = units.convertTemperature(value, from as any, to as any)
            break
          default:
            throw new Error(`Unknown category: ${category}`)
        }
        return Promise.resolve({ value, from, to, category, result })
      },
    }),
  )

  // 3. arXiv search
  ctx.tools.register(
    defineTool({
      name: 'search_arxiv',
      description:
        'Search arXiv for preprint scientific papers matching query keywords. Returns title, authors, summary, and URL.',
      parameters: {
        query: { type: 'string', required: true, description: 'Search keywords or query' },
        maxResults: { type: 'number', required: false, description: 'Max results (default: 5)' },
      },
      output: JSON_TEXT_OUTPUT,
      async execute({ query, maxResults }) {
        const results = await literatureSearch.searchArxiv(query, maxResults ?? 5)
        return { count: results.length, results }
      },
    }),
  )

  // 4. PubMed search
  ctx.tools.register(
    defineTool({
      name: 'search_pubmed',
      description:
        'Search PubMed / NCBI Entrez for biomedical and life sciences literature. Returns PMIDs and paper metadata.',
      parameters: {
        term: { type: 'string', required: true, description: 'PubMed search term or MeSH query' },
        retmax: { type: 'number', required: false, description: 'Max citations to return (default: 5)' },
      },
      output: JSON_TEXT_OUTPUT,
      async execute({ term, retmax }) {
        const results = await pubmed.searchPubMed(term, retmax ?? 5)
        return { count: results.length, results }
      },
    }),
  )

  // 5. Statistics helpers
  ctx.tools.register(
    defineTool({
      name: 'stats_summary',
      description:
        'Compute statistical measures (mean, stddev, min, max, variance) for numeric data sets.',
      parameters: {
        values: {
          type: 'array',
          items: { type: 'number' },
          required: true,
          description: 'Array of numbers to analyze',
        },
      },
      output: JSON_TEXT_OUTPUT,
      execute({ values }) {
        return Promise.resolve(stats.summary(values))
      },
    }),
  )

  // 6. Linear regression
  ctx.tools.register(
    defineTool({
      name: 'stats_linear_regression',
      description:
        'Fit ordinary least squares linear regression (y = mx + b) and calculate coefficient of determination (r^2).',
      parameters: {
        x: { type: 'array', items: { type: 'number' }, required: true, description: 'X data points' },
        y: { type: 'array', items: { type: 'number' }, required: true, description: 'Y data points' },
      },
      output: JSON_TEXT_OUTPUT,
      execute({ x, y }) {
        return Promise.resolve(stats.linearRegression(x, y))
      },
    }),
  )
}

/**
 * @deepseek-harness/skill-science
 *
 * A self-contained scientific-capabilities skill plugin scaffold for DeepSeek Harness (dsh).
 * It packages the tool primitives described in "10 tips to add scientific capabilities to
 * DeepSeek Harness": unit conversion, physical constants, literature search, and statistics.
 *
 * INTEGRATION NOTE:
 * dsh's Cordis kernel treats every capability (tools, skills, sandboxes) as a plugin that
 * mounts through the host's plugin registry. This package exposes plain, dependency-free
 * TypeScript functions so they can be wrapped by whatever tool/skill registration API your
 * checkout of packages/skill or packages/core exposes (the exact registration surface can
 * change between dsh developer-preview builds, so wiring is left explicit here rather than
 * guessed). See README.md for a worked example of wrapping `scienceTools` as dsh tools.
 */

export * as units from "./tools/units.js";
export * as constants from "./tools/constants.js";
export * as literatureSearch from "./tools/literature-search.js";
export * as stats from "./tools/stats.js";

import * as units from "./tools/units.js";
import * as constants from "./tools/constants.js";
import * as literatureSearch from "./tools/literature-search.js";
import * as stats from "./tools/stats.js";

export interface ScienceToolDefinition {
  name: string;
  description: string;
  run: (...args: any[]) => unknown;
}

/**
 * A flat registry of callable tools, ready to be adapted into dsh's tool-plugin
 * interface (e.g. exposed to Code mode's TypeScript SDK, or wrapped as individual
 * Standard-mode tools).
 */
export const scienceTools: ScienceToolDefinition[] = [
  {
    name: "convert_length",
    description: "Convert a value between length units (m, km, cm, mm, nm, angstrom, mi, ft, in, au, ly, pc).",
    run: units.convertLength,
  },
  {
    name: "convert_mass",
    description: "Convert a value between mass units (kg, g, mg, lb, amu, Da, Msun).",
    run: units.convertMass,
  },
  {
    name: "convert_energy",
    description: "Convert a value between energy units (J, kJ, cal, kcal, eV, keV, MeV, Wh, kWh).",
    run: units.convertEnergy,
  },
  {
    name: "convert_pressure",
    description: "Convert a value between pressure units (Pa, kPa, bar, atm, torr, psi).",
    run: units.convertPressure,
  },
  {
    name: "convert_temperature",
    description: "Convert a value between temperature scales (C, F, K).",
    run: units.convertTemperature,
  },
  {
    name: "lookup_physical_constant",
    description: "Look up a CODATA physical constant by symbol (c, h, hbar, G, e, k_B, N_A, R, epsilon_0, m_e, m_p, sigma_SB).",
    run: constants.lookupConstant,
  },
  {
    name: "search_arxiv",
    description: "Search arXiv for papers matching a query string and return title/authors/summary/link.",
    run: literatureSearch.searchArxiv,
  },
  {
    name: "stats_mean",
    description: "Compute the arithmetic mean of a numeric array.",
    run: stats.mean,
  },
  {
    name: "stats_stddev",
    description: "Compute the (sample or population) standard deviation of a numeric array.",
    run: stats.stddev,
  },
  {
    name: "stats_linear_regression",
    description: "Fit a simple linear regression (slope, intercept, r^2) to paired x/y arrays.",
    run: stats.linearRegression,
  },
];

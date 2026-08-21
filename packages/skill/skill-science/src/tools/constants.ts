export interface PhysicalConstant {
  symbol: string;
  name: string;
  value: number;
  unit: string;
}

export const PHYSICAL_CONSTANTS: Record<string, PhysicalConstant> = {
  c: { symbol: "c", name: "Speed of light in vacuum", value: 299792458, unit: "m/s" },
  h: { symbol: "h", name: "Planck constant", value: 6.62607015e-34, unit: "J*s" },
  hbar: { symbol: "hbar", name: "Reduced Planck constant", value: 1.054571817e-34, unit: "J*s" },
  G: { symbol: "G", name: "Newtonian constant of gravitation", value: 6.6743e-11, unit: "m^3/(kg*s^2)" },
  e: { symbol: "e", name: "Elementary charge", value: 1.602176634e-19, unit: "C" },
  k_B: { symbol: "k_B", name: "Boltzmann constant", value: 1.380649e-23, unit: "J/K" },
  N_A: { symbol: "N_A", name: "Avogadro constant", value: 6.02214076e23, unit: "1/mol" },
  R: { symbol: "R", name: "Molar gas constant", value: 8.31446261815324, unit: "J/(mol*K)" },
  epsilon_0: { symbol: "epsilon_0", name: "Vacuum electric permittivity", value: 8.8541878128e-12, unit: "F/m" },
  m_e: { symbol: "m_e", name: "Electron mass", value: 9.1093837015e-31, unit: "kg" },
  m_p: { symbol: "m_p", name: "Proton mass", value: 1.67262192369e-27, unit: "kg" },
  sigma_SB: { symbol: "sigma_SB", name: "Stefan-Boltzmann constant", value: 5.670374419e-8, unit: "W/(m^2*K^4)" },
};

export function lookupConstant(symbol: string): PhysicalConstant {
  const found = PHYSICAL_CONSTANTS[symbol];
  if (!found) {
    throw new Error(`Unknown physical constant: ${symbol}`);
  }
  return found;
}

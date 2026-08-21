/**
 * Unit conversion helpers for scientific work (SI-first, common non-SI units included).
 * Tip #1: register domain tool plugins (unit conversion is one of the most requested).
 */

export type UnitCategory = "length" | "mass" | "energy" | "temperature" | "pressure" | "amount";

const LENGTH_TO_METER: Record<string, number> = {
  m: 1,
  km: 1000,
  cm: 0.01,
  mm: 0.001,
  nm: 1e-9,
  angstrom: 1e-10,
  mi: 1609.344,
  ft: 0.3048,
  in: 0.0254,
  au: 1.495978707e11,
  ly: 9.4607e15,
  pc: 3.0857e16,
};

const MASS_TO_KG: Record<string, number> = {
  kg: 1,
  g: 0.001,
  mg: 1e-6,
  lb: 0.45359237,
  amu: 1.66053906660e-27,
  Da: 1.66053906660e-27,
  Msun: 1.98847e30,
};

const ENERGY_TO_JOULE: Record<string, number> = {
  J: 1,
  kJ: 1000,
  cal: 4.184,
  kcal: 4184,
  eV: 1.602176634e-19,
  keV: 1.602176634e-16,
  MeV: 1.602176634e-13,
  Wh: 3600,
  kWh: 3.6e6,
};

const PRESSURE_TO_PASCAL: Record<string, number> = {
  Pa: 1,
  kPa: 1000,
  bar: 100000,
  atm: 101325,
  torr: 133.322,
  psi: 6894.757,
};

export function convertLinear(value: number, from: string, to: string, table: Record<string, number>): number {
  if (!(from in table) || !(to in table)) {
    throw new Error(`Unknown unit in conversion: ${from} -> ${to}`);
  }
  return (value * table[from]) / table[to];
}

export function convertLength(value: number, from: string, to: string): number {
  return convertLinear(value, from, to, LENGTH_TO_METER);
}

export function convertMass(value: number, from: string, to: string): number {
  return convertLinear(value, from, to, MASS_TO_KG);
}

export function convertEnergy(value: number, from: string, to: string): number {
  return convertLinear(value, from, to, ENERGY_TO_JOULE);
}

export function convertPressure(value: number, from: string, to: string): number {
  return convertLinear(value, from, to, PRESSURE_TO_PASCAL);
}

export function convertTemperature(value: number, from: "C" | "F" | "K", to: "C" | "F" | "K"): number {
  let kelvin: number;
  switch (from) {
    case "C": kelvin = value + 273.15; break;
    case "F": kelvin = ((value - 32) * 5) / 9 + 273.15; break;
    case "K": kelvin = value; break;
  }
  switch (to) {
    case "C": return kelvin - 273.15;
    case "F": return ((kelvin - 273.15) * 9) / 5 + 32;
    case "K": return kelvin;
  }
}

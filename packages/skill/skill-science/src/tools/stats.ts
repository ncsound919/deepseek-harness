/**
 * Lightweight statistics helpers for quick data-analysis sanity checks.
 * Tip #3 / Tip #6: give the agent verifiable compute primitives instead of asking the
 * LLM to do arithmetic/statistics purely by generation.
 */

export function mean(values: number[]): number {
  if (values.length === 0) throw new Error("mean: empty array");
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stddev(values: number[], sample = true): number {
  if (values.length < 2) throw new Error("stddev: need at least 2 values");
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - (sample ? 1 : 0));
  return Math.sqrt(variance);
}

export function linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
  if (x.length !== y.length || x.length < 2) {
    throw new Error("linearRegression: x and y must be same length and have >= 2 points");
  }
  const n = x.length;
  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    denX += (x[i] - mx) ** 2;
    denY += (y[i] - my) ** 2;
  }
  const slope = num / denX;
  const intercept = my - slope * mx;
  const r2 = (num * num) / (denX * denY);
  return { slope, intercept, r2 };
}

import type { Target, Lens } from "../types";
export function randomGenerator(seed: number): () => number;
export function shuffle<T>(items: T[], seed: number): T[];
export function orderTargets(
  targets: Target[],
  lens: Lens,
  seed?: number,
): Target[];
export function cumulative(items: Target[]): number[];
export function chanceEnvelope(
  items: Target[],
  seed?: number,
  replicates?: number,
): { low: number; high: number; mean: number }[];

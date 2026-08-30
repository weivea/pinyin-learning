import type { ReadingPassage } from '../types';
import raw from './readings.generated.json';

export const READINGS: ReadingPassage[] = raw as ReadingPassage[];

const BY_ID = new Map(READINGS.map((reading) => [reading.id, reading]));

export function getReading(id: string | undefined): ReadingPassage | undefined {
  if (!id) return undefined;
  return BY_ID.get(id);
}

export function getAdjacentReading(
  id: string,
): { previous?: ReadingPassage; next?: ReadingPassage } {
  const index = READINGS.findIndex((reading) => reading.id === id);
  if (index < 0) return {};
  return {
    previous: index > 0 ? READINGS[index - 1] : undefined,
    next: index < READINGS.length - 1 ? READINGS[index + 1] : undefined,
  };
}

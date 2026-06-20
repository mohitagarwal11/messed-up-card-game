import type { Player } from '../../../shared/types';

export type BoardPlayerLayout = {
  x: number;
  y: number;
  tilt: number;
  floatDuration: number;
  delay: number;
};

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Deterministic "random" number in [min, max], seeded by a string.
function seededRange(seed: string, min: number, max: number) {
  const ratio = hashString(seed) / 4294967295;
  return min + ratio * (max - min);
}

function getColumnCount(totalPlayers: number) {
  if (totalPlayers <= 2) return totalPlayers;
  if (totalPlayers <= 6) return 3;
  if (totalPlayers <= 10) return 4;
  return 5;
}

export function getBoardPlayerLayout(
  player: Player,
  index: number,
  totalPlayers: number,
): BoardPlayerLayout {
  const total = Math.max(totalPlayers, 1);
  const columns = Math.max(getColumnCount(total), 1);
  const rows = Math.ceil(total / columns);

  const column = index % columns;
  const row = Math.floor(index / columns);

  // Base grid position as a percentage (0-100), then nudge with per-card jitter.
  const colProgress = columns > 1 ? column / (columns - 1) : 0.5;
  const rowProgress = rows > 1 ? row / (rows - 1) : 0.5;

  // i hv no idea yet
  const jitterX = seededRange(`${player.id}-x`, -4, 4);
  const jitterY = seededRange(`${player.id}-y`, -4, 4);

  // overall position of the group of cards
  const x = 20 + colProgress * 23 + jitterX;
  const y = 26 + rowProgress * 50 + jitterY;

  return {
    x,
    y,
    tilt: 7,
    floatDuration: Math.floor(Math.random() * (12 - 8 + 1)) + 8,
    delay: Math.floor(Math.random() * (2 - 0.5 + 1)) + 0.5,
  };
}

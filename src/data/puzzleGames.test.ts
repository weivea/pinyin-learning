import { describe, expect, it } from 'vitest';
import { ALL_GAME_TYPES, GAME_INFO, PUZZLE_GAME_TYPES, isPuzzleGame } from './games';
import {
  PUZZLE_ROUND_COUNT,
  buildMazeRound,
  buildMissingRound,
  buildPatternRound,
  buildShapeRound,
  buildSortingRound,
  canMoveInMaze,
  canPlaceShape,
  mazePath,
  puzzleStage,
  scorePuzzleRound,
  type ShapePiece,
  type ShapeSlot,
} from './puzzleGames';

describe('preschool game catalog', () => {
  it('keeps the four existing games and registers five distinct puzzle games', () => {
    expect(ALL_GAME_TYPES).toHaveLength(9);
    expect(new Set(ALL_GAME_TYPES).size).toBe(9);
    expect(Object.keys(GAME_INFO).sort()).toEqual([...ALL_GAME_TYPES].sort());
    expect(ALL_GAME_TYPES.filter(isPuzzleGame)).toEqual(PUZZLE_GAME_TYPES);
  });
});

describe('puzzle rounds', () => {
  it('provides fifty distinct, repeatable levels for every game', () => {
    expect(PUZZLE_ROUND_COUNT).toBe(50);
    const fingerprints = { pattern: new Set(), missing: new Set(), sorting: new Set(), maze: new Set(), shapes: new Set() };
    for (let level = 0; level < PUZZLE_ROUND_COUNT; level++) {
      const pattern = buildPatternRound(level);
      const missing = buildMissingRound(level);
      const sorting = buildSortingRound(level);
      const maze = buildMazeRound(level);
      const shapes = buildShapeRound(level);
      expect(buildPatternRound(level)).toEqual(pattern);
      expect(buildMissingRound(level)).toEqual(missing);
      expect(buildSortingRound(level)).toEqual(sorting);
      expect(buildMazeRound(level)).toEqual(maze);
      expect(buildShapeRound(level)).toEqual(shapes);
      fingerprints.pattern.add(`${pattern.sequence.map(picture => picture.id)}:${pattern.gap}`);
      fingerprints.missing.add(`${missing.pictures.map(picture => picture.id)}:${missing.missing.id}`);
      fingerprints.sorting.add(`${sorting.rule}:${sorting.animals.map(animal => `${animal.kind}-${animal.color}-${animal.size}`).sort()}`);
      fingerprints.maze.add(maze.cells.join(''));
      fingerprints.shapes.add(shapes.slots.map(slot => `${slot.kind}:${slot.x},${slot.y},${slot.size},${slot.rotation}`).sort().join('|'));
    }
    for (const [game, values] of Object.entries(fingerprints)) {
      expect(values.size, `${game} must not just repeat the first five rounds`).toBe(50);
    }
  });

  it('rejects levels outside the fifty-level bank', () => {
    for (const level of [-1, 50, 1.5, NaN]) {
      for (const build of [buildPatternRound, buildMissingRound, buildSortingRound, buildMazeRound, buildShapeRound]) {
        expect(() => build(level)).toThrow(RangeError);
      }
    }
  });

  it('builds unambiguous repeating patterns with exactly one correct choice', () => {
    for (let level = 0; level < PUZZLE_ROUND_COUNT; level++) {
        const round = buildPatternRound(level);
        expect(round.sequence.length).toBeGreaterThanOrEqual(round.unit.length * 2);
        round.sequence.forEach((picture, index) => {
          expect(picture).toEqual(round.unit[index % round.unit.length]);
        });
        expect(round.answer).toEqual(round.sequence[round.gap]);
        expect(round.options.filter(picture => picture.id === round.answer.id)).toHaveLength(1);
        expect(new Set(round.options.map(picture => picture.id)).size).toBe(round.options.length);
    }
    const last = buildPatternRound(49);
    expect(last.gap).toBeGreaterThan(0);
    expect(last.gap).toBeLessThan(last.sequence.length - 1);
  });

  it('increases memory set size without duplicate or impossible answers', () => {
    for (let level = 0; level < PUZZLE_ROUND_COUNT; level++) {
        const round = buildMissingRound(level);
        expect(round.pictures).toHaveLength([3, 4, 5, 6, 6][puzzleStage(level)]);
        expect(new Set(round.pictures.map(picture => picture.id)).size).toBe(round.pictures.length);
        expect(round.options.filter(picture => picture.id === round.missing.id)).toHaveLength(1);
        expect(round.options.every(picture => round.pictures.includes(picture))).toBe(true);
        expect(new Set(round.options.map(picture => picture.id)).size).toBe(round.options.length);
    }
  });

  it('switches classification rules and gives every animal exactly one home', () => {
    for (let level = 0; level < PUZZLE_ROUND_COUNT; level++) {
      const round = buildSortingRound(level);
      expect(round.rule).toBe(['kind', 'color', 'size'][level < 30 ? puzzleStage(level) : level % 3]);
      expect(round.animals).toHaveLength(level < 30 ? 4 : 6);
      expect(new Set(round.animals.map(animal => animal.id)).size).toBe(round.animals.length);
      for (const animal of round.animals) {
        expect(round.groups.filter(group => group.value === animal[round.rule])).toHaveLength(1);
      }
      for (const group of round.groups) {
        expect(round.animals.some(animal => animal[round.rule] === group.value)).toBe(true);
      }
    }
    const colorRound = buildSortingRound(49);
    for (const group of colorRound.groups) {
      const animals = colorRound.animals.filter(animal => animal.color === group.value);
      expect(new Set(animals.map(animal => animal.kind)).size).toBe(2);
      expect(new Set(animals.map(animal => animal.size)).size).toBe(2);
    }
  });

  it('ships fifty connected, solvable mazes with narrow touch-friendly boards', () => {
    for (let level = 0; level < PUZZLE_ROUND_COUNT; level++) {
      const maze = buildMazeRound(level);
      expect(maze.width).toBe(5);
      expect(maze.cells.length / maze.width).toBe(level < 20 ? 5 : 7);
      expect(maze.cells.filter(cell => cell === 'S')).toHaveLength(1);
      expect(maze.cells.filter(cell => cell === 'G')).toHaveLength(1);
      const path = mazePath(maze, maze.start);
      expect(path[0]).toBe(maze.start);
      expect(path.at(-1)).toBe(maze.goal);
      expect(path.length).toBeGreaterThan(1);
      expect(path.length).toBeLessThanOrEqual(23);
      if (level < 10) expect(path.length).toBeLessThanOrEqual(11);
      path.slice(1).forEach((cell, index) => expect(canMoveInMaze(maze, path[index], cell)).toBe(true));
      maze.cells.forEach((cell, index) => {
        if (cell !== '#') expect(mazePath(maze, index).at(-1)).toBe(maze.goal);
      });
      expect(canMoveInMaze(maze, maze.start, -1)).toBe(false);
      expect(canMoveInMaze(maze, maze.start, maze.cells.length)).toBe(false);
      expect(canMoveInMaze(maze, 4, 5)).toBe(false);
      expect(canMoveInMaze(maze, 0, 2)).toBe(false);
    }
  });

  it('provides enough matching pieces, bounded targets, outlines, and later rotation challenges', () => {
    const blockedCenters: string[] = [];
    let rotationChallenges = 0;
    for (let level = 0; level < PUZZLE_ROUND_COUNT; level++) {
      const round = buildShapeRound(level);
      const available = [...round.pieces];
      expect(round.showOutlines).toBe(level < 30);
      expect(round.canRotate).toBe(level >= 20);
      expect(round.pieces.length).toBe(round.slots.length);
      expect(round.pieces.length).toBeGreaterThanOrEqual(2);
      expect(round.pieces.length).toBeLessThanOrEqual(4);
      expect(new Set(round.slots.map(slot => slot.id)).size).toBe(round.slots.length);
      let needsRotation = false;
      for (const [slotIndex, slot] of round.slots.entries()) {
        expect(slot.x).toBeGreaterThanOrEqual(0);
        expect(slot.y).toBeGreaterThanOrEqual(0);
        expect(slot.x + slot.size).toBeLessThanOrEqual(320);
        expect(slot.y + slot.size).toBeLessThanOrEqual(280);
        expect(slot.size).toBeGreaterThanOrEqual(60);
        const center = { x: slot.x + slot.size / 2, y: slot.y + slot.size / 2 };
        for (const laterSlot of round.slots.slice(slotIndex + 1)) {
          const coversCenter = center.x + 4 > laterSlot.x && center.x - 4 < laterSlot.x + laterSlot.size
            && center.y + 4 > laterSlot.y && center.y - 4 < laterSlot.y + laterSlot.size;
          if (coversCenter) blockedCenters.push(`${round.title}: ${laterSlot.label} covers ${slot.label}`);
        }
        const index = available.findIndex(piece => piece.kind === slot.kind
          && (round.canRotate || canPlaceShape(piece, slot, piece.rotation)));
        expect(index).toBeGreaterThanOrEqual(0);
        const piece = available.splice(index, 1)[0];
        expect(canPlaceShape(piece, slot, slot.rotation)).toBe(true);
        if (!canPlaceShape(piece, slot, piece.rotation)) needsRotation = true;
      }
      expect(available).toHaveLength(0);
      if (needsRotation) rotationChallenges++;
      if (level < 20) expect(needsRotation).toBe(false);
    }
    expect(blockedCenters).toEqual([]);
    expect(rotationChallenges).toBeGreaterThanOrEqual(20);
  });

  it('accepts rotational symmetry, but rejects wrong shapes and triangle orientation', () => {
    const piece: ShapePiece = { id: 'p', kind: 'triangle', label: '三角形', color: '#fff', rotation: 0 };
    const slot: ShapeSlot = { id: 's', kind: 'triangle', label: '位置', x: 0, y: 0, size: 80, rotation: 270 };
    expect(canPlaceShape(piece, slot, 0)).toBe(false);
    expect(canPlaceShape(piece, slot, -90)).toBe(true);
    expect(canPlaceShape({ ...piece, kind: 'square' }, slot, 270)).toBe(false);
    expect(canPlaceShape({ ...piece, kind: 'square' }, { ...slot, kind: 'square', rotation: 0 }, 90)).toBe(true);
    expect(canPlaceShape({ ...piece, kind: 'rectangle' }, { ...slot, kind: 'rectangle', rotation: 0 }, 180)).toBe(true);
    expect(canPlaceShape({ ...piece, kind: 'rectangle' }, { ...slot, kind: 'rectangle', rotation: 0 }, 90)).toBe(false);
    expect(canPlaceShape({ ...piece, kind: 'circle' }, { ...slot, kind: 'circle' }, 0)).toBe(true);
  });

  it('always rewards completion and caps the cost of mistakes and help', () => {
    expect([0, 1, 4, 5, 50].map(scorePuzzleRound)).toEqual([20, 18, 12, 10, 10]);
  });
});

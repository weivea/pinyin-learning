import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { starsForScore } from '../components/gameUtils';
import { ALL_GAME_TYPES, GAME_INFO, PUZZLE_GAME_TYPES, isPuzzleGame } from './games';
import {
  PUZZLE_BASE_ROUND_COUNT,
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
  shapeMatchesSlot,
  sortAnimalValue,
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
  it('provides one hundred distinct, repeatable levels for every game', () => {
    expect(PUZZLE_ROUND_COUNT).toBe(100);
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
      fingerprints.pattern.add(`${pattern.sequence.map(picture => picture.id)}:${pattern.gaps}`);
      fingerprints.missing.add(`${missing.pictures.map(picture => picture.id)}:${missing.missing.map(picture => picture.id)}`);
      fingerprints.sorting.add(`${sorting.rule}:${sorting.animals.map(animal => `${animal.kind}-${animal.color}-${animal.size}`).sort()}`);
      fingerprints.maze.add(maze.cells.join(''));
      fingerprints.shapes.add(shapes.slots.map(slot => `${slot.kind}:${slot.x},${slot.y},${slot.size},${slot.rotation}`).sort().join('|'));
    }
    for (const [game, values] of Object.entries(fingerprints)) {
      expect(values.size, `${game} must have 100 different problems, not just shuffled choices`).toBe(100);
    }
  });

  it('preserves every original problem, option order, maze, and shape scene in levels 1–50', () => {
    const builders = {
      pattern: (level: number) => {
        const { sequence, unit, gaps, options } = buildPatternRound(level);
        return { sequence, unit, gaps, options };
      },
      missing: (level: number) => {
        const { pictures, missing, options } = buildMissingRound(level);
        return { pictures, missing, options };
      },
      sorting: buildSortingRound,
      maze: buildMazeRound,
      shapes: (level: number) => {
        const { title, slots, showOutlines, canRotate, pieces } = buildShapeRound(level);
        return { title, slots, showOutlines, canRotate, pieces };
      },
    };
    const originalHashes = {
      pattern: '74ba89b40e9732f97783eff8c25030080281963044260aa89ba8af5aef9fdc21',
      missing: '41293de4e2a62b3a81143fd9fd23af91df5178bdf4b75bf9811e7a2ca700db39',
      sorting: '5c71655c9a4676b6802737fd46fccdbe573ca7c0e79f49bead55eae6bd3d9ad3',
      maze: '71b305f5fe8364d49775c82d03ec199f527e5ea1ad224d370e5459f6a248cd67',
      shapes: 'b180f5d0573cbed8690cf08e9a4010c9d53066311dd3a723e47182efd4fd8f81',
    };
    for (const type of PUZZLE_GAME_TYPES) {
      const levels = Array.from({ length: PUZZLE_BASE_ROUND_COUNT }, (_, level) => builders[type](level));
      expect(createHash('sha256').update(JSON.stringify(levels)).digest('hex'), type).toBe(originalHashes[type]);
    }
  });

  it('rejects levels outside the hundred-level bank', () => {
    for (const level of [-1, 100, 1.5, NaN, Infinity]) {
      for (const build of [buildPatternRound, buildMissingRound, buildSortingRound, buildMazeRound, buildShapeRound]) {
        expect(() => build(level)).toThrow(RangeError);
      }
    }
  });

  it('builds unambiguous repeating patterns with exactly one correct choice', () => {
    for (let level = 0; level < PUZZLE_ROUND_COUNT; level++) {
      const round = buildPatternRound(level);
      const stage = puzzleStage(level);
      expect(round.sequence.length).toBeGreaterThanOrEqual(round.unit.length * 2);
      expect(round.unit).toHaveLength([2, 3, 3, 4, 4, 4, 5, 6, 6, 7][stage]);
      round.sequence.forEach((picture, index) => {
        expect(picture).toEqual(round.unit[index % round.unit.length]);
      });
      expect(round.gaps).toHaveLength([1, 1, 1, 1, 1, 1, 2, 2, 3, 3][stage]);
      expect(new Set(round.gaps).size).toBe(round.gaps.length);
      for (const gap of round.gaps) {
        expect(gap).toBeGreaterThanOrEqual(round.unit.length);
        expect(gap).toBeLessThan(round.sequence.length);
        expect(round.options.filter(picture => picture.id === round.sequence[gap].id)).toHaveLength(1);
      }
      expect(round.options).toHaveLength([2, 2, 3, 3, 3, 4, 4, 5, 5, 6][stage]);
      expect(new Set(round.options.map(picture => picture.id)).size).toBe(round.options.length);
    }
  });

  it('increases memory size, hidden companions, and distractors without impossible answers', () => {
    for (let level = 0; level < PUZZLE_ROUND_COUNT; level++) {
      const round = buildMissingRound(level);
      const stage = puzzleStage(level);
      expect(round.pictures).toHaveLength([3, 4, 5, 6, 6, 7, 8, 8, 9, 10][stage]);
      expect(new Set(round.pictures.map(picture => picture.id)).size).toBe(round.pictures.length);
      expect(round.missing).toHaveLength([1, 1, 1, 1, 1, 1, 2, 2, 3, 3][stage]);
      expect(new Set(round.missing.map(picture => picture.id)).size).toBe(round.missing.length);
      for (const missing of round.missing) {
        expect(round.pictures).toContain(missing);
        expect(round.options.filter(picture => picture.id === missing.id)).toHaveLength(1);
      }
      expect(round.options).toHaveLength([3, 4, 4, 4, 4, 5, 6, 7, 8, 9][stage]);
      expect(new Set(round.options.map(picture => picture.id)).size).toBe(round.options.length);
      expect([...round.recallOrder].map(picture => picture.id).sort()).toEqual(round.pictures.map(picture => picture.id).sort());
      expect(round.shuffleRecall).toBe(level >= 70);
      if (level >= 70) {
        expect(round.recallOrder).not.toEqual(round.pictures);
        expect(round.options.some(picture => !round.pictures.includes(picture))).toBe(true);
      } else {
        expect(round.recallOrder).toEqual(round.pictures);
        expect(round.options.every(picture => round.pictures.includes(picture))).toBe(true);
      }
    }
  });

  it('switches classification rules and gives every animal exactly one home', () => {
    for (let level = 0; level < PUZZLE_ROUND_COUNT; level++) {
      const round = buildSortingRound(level);
      const stage = puzzleStage(level);
      const expectedRule = level < 50 ? ['kind', 'color', 'size'][level < 30 ? stage : level % 3]
        : level < 60 ? 'kind-color' : level < 70 ? ['kind-size', 'color-size'][level % 2]
        : level < 80 ? ['kind-color', 'kind-size', 'color-size'][level % 3] : 'kind-color-size';
      expect(round.rule).toBe(expectedRule);
      expect(round.animals).toHaveLength([4, 4, 4, 6, 6, 6, 8, 10, 12, 16][stage]);
      expect(round.groups).toHaveLength(level < 50 ? 2 : level < 80 ? 4 : 8);
      expect(new Set(round.groups.map(group => group.value)).size).toBe(round.groups.length);
      expect(new Set(round.animals.map(animal => animal.id)).size).toBe(round.animals.length);
      for (const animal of round.animals) {
        expect(round.groups.filter(group => group.value === sortAnimalValue(animal, round.rule))).toHaveLength(1);
      }
      for (const group of round.groups) {
        expect(round.animals.some(animal => sortAnimalValue(animal, round.rule) === group.value)).toBe(true);
        expect(sortAnimalValue(group.sample, round.rule)).toBe(group.value);
      }
    }
    const colorRound = buildSortingRound(49);
    for (const group of colorRound.groups) {
      const animals = colorRound.animals.filter(animal => animal.color === group.value);
      expect(new Set(animals.map(animal => animal.kind)).size).toBe(2);
      expect(new Set(animals.map(animal => animal.size)).size).toBe(2);
    }
  });

  it('ships one hundred connected mazes and strictly increases challenge path targets between stages', () => {
    let previousDistance = 0;
    for (let level = 0; level < PUZZLE_ROUND_COUNT; level++) {
      const maze = buildMazeRound(level);
      const stage = puzzleStage(level);
      expect(maze.width).toBe(level < 50 ? 5 : level < 70 ? 7 : 9);
      expect(maze.cells.length / maze.width).toBe([5, 5, 7, 7, 7, 7, 9, 9, 11, 13][stage]);
      expect(maze.cells.filter(cell => cell === 'S')).toHaveLength(1);
      expect(maze.cells.filter(cell => cell === 'G')).toHaveLength(1);
      const path = mazePath(maze, maze.start);
      expect(path[0]).toBe(maze.start);
      expect(path.at(-1)).toBe(maze.goal);
      expect(path.length).toBeGreaterThan(1);
      if (level < 50) expect(path.length).toBeLessThanOrEqual(23);
      else {
        const distance = path.length - 1;
        expect(distance).toBe(24 + (stage - 5) * 6 + Math.floor(level % 10 / 2));
        expect(distance).toBeGreaterThanOrEqual(previousDistance);
        previousDistance = distance;
      }
      if (level < 10) expect(path.length).toBeLessThanOrEqual(11);
      path.slice(1).forEach((cell, index) => expect(canMoveInMaze(maze, path[index], cell)).toBe(true));
      maze.cells.forEach((cell, index) => {
        if (cell !== '#') expect(mazePath(maze, index).at(-1)).toBe(maze.goal);
      });
      expect(canMoveInMaze(maze, maze.start, -1)).toBe(false);
      expect(canMoveInMaze(maze, maze.start, maze.cells.length)).toBe(false);
      expect(canMoveInMaze(maze, maze.width - 1, maze.width)).toBe(false);
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
      expect(round.matchSizes).toBe(level >= 70);
      expect(round.pieces.length).toBe(round.slots.length);
      expect(round.pieces.length).toBeGreaterThanOrEqual(2);
      expect(round.pieces.length).toBeLessThanOrEqual(level < 50 ? 4 : 8);
      if (level >= 50) expect(round.pieces).toHaveLength([5, 6, 6, 7, 8][puzzleStage(level) - 5]);
      if (level >= 70) {
        expect(round.slots.some(slot => round.slots.some(other => other.kind === slot.kind && other.size !== slot.size))).toBe(true);
      }
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
        const index = available.findIndex(piece => shapeMatchesSlot(piece, slot)
          && (round.canRotate || canPlaceShape(piece, slot, piece.rotation)));
        expect(index).toBeGreaterThanOrEqual(0);
        const piece = available.splice(index, 1)[0];
        expect(canPlaceShape(piece, slot, slot.rotation)).toBe(true);
        expect([0, 90, 180, 270].some(turn => canPlaceShape(piece, slot, piece.rotation + turn))).toBe(true);
        if (level >= 70) expect(piece.size).toBe(slot.size);
        if (!canPlaceShape(piece, slot, piece.rotation)) needsRotation = true;
      }
      expect(available).toHaveLength(0);
      if (needsRotation) rotationChallenges++;
      if (level < 20) expect(needsRotation).toBe(false);
      if (level >= 50) expect(needsRotation, round.title).toBe(true);
    }
    expect(blockedCenters).toEqual([]);
    expect(rotationChallenges).toBeGreaterThanOrEqual(70);
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
    expect(canPlaceShape({ ...piece, size: 60 }, slot, 270)).toBe(false);
    expect(canPlaceShape({ ...piece, size: 80 }, slot, 270)).toBe(true);
    expect(canPlaceShape({ ...piece, kind: 'circle', size: 60 }, { ...slot, kind: 'circle' }, 0)).toBe(false);
  });

  it('always rewards completion and caps the cost of mistakes and help', () => {
    expect([0, 1, 4, 5, 50].map(scorePuzzleRound)).toEqual([20, 18, 12, 10, 10]);
    expect([1000, 1399, 1400, 1799, 1800, 2000].map(score => starsForScore(score, PUZZLE_ROUND_COUNT * 20)))
      .toEqual([1, 1, 2, 2, 3, 3]);
  });
});

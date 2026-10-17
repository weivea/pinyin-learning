import { pickN, shuffle } from '../components/gameUtils';
import { SHAPE_SCENES } from './shapeScenes';

export const PUZZLE_BASE_ROUND_COUNT = 50;
export const PUZZLE_ROUND_COUNT = 100;

export function puzzleStage(level: number): number {
  if (!Number.isInteger(level) || level < 0 || level >= PUZZLE_ROUND_COUNT) {
    throw new RangeError(`Invalid puzzle level: ${level}`);
  }
  return Math.floor(level / 10);
}

// Stable level seeds keep the same puzzle when a child leaves and resumes.
function levelRandom(level: number, salt: number): () => number {
  puzzleStage(level);
  let state = ((level + 1) * 2654435761 + salt) >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export interface Picture {
  id: string;
  label: string;
  emoji: string;
}

const FRUITS: Picture[] = [
  { id: 'apple', label: '苹果', emoji: '🍎' },
  { id: 'banana', label: '香蕉', emoji: '🍌' },
  { id: 'grapes', label: '葡萄', emoji: '🍇' },
  { id: 'strawberry', label: '草莓', emoji: '🍓' },
  { id: 'watermelon', label: '西瓜', emoji: '🍉' },
  { id: 'pear', label: '梨', emoji: '🍐' },
];

const PICTURES: Picture[] = [
  ...FRUITS,
  { id: 'rabbit', label: '小兔', emoji: '🐰' },
  { id: 'panda', label: '熊猫', emoji: '🐼' },
  { id: 'car', label: '汽车', emoji: '🚗' },
  { id: 'ball', label: '足球', emoji: '⚽' },
  { id: 'butterfly', label: '蝴蝶', emoji: '🦋' },
  { id: 'sun', label: '太阳', emoji: '☀️' },
];

export interface PatternRound {
  sequence: Picture[];
  unit: Picture[];
  gaps: number[];
  options: Picture[];
}

const PATTERNS = [
  { unit: [0, 1], length: 5, gaps: [4], choices: 2 },
  { unit: [0, 0, 1], length: 7, gaps: [6], choices: 2 },
  { unit: [0, 1, 2], length: 7, gaps: [6], choices: 3 },
  { unit: [0, 0, 1, 1], length: 9, gaps: [8], choices: 3 },
  { unit: [0, 1, 0, 2], length: 9, gaps: [5], choices: 3 },
  { unit: [0, 1, 2, 3], length: 13, gaps: [7], choices: 4 },
  { unit: [0, 0, 1, 2, 2], length: 16, gaps: [8, 14], choices: 4 },
  { unit: [0, 1, 2, 0, 3, 2], length: 19, gaps: [7, 16], choices: 5 },
  { unit: [0, 1, 1, 2, 3, 3], length: 19, gaps: [8, 13, 17], choices: 5 },
  { unit: [0, 1, 2, 0, 3, 4, 2], length: 22, gaps: [8, 17, 20], choices: 6 },
];

export function buildPatternRound(level: number): PatternRound {
  const stage = puzzleStage(level);
  const rule = PATTERNS[stage];
  const random = levelRandom(level, 11);
  const variant = level % 10;
  const start = variant % FRUITS.length;
  const offset = Math.floor(variant / FRUITS.length);
  const fruits = level < PUZZLE_BASE_ROUND_COUNT
    ? [FRUITS[start], FRUITS[(start + 1 + offset) % FRUITS.length], FRUITS[(start + 3 + offset) % FRUITS.length]]
    : shuffle(FRUITS, random);
  const unit = rule.unit.map(index => fruits[index]);
  const sequence = Array.from({ length: rule.length }, (_, index) => unit[index % unit.length]);
  const answers = [...new Set(rule.gaps.map(gap => sequence[gap]))];
  return {
    sequence,
    unit,
    gaps: rule.gaps,
    options: shuffle([
      ...answers,
      ...pickN(FRUITS.filter(fruit => !answers.includes(fruit)), rule.choices - answers.length, random),
    ], random),
  };
}

export interface MissingRound {
  pictures: Picture[];
  missing: Picture[];
  options: Picture[];
  recallOrder: Picture[];
  shuffleRecall: boolean;
}

export function buildMissingRound(level: number): MissingRound {
  const stage = puzzleStage(level);
  const random = levelRandom(level, 29);
  const pictures = pickN(PICTURES, [3, 4, 5, 6, 6, 7, 8, 8, 9, 10][stage], random);
  const missing = [pictures[level % pictures.length]];
  const missingCount = [1, 1, 1, 1, 1, 1, 2, 2, 3, 3][stage];
  if (missingCount > 1) {
    missing.push(...pickN(pictures.filter(picture => !missing.includes(picture)), missingCount - 1, random));
  }
  const shuffleRecall = stage >= 7;
  const outsiders = shuffleRecall ? pickN(PICTURES.filter(picture => !pictures.includes(picture)), 1, random) : [];
  const optionCount = [4, 4, 4, 4, 4, 5, 6, 7, 8, 9][stage];
  const options = shuffle([
    ...missing,
    ...outsiders,
    ...pickN(
      (shuffleRecall ? PICTURES : pictures).filter(picture => !missing.includes(picture) && !outsiders.includes(picture)),
      optionCount - missing.length - outsiders.length,
      random,
    ),
  ], random);
  return {
    pictures,
    missing,
    options,
    recallOrder: shuffleRecall ? shuffle(pictures, random) : pictures,
    shuffleRecall,
  };
}

export type AnimalKind = 'rabbit' | 'cat';
export type AnimalColor = 'orange' | 'blue';
export type AnimalSize = 'small' | 'large';
export type SortAttribute = 'kind' | 'color' | 'size';
export type SortRule = SortAttribute | 'kind-color' | 'kind-size' | 'color-size' | 'kind-color-size';

export interface SortAnimal {
  id: string;
  kind: AnimalKind;
  color: AnimalColor;
  size: AnimalSize;
}

interface SortGroup {
  value: string;
  label: string;
  sample: SortAnimal;
}

export const SORT_RULE_LABELS: Record<SortRule, string> = {
  kind: '动物种类',
  color: '颜色',
  size: '大小',
  'kind-color': '种类和颜色',
  'kind-size': '种类和大小',
  'color-size': '颜色和大小',
  'kind-color-size': '种类、颜色和大小',
};

const RULE_ORDER: SortAttribute[] = ['kind', 'color', 'size'];
const SORT_ATTRIBUTES: Record<SortRule, SortAttribute[]> = {
  kind: ['kind'], color: ['color'], size: ['size'],
  'kind-color': ['kind', 'color'],
  'kind-size': ['kind', 'size'],
  'color-size': ['color', 'size'],
  'kind-color-size': ['kind', 'color', 'size'],
};
const PAIR_RULES: SortRule[] = ['kind-color', 'kind-size', 'color-size'];
export const SORT_RULES: SortRule[] = Array.from({ length: PUZZLE_ROUND_COUNT }, (_, level) => {
  if (level < PUZZLE_BASE_ROUND_COUNT) return RULE_ORDER[level < 30 ? Math.floor(level / 10) : level % RULE_ORDER.length];
  if (level < 60) return 'kind-color';
  if (level < 70) return level % 2 === 0 ? 'kind-size' : 'color-size';
  if (level < 80) return PAIR_RULES[level % PAIR_RULES.length];
  return 'kind-color-size';
});

export const ANIMAL_COLORS: Record<AnimalColor, string> = {
  orange: '#f4a261',
  blue: '#80bde3',
};

const SORT_GROUPS: Record<SortAttribute, SortGroup[]> = {
  kind: [
    { value: 'rabbit', label: '小兔屋', sample: { id: 'rabbit-house', kind: 'rabbit', color: 'orange', size: 'large' } },
    { value: 'cat', label: '小猫屋', sample: { id: 'cat-house', kind: 'cat', color: 'orange', size: 'large' } },
  ],
  color: [
    { value: 'orange', label: '橙色屋', sample: { id: 'orange-house', kind: 'rabbit', color: 'orange', size: 'large' } },
    { value: 'blue', label: '蓝色屋', sample: { id: 'blue-house', kind: 'rabbit', color: 'blue', size: 'large' } },
  ],
  size: [
    { value: 'small', label: '小个子屋', sample: { id: 'small-house', kind: 'rabbit', color: 'orange', size: 'small' } },
    { value: 'large', label: '大个子屋', sample: { id: 'large-house', kind: 'rabbit', color: 'orange', size: 'large' } },
  ],
};

export function animalLabel(animal: SortAnimal): string {
  return `${animal.size === 'small' ? '小个子' : '大个子'}的${animal.color === 'orange' ? '橙色' : '蓝色'}${animal.kind === 'rabbit' ? '小兔' : '小猫'}`;
}

export function sortAnimalValue(animal: SortAnimal, rule: SortRule): string {
  return SORT_ATTRIBUTES[rule].map(attribute => animal[attribute]).join(':');
}

function sortingDistributions(groupCount: number, animalCount: number): number[][] {
  const results: number[][] = [];
  function distribute(counts: number[], remaining: number) {
    const groupsLeft = groupCount - counts.length;
    if (groupsLeft === 0) {
      if (remaining === 0) results.push(counts);
      return;
    }
    for (let count = 1; count <= 3; count++) {
      if (remaining - count >= groupsLeft - 1 && remaining - count <= (groupsLeft - 1) * 3) {
        distribute([...counts, count], remaining - count);
      }
    }
  }
  distribute([], animalCount);
  return results;
}

const CHALLENGE_SORT_DISTRIBUTIONS = [6, 8, 10, 12, 16].map((total, stage) => (
  sortingDistributions(stage < 3 ? 4 : 8, total)
));

export function buildSortingRound(level: number) {
  const stage = puzzleStage(level);
  const rule = SORT_RULES[level];
  const random = levelRandom(level, 43);
  const pool = Array.from({ length: 8 }, (_, index): SortAnimal => ({
    id: '',
    kind: index < 4 ? 'rabbit' : 'cat',
    color: Math.floor(index / 2) % 2 === 0 ? 'orange' : 'blue',
    size: index % 2 === 0 ? 'small' : 'large',
  }));
  if (rule !== 'kind' && rule !== 'color' && rule !== 'size') {
    const groups: SortGroup[] = [];
    for (const animal of pool) {
      const value = sortAnimalValue(animal, rule);
      if (groups.some(group => group.value === value)) continue;
      const labels: Record<SortAttribute, string> = {
        kind: animal.kind === 'rabbit' ? '小兔' : '小猫',
        color: animal.color === 'orange' ? '橙色' : '蓝色',
        size: animal.size === 'small' ? '小个子' : '大个子',
      };
      const label = (['size', 'color', 'kind'] as const)
        .filter(attribute => SORT_ATTRIBUTES[rule].includes(attribute))
        .map(attribute => labels[attribute]).join('');
      groups.push({ value, label: `${label}屋`, sample: { ...animal, id: `${value}-house` } });
    }
    const distributions = CHALLENGE_SORT_DISTRIBUTIONS[stage - 5];
    const variant = level % 10;
    const counts = distributions[Math.floor(variant * distributions.length / 10)];
    const animals = groups.flatMap((group, groupIndex) => {
      const candidates = pool.filter(animal => sortAnimalValue(animal, rule) === group.value);
      return Array.from({ length: counts[groupIndex] }, (_, index) => candidates[(variant + groupIndex + index) % candidates.length]);
    }).map((animal, index) => ({ ...animal, id: `animal-${index}` }));
    return { rule, animals: shuffle(animals, random), groups };
  }
  const combinations = stage < 3
    ? [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]
    : [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]];
  const ordinal = SORT_RULES.slice(0, level).filter((previous, index) => (
    previous === rule && (index < 30) === (level < 30)
  )).length;
  const groups = SORT_GROUPS[rule];
  const animals = groups.flatMap((group, groupIndex) => {
    const candidates = pool.filter(animal => animal[rule] === group.value);
    const choice = groupIndex === 0 ? ordinal % combinations.length : Math.floor(ordinal / combinations.length);
    return combinations[choice].map(index => candidates[index]);
  }).map((animal, index) => ({ ...animal, id: `animal-${index}` }));
  return { rule, animals: shuffle(animals, random), groups };
}

export interface MazeRound {
  width: number;
  cells: string[];
  start: number;
  goal: number;
}

export function buildMazeRound(level: number): MazeRound {
  const stage = puzzleStage(level);
  const challenge = level >= PUZZLE_BASE_ROUND_COUNT;
  const width = challenge ? (stage < 7 ? 7 : 9) : 5;
  const height = challenge ? [7, 9, 9, 11, 13][stage - 5] : (stage < 2 ? 5 : 7);
  const targetDistance = challenge ? 24 + (stage - 5) * 6 + Math.floor(level % 10 / 2) : 0;
  const random = levelRandom(level, 71);
  for (let attempt = 0; attempt < 128; attempt++) {
    const cells: string[] = Array(width * height).fill('#');
    const start = [0, width - 1, (height - 1) * width, height * width - 1][level % 4];
    cells[start] = '.';
    const stack = [start];
    while (stack.length) {
      const current = stack[stack.length - 1];
      const row = Math.floor(current / width);
      const column = current % width;
      const neighbors = [[row - 2, column], [row + 2, column], [row, column - 2], [row, column + 2]]
        .filter(([nextRow, nextColumn]) => nextRow >= 0 && nextRow < height && nextColumn >= 0 && nextColumn < width)
        .map(([nextRow, nextColumn]) => nextRow * width + nextColumn)
        .filter(next => cells[next] === '#');
      if (!neighbors.length) {
        stack.pop();
        continue;
      }
      const next = neighbors[Math.floor(random() * neighbors.length)];
      cells[(current + next) / 2] = '.';
      cells[next] = '.';
      stack.push(next);
    }
    const maze: MazeRound = { width, cells, start, goal: start };
    let longestPath = [start];
    cells.forEach((cell, index) => {
      if (cell === '#') return;
      const path = mazePath({ ...maze, goal: index }, start);
      if (path.length > longestPath.length) longestPath = path;
    });
    // Reject short challenge mazes instead of silently lowering the stage's difficulty.
    if (longestPath.length <= targetDistance) continue;
    const distance = challenge ? targetDistance
      : stage === 4 ? longestPath.length - 1 : Math.min(6 + stage * 2 + level % 5, longestPath.length - 1);
    maze.goal = longestPath[distance];
    cells[start] = 'S';
    cells[maze.goal] = 'G';
    return maze;
  }
  throw new Error(`Could not build maze level ${level + 1} with ${targetDistance} moves`);
}

export function canMoveInMaze(maze: MazeRound, from: number, to: number): boolean {
  if (to < 0 || to >= maze.cells.length || maze.cells[to] === '#') return false;
  const rowDistance = Math.abs(Math.floor(from / maze.width) - Math.floor(to / maze.width));
  const columnDistance = Math.abs(from % maze.width - to % maze.width);
  return rowDistance + columnDistance === 1;
}

export function mazePath(maze: MazeRound, from: number): number[] {
  const queue = [from];
  const previous = new Map<number, number | null>([[from, null]]);
  for (let index = 0; index < queue.length; index++) {
    const cell = queue[index];
    if (cell === maze.goal) {
      const path: number[] = [];
      let step: number | null = cell;
      while (step !== null) {
        path.push(step);
        step = previous.get(step) ?? null;
      }
      return path.reverse();
    }
    for (const next of [cell - maze.width, cell + maze.width, cell - 1, cell + 1]) {
      if (canMoveInMaze(maze, cell, next) && !previous.has(next)) {
        previous.set(next, cell);
        queue.push(next);
      }
    }
  }
  return [];
}

export type ShapeKind = 'triangle' | 'square' | 'rectangle' | 'circle';

export const SHAPE_LABELS: Record<ShapeKind, string> = {
  triangle: '三角形',
  square: '正方形',
  rectangle: '长方形',
  circle: '圆形',
};

export interface ShapeSlot {
  id: string;
  label: string;
  kind: ShapeKind;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

export interface ShapePiece {
  id: string;
  kind: ShapeKind;
  label: string;
  color: string;
  rotation: number;
  size?: number;
}

export interface ShapeScene {
  title: string;
  slots: ShapeSlot[];
}

const PIECE_COLORS = [
  { label: '橙色', color: '#f4a261' },
  { label: '蓝色', color: '#80bde3' },
  { label: '绿色', color: '#74c69d' },
  { label: '紫色', color: '#bb8fce' },
  { label: '红色', color: '#ef8585' },
  { label: '黄色', color: '#edc65a' },
  { label: '青色', color: '#69b8ad' },
  { label: '粉色', color: '#e7a8c4' },
];

export function buildShapeRound(level: number) {
  const stage = puzzleStage(level);
  const scene = SHAPE_SCENES[level];
  const random = levelRandom(level, 97);
  const canRotate = stage >= 2;
  const matchSizes = stage >= 7;
  return {
    ...scene,
    showOutlines: stage < 3,
    canRotate,
    matchSizes,
    pieces: shuffle(scene.slots.map((slot, index): ShapePiece => {
      const sizes = [...new Set(scene.slots.filter(part => part.kind === slot.kind).map(part => part.size))].sort((a, b) => a - b);
      const sizeLabel = !matchSizes || sizes.length === 1 ? ''
        : slot.size === sizes[0] ? '小号' : slot.size === sizes.at(-1) ? '大号' : '中号';
      return {
        id: `piece-${index}`,
        kind: slot.kind,
        label: `${PIECE_COLORS[index].label}${sizeLabel}${SHAPE_LABELS[slot.kind]}`,
        color: PIECE_COLORS[index].color,
        rotation: canRotate ? 0 : slot.rotation,
        size: matchSizes ? slot.size : undefined,
      };
    }), random),
  };
}

export function shapeMatchesSlot(piece: ShapePiece, slot: ShapeSlot): boolean {
  return piece.kind === slot.kind && (piece.size === undefined || piece.size === slot.size);
}

export function canPlaceShape(piece: ShapePiece, slot: ShapeSlot, rotation: number): boolean {
  if (!shapeMatchesSlot(piece, slot)) return false;
  if (piece.kind === 'circle') return true;
  const period = piece.kind === 'square' ? 90 : piece.kind === 'rectangle' ? 180 : 360;
  return ((rotation - slot.rotation) % period + period) % period === 0;
}

export function scorePuzzleRound(mistakes: number): number {
  return Math.max(10, 20 - mistakes * 2);
}

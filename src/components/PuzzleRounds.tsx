import { useState, type KeyboardEvent } from 'react';
import {
  ANIMAL_COLORS,
  SORT_RULE_LABELS,
  animalLabel,
  buildMazeRound,
  buildMissingRound,
  buildPatternRound,
  buildShapeRound,
  buildSortingRound,
  canMoveInMaze,
  canPlaceShape,
  mazePath,
  shapeMatchesSlot,
  sortAnimalValue,
  type Picture,
  type ShapeKind,
  type ShapePiece,
  type ShapeSlot,
  type SortAnimal,
} from '../data/puzzleGames';

export interface PuzzleRoundProps {
  level: number;
  hint: boolean;
  solved: boolean;
  onComplete: (message?: string) => void;
  onMistake: (message: string) => void;
  onNotice: (message: string) => void;
}

function PictureContents({ picture }: { picture: Picture }) {
  return (
    <>
      <span className="puzzle-emoji" aria-hidden="true">{picture.emoji}</span>
      <span className="puzzle-item-label">{picture.label}</span>
    </>
  );
}

export function PatternPuzzle({ level, hint, solved, onComplete, onMistake, onNotice }: PuzzleRoundProps) {
  const [round] = useState(() => buildPatternRound(level));
  const [filled, setFilled] = useState<number[]>([]);
  const currentGap = round.gaps.find(gap => !filled.includes(gap));
  return (
    <div className="puzzle-round">
      <div className={`pattern-train ${round.sequence.length > 9 ? 'pattern-train-advanced' : ''}`} aria-label="水果小火车">
        <span className="train-engine" aria-hidden="true">🚂</span>
        {round.sequence.map((picture, index) => {
          const hidden = round.gaps.includes(index) && !filled.includes(index) && !solved;
          return (
            <div
              key={index}
              className={`train-wagon ${hidden ? 'train-gap' : ''} ${index === currentGap ? 'train-current-gap' : ''}`}
              aria-label={`第 ${index + 1} 节车厢：${hidden ? '问号' : picture.label}`}
              aria-current={index === currentGap ? 'step' : undefined}
            >
              <span aria-hidden="true">{hidden ? '?' : picture.emoji}</span>
              <small aria-hidden="true">{index + 1}</small>
            </div>
          );
        })}
      </div>
      {round.gaps.length > 1 && (
        <p className="puzzle-rule">
          {currentGap === undefined ? '所有车厢都填好啦！' : `已填 ${filled.length} / ${round.gaps.length} 节，接着填第 ${currentGap + 1} 节车厢`}
        </p>
      )}
      {hint && (
        <p className="puzzle-hint" aria-label={`重复的一组：${round.unit.map(picture => picture.label).join('、')}`}>
          这一组重复出现：{round.unit.map(picture => picture.emoji).join(' ')}
        </p>
      )}
      <div className="puzzle-choices" role="group" aria-label="选择车厢里的水果">
        {round.options.map(picture => (
          <button
            key={picture.id}
            className={`puzzle-tile ${hint && currentGap !== undefined && picture.id === round.sequence[currentGap].id ? 'is-hinted' : ''}`}
            aria-label={`选择${picture.label}`}
            disabled={solved || currentGap === undefined}
            onClick={() => {
              if (solved || currentGap === undefined) return;
              if (picture.id !== round.sequence[currentGap].id) {
                onMistake('再看看前面的水果，它们是一组一组排队的。');
                return;
              }
              const next = [...filled, currentGap];
              setFilled(next);
              if (next.length === round.gaps.length) onComplete('水果排好队，小火车出发啦！');
              else onNotice('这一节填对啦！再看看下一个问号。');
            }}
          >
            <PictureContents picture={picture} />
          </button>
        ))}
      </div>
    </div>
  );
}

function AnimalPicture({ animal }: { animal: SortAnimal }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`sorting-animal sorting-animal-${animal.size}`}
      aria-hidden="true"
    >
      <g fill={ANIMAL_COLORS[animal.color]} stroke="#77533b" strokeWidth="2">
        {animal.kind === 'rabbit' ? (
          <>
            <ellipse cx="34" cy="26" rx="9" ry="23" />
            <ellipse cx="66" cy="26" rx="9" ry="23" />
          </>
        ) : (
          <path d="M20 52 L17 14 L43 36 M57 36 L83 14 L80 52" />
        )}
        <ellipse cx="50" cy="62" rx="34" ry="30" />
      </g>
      <g fill="#3d3533">
        <circle cx="38" cy="57" r="3.5" />
        <circle cx="62" cy="57" r="3.5" />
      </g>
      <path d="M45 67 Q50 62 55 67 L50 72 Z" fill="#c87176" />
      <path d="M50 72 Q42 82 37 73 M50 72 Q58 82 63 73" fill="none" stroke="#77533b" strokeWidth="2" />
      {animal.kind === 'cat' && (
        <path d="M26 67 L8 63 M26 74 L8 78 M74 67 L92 63 M74 74 L92 78" stroke="#77533b" strokeWidth="2" />
      )}
    </svg>
  );
}

const ANIMAL_DRAG_TYPE = 'application/x-puzzle-animal';

export function SortingPuzzle({ level, hint, solved, onComplete, onMistake, onNotice }: PuzzleRoundProps) {
  const [round] = useState(() => buildSortingRound(level));
  const [selected, setSelected] = useState<string | null>(null);
  const [placed, setPlaced] = useState<string[]>([]);
  const remaining = round.animals.filter(animal => !placed.includes(animal.id));
  const selectedAnimal = remaining.find(animal => animal.id === selected);
  const hintedAnimal = selectedAnimal ?? remaining[0];
  const compoundRule = round.groups.length > 2;
  const visibleAnimals = compoundRule ? remaining.slice(0, 4) : remaining;

  function sendHome(value: string, animalId: string | null) {
    if (solved) return;
    const animal = remaining.find(item => item.id === animalId);
    if (!animal) {
      onNotice('先点一只小动物，再点它的小屋，也可以拖过去。');
      return;
    }
    if (sortAnimalValue(animal, round.rule) !== value) {
      onMistake(`这一关按${SORT_RULE_LABELS[round.rule]}找家，再看看小屋上的标记。`);
      return;
    }
    const next = [...placed, animal.id];
    setPlaced(next);
    setSelected(null);
    if (next.length === round.animals.length) onComplete('每只小动物都回家啦！');
    else onNotice('回家啦！再选一只小动物吧。');
  }

  return (
    <div className="puzzle-round">
      <p className="puzzle-rule">这一关看：<strong>{SORT_RULE_LABELS[round.rule]}</strong></p>
      {compoundRule && <p>每个条件都要符合哦。还有 {remaining.length} 只等着回家。</p>}
      <div className="sorting-tray" role="group" aria-label="等待回家的小动物">
        {visibleAnimals.map(animal => (
          <button
            key={animal.id}
            className={`puzzle-tile animal-tile ${selected === animal.id ? 'is-selected' : ''} ${hint && !selected && animal.id === hintedAnimal?.id ? 'is-hinted' : ''}`}
            aria-label={`选择${animalLabel(animal)}，${Number(animal.id.split('-')[1]) + 1}号`}
            aria-pressed={selected === animal.id}
            disabled={solved}
            draggable={!solved}
            onDragStart={event => {
              event.dataTransfer.setData(ANIMAL_DRAG_TYPE, animal.id);
              setSelected(animal.id);
            }}
            onClick={() => {
              setSelected(animal.id);
              onNotice(`这是${animalLabel(animal)}。这一关按${SORT_RULE_LABELS[round.rule]}找家。`);
            }}
          >
            <AnimalPicture animal={animal} />
            <span className="puzzle-item-label">{selected === animal.id ? '选好啦 ✓' : '点我找家'}</span>
          </button>
        ))}
        {remaining.length === 0 && <p className="puzzle-hint">🏡 大家都回家啦！</p>}
      </div>
      {compoundRule && selectedAnimal && (
        <div className="sorting-selection">
          <AnimalPicture animal={selectedAnimal} />
          <span>已选：{animalLabel(selectedAnimal)}</span>
        </div>
      )}
      <div className={`sorting-houses ${compoundRule ? 'sorting-houses-advanced' : ''}`} role="group" aria-label="小动物的家">
        {round.groups.map(group => {
          const count = round.animals.filter(animal => placed.includes(animal.id) && sortAnimalValue(animal, round.rule) === group.value).length;
          return (
            <button
              key={group.value}
              className={`sorting-house ${hint && hintedAnimal && sortAnimalValue(hintedAnimal, round.rule) === group.value ? 'is-hinted' : ''}`}
              aria-label={`送到${group.label}`}
              disabled={solved}
              onDragOver={event => event.preventDefault()}
              onDrop={event => {
                event.preventDefault();
                sendHome(group.value, event.dataTransfer.getData(ANIMAL_DRAG_TYPE));
              }}
              onClick={() => sendHome(group.value, selected)}
            >
              <span className="house-roof" aria-hidden="true">⌂</span>
              <AnimalPicture animal={group.sample} />
              <strong>{group.label}</strong>
              <span className="puzzle-item-label">已回家 {count} 只</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MazePuzzle({ level, hint, solved, onComplete, onMistake, onNotice }: PuzzleRoundProps) {
  const [round] = useState(() => buildMazeRound(level));
  const [position, setPosition] = useState(round.start);
  const [visited, setVisited] = useState<number[]>([round.start]);
  const nextHint = hint ? mazePath(round, position)[1] : undefined;

  function move(to: number) {
    if (solved) return;
    if (!canMoveInMaze(round, position, to)) {
      onMistake('这里走不通，看看旁边的小路，也可以往回走。');
      return;
    }
    setPosition(to);
    setVisited(previous => previous.includes(to) ? previous : [...previous, to]);
    if (to === round.goal) onComplete('找到胡萝卜啦，小兔谢谢你！');
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    const offsets: Record<string, number> = {
      ArrowUp: -round.width,
      ArrowDown: round.width,
      ArrowLeft: -1,
      ArrowRight: 1,
    };
    const offset = offsets[event.key];
    if (offset !== undefined) {
      event.preventDefault();
      move(position + offset);
    }
  }

  return (
    <div className="puzzle-round" onKeyDown={handleKey}>
      <div
        className={`maze-board ${round.width > 5 ? 'maze-board-advanced' : ''}`}
        style={{ gridTemplateColumns: `repeat(${round.width}, minmax(0, 1fr))` }}
        role="group"
        aria-label="小兔迷宫，可以用方向键移动"
        tabIndex={0}
      >
        {round.cells.map((cell, index) => cell === '#' ? (
          <span key={index} className="maze-cell maze-wall" aria-label="围栏">🌳</span>
        ) : (
          <button
            key={index}
            className={`maze-cell ${position === index ? 'maze-rabbit' : ''} ${index === nextHint ? 'is-hinted' : ''}`}
            aria-label={`第 ${Math.floor(index / round.width) + 1} 行第 ${index % round.width + 1} 格${position === index ? '，小兔' : index === round.goal ? '，胡萝卜' : '，小路'}`}
            aria-current={position === index ? 'location' : undefined}
            disabled={solved}
            onClick={() => {
              if (index === position) {
                onNotice('点小兔旁边的小路，或者用下面的方向按钮。');
              } else if (canMoveInMaze(round, position, index)) {
                move(index);
              } else {
                onNotice('一次走一格，先点小兔旁边的小路。');
              }
            }}
          >
            <span aria-hidden="true">
              {position === index ? '🐇' : index === round.goal ? '🥕' : visited.includes(index) ? '·' : ''}
            </span>
          </button>
        ))}
      </div>
      <div className="maze-controls" role="group" aria-label="移动小兔">
        <button className="puzzle-action maze-up" aria-label="向上走" disabled={solved} onClick={() => move(position - round.width)}>↑</button>
        <button className="puzzle-action maze-left" aria-label="向左走" disabled={solved} onClick={() => move(position - 1)}>←</button>
        <button className="puzzle-action maze-down" aria-label="向下走" disabled={solved} onClick={() => move(position + round.width)}>↓</button>
        <button className="puzzle-action maze-right" aria-label="向右走" disabled={solved} onClick={() => move(position + 1)}>→</button>
      </div>
      <button
        className="puzzle-action"
        disabled={solved || position === round.start}
        onClick={() => {
          setPosition(round.start);
          setVisited([round.start]);
          onNotice('回到起点啦，慢慢找，不着急。');
        }}
      >↩ 回到起点</button>
    </div>
  );
}

export function MissingPuzzle({ level, hint, solved, onComplete, onMistake, onNotice }: PuzzleRoundProps) {
  const [round] = useState(() => buildMissingRound(level));
  const [remembering, setRemembering] = useState(true);
  const [found, setFound] = useState<string[]>([]);
  const displayed = remembering ? round.pictures : round.recallOrder;

  return (
    <div className="puzzle-round">
      <p className="puzzle-rule">
        {remembering ? '慢慢看，准备好了再开始'
          : round.missing.length === 1 ? '谁藏起来了？' : `找齐 ${round.missing.length} 位伙伴，已找到 ${found.length} 位`}
      </p>
      {!remembering && round.shuffleRecall && <p>伙伴们换位置啦，也有没出现过的选项。想想刚才看到了谁。</p>}
      <div className={`memory-pictures ${round.pictures.length > 6 ? 'memory-pictures-advanced' : ''}`} role="group" aria-label={remembering ? '记忆物品' : '寻找藏起来的物品'}>
        {displayed.map(picture => {
          const hidden = !remembering && !solved && round.missing.includes(picture) && !found.includes(picture.id);
          return (
            <div key={picture.id} className="memory-picture" aria-label={hidden ? '藏起来的物品' : picture.label}>
              {hidden ? <span className="puzzle-emoji" aria-hidden="true">❔</span> : <PictureContents picture={picture} />}
            </div>
          );
        })}
      </div>
      {remembering ? (
        <button
          className="puzzle-action puzzle-primary"
          onClick={() => {
            setRemembering(false);
            onNotice(round.missing.length === 1 ? '一位伙伴藏起来了，你能找到它吗？' : `${round.missing.length}位伙伴藏起来了，把它们都找出来吧。`);
          }}
        >🙌 我记住了</button>
      ) : (
        <>
          {hint && <p className="puzzle-hint">刚才的伙伴：{round.pictures.map(picture => picture.emoji).join(' ')}</p>}
          <div className="puzzle-choices" role="group" aria-label="找出藏起来的伙伴">
            {round.options.map(picture => (
              <button
                key={picture.id}
                className={`puzzle-tile ${found.includes(picture.id) ? 'is-selected' : ''} ${hint && round.missing.includes(picture) && !found.includes(picture.id) ? 'is-hinted' : ''}`}
                aria-label={`选择${picture.label}`}
                aria-pressed={found.includes(picture.id)}
                disabled={solved || found.includes(picture.id)}
                onClick={() => {
                  if (solved || found.includes(picture.id)) return;
                  if (!round.missing.includes(picture)) {
                    onMistake(round.pictures.includes(picture)
                      ? '它还在上面呢。再想想，也可以再看一眼。'
                      : '它刚才没有出现哦。再想想，也可以再看一眼。');
                    return;
                  }
                  const next = [...found, picture.id];
                  setFound(next);
                  if (next.length === round.missing.length) {
                    onComplete(`找到啦，藏起来的是${round.missing.map(item => item.label).join('、')}！`);
                  } else onNotice(`找到一位啦！还剩${round.missing.length - next.length}位伙伴。`);
                }}
              >
                <PictureContents picture={picture} />
              </button>
            ))}
          </div>
          <button
            className="puzzle-action"
            disabled={solved}
            onClick={() => {
              setRemembering(true);
              setFound([]);
              onMistake('没关系，我们再看一遍，准备好了再开始。');
            }}
          >👀 再看一眼</button>
        </>
      )}
    </div>
  );
}

function ShapeDrawing({ kind, rotation, color, outline = false, x, y, size }: {
  kind: ShapeKind;
  rotation: number;
  color: string;
  outline?: boolean;
  x?: number;
  y?: number;
  size?: number;
}) {
  return (
    <svg viewBox="0 0 100 100" x={x} y={y} width={size ?? '100%'} height={size ?? '100%'} aria-hidden="true">
      <g
        transform={`rotate(${rotation} 50 50)`}
        fill={color}
        stroke={outline ? '#718096' : '#576574'}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeDasharray={outline ? '6 4' : undefined}
      >
        {kind === 'triangle' && <polygon points="50,4 96,96 4,96" />}
        {kind === 'square' && <rect x="6" y="6" width="88" height="88" rx="3" />}
        {kind === 'rectangle' && <rect x="6" y="26" width="88" height="48" rx="3" />}
        {kind === 'circle' && <circle cx="50" cy="50" r="44" />}
      </g>
    </svg>
  );
}

const SHAPE_DRAG_TYPE = 'application/x-puzzle-shape';

export function ShapesPuzzle({ level, hint, solved, onComplete, onMistake, onNotice }: PuzzleRoundProps) {
  const [round] = useState(() => buildShapeRound(level));
  const [selected, setSelected] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, ShapePiece>>({});
  const [rotations, setRotations] = useState<Record<string, number>>({});
  const available = round.pieces.filter(piece => !Object.values(placed).some(item => item.id === piece.id));
  const selectedPiece = available.find(piece => piece.id === selected);
  const hintedPiece = selectedPiece ?? available[0];
  const emptySlots = round.slots.filter(slot => !placed[slot.id]);
  const hintedSlot = hintedPiece
    ? emptySlots.find(slot => canPlaceShape(hintedPiece, slot, rotations[hintedPiece.id] ?? hintedPiece.rotation))
      ?? emptySlots.find(slot => shapeMatchesSlot(hintedPiece, slot))
    : undefined;
  const largestSize = Math.max(...round.slots.map(slot => slot.size));

  function place(slot: ShapeSlot, pieceId: string | null) {
    if (solved || placed[slot.id]) return;
    const piece = available.find(item => item.id === pieceId);
    if (!piece) {
      onNotice('先点选一块图形，再点它的位置，也可以拖过去。');
      return;
    }
    if (!canPlaceShape(piece, slot, rotations[piece.id] ?? piece.rotation)) {
      onMistake(piece.kind !== slot.kind ? '看看小样图和轮廓，换一块图形试试。'
        : !shapeMatchesSlot(piece, slot) ? '形状找对啦！再比一比大小，换一块大小合适的图形。'
        : round.canRotate ? '形状找对啦！再转一转方向。' : '再看看方向，换一块朝向一样的图形试试。');
      return;
    }
    const next = { ...placed, [slot.id]: piece };
    setPlaced(next);
    setSelected(null);
    if (Object.keys(next).length === round.slots.length) onComplete(`${round.title}拼好啦！`);
    else onNotice('拼上啦！再找一块图形吧。');
  }

  return (
    <div className="puzzle-round">
      <div className="shape-example">
        <div>
          <strong>拼一拼：{round.title}</strong>
          <p>{round.matchSizes ? '形状、大小和方向都要相同哦' : round.showOutlines ? '照着轮廓放一放' : '看看小样图，试着自己拼'}</p>
        </div>
        <svg viewBox="0 0 320 280" role="img" aria-label={`${round.title}的小样图`}>
          {round.slots.map(slot => (
            <ShapeDrawing key={slot.id} {...slot} color="#a3b7c8" />
          ))}
        </svg>
      </div>
      <div className="shape-board" role="group" aria-label={`${round.title}拼图`}>
        {round.slots.map(slot => (
          <button
            key={slot.id}
            className={`shape-slot ${!placed[slot.id] && !round.showOutlines && !hint ? 'shape-slot-hidden' : ''} ${hint && slot.id === hintedSlot?.id ? 'is-hinted' : ''}`}
            style={{
              left: `${slot.x / 320 * 100}%`,
              top: `${slot.y / 280 * 100}%`,
              width: `${slot.size / 320 * 100}%`,
              height: `${slot.size / 280 * 100}%`,
            }}
            aria-label={`放到${slot.label}${placed[slot.id] ? '，已拼好' : ''}`}
            disabled={solved || !!placed[slot.id]}
            onDragOver={event => event.preventDefault()}
            onDrop={event => {
              event.preventDefault();
              place(slot, event.dataTransfer.getData(SHAPE_DRAG_TYPE));
            }}
            onClick={() => place(slot, selected)}
          >
            {placed[slot.id] || round.showOutlines || hint ? (
              <ShapeDrawing kind={slot.kind} rotation={slot.rotation} color={placed[slot.id]?.color ?? '#eef0f3'} outline={!placed[slot.id]} />
            ) : <span aria-hidden="true">?</span>}
          </button>
        ))}
      </div>
      <div className={`shape-pieces ${round.pieces.length > 4 ? 'shape-pieces-advanced' : ''}`} role="group" aria-label="可用的图形">
        {available.map(piece => (
          <button
            key={piece.id}
            className={`puzzle-tile shape-piece ${selected === piece.id ? 'is-selected' : ''} ${hint && !selected && piece.id === hintedPiece?.id ? 'is-hinted' : ''}`}
            aria-label={`选择${piece.label}`}
            aria-pressed={selected === piece.id}
            disabled={solved}
            draggable={!solved}
            onDragStart={event => {
              event.dataTransfer.setData(SHAPE_DRAG_TYPE, piece.id);
              setSelected(piece.id);
            }}
            onClick={() => {
              setSelected(piece.id);
              onNotice(`选好了${piece.label}，放到哪里呢？`);
            }}
          >
            <span className="shape-piece-art" style={{ width: `${(piece.size ?? largestSize) / largestSize * 100}%` }}>
              <ShapeDrawing kind={piece.kind} rotation={rotations[piece.id] ?? piece.rotation} color={piece.color} />
            </span>
          </button>
        ))}
      </div>
      {round.canRotate && (
        <button
          className="puzzle-action"
          aria-label="旋转选中的图形"
          disabled={solved || !selectedPiece}
          onClick={() => {
            if (!selectedPiece) return;
            setRotations(previous => ({
              ...previous,
              [selectedPiece.id]: ((previous[selectedPiece.id] ?? selectedPiece.rotation) + 90) % 360,
            }));
            onNotice('转一下，再看看方向。');
          }}
        >↻ 转一转</button>
      )}
    </div>
  );
}

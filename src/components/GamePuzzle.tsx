import { useEffect, useRef, useState, type ComponentType } from 'react';
import { speak, stopSpeaking } from '../audio/speak';
import { GAME_INFO } from '../data/games';
import { PUZZLE_ROUND_COUNT, SORT_RULE_LABELS, SORT_RULES, scorePuzzleRound } from '../data/puzzleGames';
import type { PuzzleGameType, PuzzleProgress } from '../types';
import { starsForScore } from './gameUtils';
import { StarRating } from './StarRating';
import {
  MazePuzzle,
  MissingPuzzle,
  PatternPuzzle,
  ShapesPuzzle,
  SortingPuzzle,
  type PuzzleRoundProps,
} from './PuzzleRounds';
import './PuzzleGames.css';

const ROUND_COMPONENTS: Record<PuzzleGameType, ComponentType<PuzzleRoundProps>> = {
  pattern: PatternPuzzle,
  sorting: SortingPuzzle,
  maze: MazePuzzle,
  missing: MissingPuzzle,
  shapes: ShapesPuzzle,
};

const HINTS: Record<PuzzleGameType, string> = {
  pattern: '找一找重复的一组，再看看亮起来的水果。',
  sorting: '先选一只小动物，再看看亮起来的小屋。',
  maze: '亮起来的小路可以走。一步一步来，走错也能退回来。',
  missing: '再看看刚才的伙伴，亮起来的是藏起来的那一位。',
  shapes: '选中亮起来的图形，再对照形状和方向，放进亮起来的轮廓。',
};

function instructions(type: PuzzleGameType, level: number): string {
  switch (type) {
    case 'pattern': return '水果一组一组排好队。问号车厢该装什么？点一点下面的水果。';
    case 'sorting': return `这一关按${SORT_RULE_LABELS[SORT_RULES[level]]}找家。先点一只小动物，再点它的小屋，也可以拖过去。`;
    case 'maze': return '帮小兔找到胡萝卜。点旁边的小路，或用方向按钮，一次走一格。走错可以退回来。';
    case 'missing': return '慢慢看，记住这些伙伴。准备好了点我记住了，再找谁藏起来了。';
    case 'shapes': return `看看小样图。先选一块图形，再点它的位置，也可以拖过去。${level >= 20 ? '方向不同，还可以转一转。' : ''}`;
  }
}

interface Props {
  type: PuzzleGameType;
  progress: PuzzleProgress | null;
  onSaveLevel: (level: number, score: number) => Promise<PuzzleProgress | null>;
  onRestart: () => Promise<PuzzleProgress | null>;
  onFinish: (score: number, stars: 0 | 1 | 2 | 3, isNewBest: boolean) => void;
  onExit: () => void;
}

export function GamePuzzle({ type, progress, onSaveLevel, onRestart, onFinish, onExit }: Props) {
  const [saved, setSaved] = useState(progress);
  const [level, setLevel] = useState(Math.min(progress?.levelScores.length ?? 0, PUZZLE_ROUND_COUNT - 1));
  const [showCompleted, setShowCompleted] = useState(progress?.levelScores.length === PUZZLE_ROUND_COUNT);
  const [solved, setSolved] = useState(false);
  const [hint, setHint] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'notice' | 'retry' | 'success'; message: string } | null>(null);
  const mistakes = useRef(0);
  const completed = useRef(false);
  const finished = useRef(false);
  const mounted = useRef(true);
  const saveInFlight = useRef(false);
  const pending = useRef<{ level: number; score: number; message: string } | null>(null);
  const container = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const savedCount = saved?.levelScores.length ?? 0;
  const score = saved?.levelScores.reduce((sum, value) => sum + value, 0) ?? 0;
  const info = GAME_INFO[type];
  const instruction = showCompleted ? `全部${PUZZLE_ROUND_COUNT}关都完成啦！可以查看成绩，也可以再玩一轮。` : instructions(type, level);
  const Round = ROUND_COMPONENTS[type];
  const lastRound = level + 1 === PUZZLE_ROUND_COUNT;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (container.current) container.current.scrollTop = 0;
    heading.current?.focus({ preventScroll: true });
    void speak(instruction, { rate: 0.85 });
    return () => { void stopSpeaking(); };
  }, [instruction, level]);

  useEffect(() => {
    if (solved && !saving) nextButton.current?.focus();
  }, [solved, saving, saveError]);

  function say(message: string, kind: 'notice' | 'retry' | 'success' = 'notice') {
    setFeedback({ kind, message });
    void speak(message, { rate: 0.85 });
  }

  async function saveRound() {
    const round = pending.current;
    if (!round || saveInFlight.current) return;
    saveInFlight.current = true;
    setSaving(true);
    setSaveError(null);
    const result = await onSaveLevel(round.level, round.score);
    saveInFlight.current = false;
    if (!mounted.current) return;
    setSaving(false);
    if (!result) {
      setSaveError('这一关的保存尚未确认。请重试；现在离开，可能需要重玩这一关。');
      return;
    }
    setSaved(result);
    say(`${round.message}进度已保存。${lastRound ? '点收下星星，看看你的收获吧。' : '可以点下一关，也可以先休息。'}`, 'success');
  }

  function complete(message = '你做到了！') {
    if (completed.current || finished.current) return;
    completed.current = true;
    pending.current = { level, score: scorePuzzleRound(mistakes.current), message };
    setSolved(true);
    setFeedback({ kind: 'success', message: `${message}正在保存本关…` });
    void saveRound();
  }

  function showResult() {
    if (finished.current || savedCount !== PUZZLE_ROUND_COUNT || !saved) return;
    finished.current = true;
    void stopSpeaking();
    onFinish(score, starsForScore(score, PUZZLE_ROUND_COUNT * 20), saved.isNewBest);
  }

  function next() {
    if (!completed.current || saving || saveError || savedCount <= level || finished.current) return;
    if (lastRound) {
      showResult();
      return;
    }
    completed.current = false;
    pending.current = null;
    mistakes.current = 0;
    setFeedback(null);
    setHint(false);
    setSolved(false);
    setLevel(previous => previous + 1);
  }

  async function restart() {
    if (saveInFlight.current) return;
    saveInFlight.current = true;
    setSaving(true);
    setSaveError(null);
    const result = await onRestart();
    saveInFlight.current = false;
    if (!mounted.current) return;
    setSaving(false);
    if (!result) {
      setSaveError('暂时无法重新开始，原来的进度和成绩已保留。请再试一次。');
      return;
    }
    setSaved(result);
    setShowCompleted(false);
    setLevel(0);
    setSolved(false);
    setHint(false);
    setFeedback(null);
    completed.current = false;
    finished.current = false;
    pending.current = null;
    mistakes.current = 0;
  }

  return (
    <section ref={container} className="page-main puzzle-game" aria-label={info.label}>
      <div className="puzzle-toolbar">
        <button className="puzzle-action" disabled={saving} onClick={onExit}>← 选游戏</button>
        <span className="puzzle-age">动脑小游戏 · 5–6 岁</span>
      </div>
      <h2 ref={heading} tabIndex={-1}>{info.emoji} {info.label}</h2>
      <div
        className="puzzle-progress"
        role="progressbar"
        aria-label="闯关进度"
        aria-valuemin={0}
        aria-valuemax={PUZZLE_ROUND_COUNT}
        aria-valuenow={savedCount}
        aria-valuetext={`已保存 ${savedCount} 关，共 ${PUZZLE_ROUND_COUNT} 关`}
      >
        <span>{showCompleted ? `已完成 ${PUZZLE_ROUND_COUNT}` : `第 ${level + 1}`} / {PUZZLE_ROUND_COUNT} 关</span>
        <span className="puzzle-progress-track" aria-hidden="true">
          <span style={{ width: `${savedCount / PUZZLE_ROUND_COUNT * 100}%` }} />
        </span>
      </div>
      <p className="puzzle-saved-progress">已保存 {savedCount} 关 · 本轮累计 {score} 分</p>
      <div className="puzzle-instructions">
        <p>{instruction}</p>
        <button className="puzzle-action" aria-label="听玩法" onClick={() => void speak(instruction, { rate: 0.85 })}>🔊</button>
      </div>
      {showCompleted ? (
        <div className="puzzle-completed">
          <h3>🎉 全部 {PUZZLE_ROUND_COUNT} 关已完成！</h3>
          <StarRating stars={starsForScore(score, PUZZLE_ROUND_COUNT * 20)} size={44} />
          <p>进度和成绩都已保存，休息一下吧。</p>
          {saveError && <p className="puzzle-save-error" role="alert">{saveError}</p>}
          <div className="puzzle-completed-actions">
            <button className="puzzle-action puzzle-primary" disabled={saving} onClick={showResult}>查看成绩</button>
            <button className="puzzle-action" disabled={saving} onClick={() => void restart()}>
              {saving ? '正在准备…' : '再玩一轮'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <Round
            key={`${type}-${level}`}
            level={level}
            hint={hint}
            solved={solved}
            onComplete={complete}
            onMistake={message => {
              if (completed.current) return;
              mistakes.current += 1;
              say(message, 'retry');
            }}
            onNotice={message => {
              if (!completed.current) say(message);
            }}
          />
          <div className={`puzzle-feedback ${feedback ? `puzzle-feedback-${feedback.kind}` : ''}`} role="status" aria-live="polite">
            {feedback ? `${feedback.kind === 'success' ? '🌟 ' : ''}${feedback.message}` : '慢慢想，不着急。需要帮忙就点下面的小灯泡。'}
          </div>
          {saveError && <p className="puzzle-save-error" role="alert">{saveError}</p>}
          <div className="puzzle-footer">
            {solved && saveError ? (
              <button ref={nextButton} className="puzzle-action" onClick={() => void saveRound()}>重试保存本关</button>
            ) : solved && saving ? (
              <button className="puzzle-action" disabled>正在保存本关…</button>
            ) : solved ? (
              <button ref={nextButton} className="puzzle-action puzzle-primary" onClick={next}>
                {lastRound ? '⭐ 收下星星' : '下一关 →'}
              </button>
            ) : (
              <button
                className="puzzle-action"
                onClick={() => {
                  if (completed.current) return;
                  if (!hint) {
                    mistakes.current += 1;
                    setHint(true);
                  }
                  say(HINTS[type]);
                }}
              >💡 帮帮我</button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

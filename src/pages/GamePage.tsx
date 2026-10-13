import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useProgress } from '../hooks/useProgress';
import { TopBar } from '../components/TopBar';
import { GameListenChoose } from '../components/GameListenChoose';
import { GameImageChoose } from '../components/GameImageChoose';
import { GameMemoryFlip } from '../components/GameMemoryFlip';
import { GameHanziWrite } from '../components/GameHanziWrite';
import { GamePuzzle } from '../components/GamePuzzle';
import { StarRating } from '../components/StarRating';
import { GAME_INFO, LEARNING_GAME_TYPES, PUZZLE_GAME_TYPES, isPuzzleGame } from '../data/games';
import { PUZZLE_ROUND_COUNT } from '../data/puzzleGames';
import type { GameType, PuzzleProgress } from '../types';
import './Games.css';

type Phase = 'select' | 'playing' | 'saving' | 'result';

interface Result {
  gameType: GameType;
  score: number;
  stars: 0 | 1 | 2 | 3;
  isNewBest: boolean;
  saved: boolean;
}

export function GamePage() {
  const { user, logout } = useUser();
  const { gameScores, puzzleProgress, loading, error, refresh, recordGame, savePuzzleLevel, restartPuzzle } = useProgress(user?.id);
  const [phase, setPhase] = useState<Phase>('select');
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const finishing = useRef(false);
  const navigate = useNavigate();
  const totalStars = gameScores.reduce((s, g) => s + g.bestStars, 0);

  if (!user) return null;

  async function finish(type: GameType, score: number, stars: 0 | 1 | 2 | 3) {
    if (finishing.current) return;
    finishing.current = true;
    setPhase('saving');
    const r = await recordGame(type, score, stars);
    setResult({ gameType: type, score, stars, isNewBest: r?.isNewBest ?? false, saved: r != null });
    setPhase('result');
  }

  function reset() {
    finishing.current = false;
    setPhase('select');
    setGameType(null);
    setResult(null);
    void refresh();
  }

  function finishPuzzle(type: GameType, score: number, stars: 0 | 1 | 2 | 3, isNewBest: boolean) {
    if (finishing.current) return;
    finishing.current = true;
    setResult({ gameType: type, score, stars, isNewBest, saved: true });
    setPhase('result');
  }

  return (
    <div className="app-shell">
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />

      {phase === 'select' && (
        <div className="page-main game-selector">
          <h2 style={{ fontSize: 'clamp(22px, 3vh, 28px)', textAlign: 'center', margin: 0 }}>选个游戏来玩吧 🎮</h2>
          {loading && <p role="status">正在读取进度…</p>}
          {error && (
            <div className="game-save-error" role="alert">
              <p>{error}</p>
              <button className="puzzle-action" disabled={loading} onClick={() => void refresh()}>重试读取进度</button>
            </div>
          )}
          <section aria-labelledby="puzzle-games-heading">
            <h3 id="puzzle-games-heading">动脑小游戏 <span>5–6 岁 · 每款 {PUZZLE_ROUND_COUNT} 关 · 自动保存</span></h3>
            <div className="game-menu-grid">
              {PUZZLE_GAME_TYPES.map(type => (
                <GameButton
                  key={type}
                  type={type}
                  progress={puzzleProgress.find(progress => progress.gameType === type)}
                  disabled={loading || !!error}
                  onClick={() => { setGameType(type); setPhase('playing'); }}
                />
              ))}
            </div>
          </section>
          <section aria-labelledby="learning-games-heading">
            <h3 id="learning-games-heading">拼音和汉字</h3>
            <div className="game-menu-grid">
              {LEARNING_GAME_TYPES.map(type => (
                <GameButton key={type} type={type} onClick={() => { setGameType(type); setPhase('playing'); }} />
              ))}
            </div>
          </section>
          <button onClick={() => navigate('/')} style={{ marginTop: 16, padding: 12, fontSize: 18, background: 'transparent', border: '2px solid #ccc', borderRadius: 12, cursor: 'pointer' }}>← 回首页</button>
        </div>
      )}

      {phase === 'playing' && gameType === 'listen' && <GameListenChoose onFinish={(s, st) => void finish('listen', s, st)} />}
      {phase === 'playing' && gameType === 'image' && <GameImageChoose onFinish={(s, st) => void finish('image', s, st)} />}
      {phase === 'playing' && gameType === 'memory' && <GameMemoryFlip onFinish={(s, st) => void finish('memory', s, st)} />}
      {phase === 'playing' && gameType === 'hanzi' && <GameHanziWrite userId={user.id} onFinish={(s, st) => void finish('hanzi', s, st)} />}
      {phase === 'playing' && gameType && isPuzzleGame(gameType) && (
        <GamePuzzle
          key={`${user.id}:${gameType}`}
          type={gameType}
          progress={puzzleProgress.find(progress => progress.gameType === gameType) ?? null}
          onSaveLevel={(level, score) => savePuzzleLevel(gameType, level, score)}
          onRestart={() => restartPuzzle(gameType)}
          onFinish={(score, stars, isNewBest) => finishPuzzle(gameType, score, stars, isNewBest)}
          onExit={reset}
        />
      )}

      {phase === 'saving' && <div className="page-main game-saving" role="status">正在收好你的星星… ⭐</div>}

      {phase === 'result' && result && (
        <div className="page-main">
          <div className="game-result">
            <p>{GAME_INFO[result.gameType].emoji} {GAME_INFO[result.gameType].label}</p>
            <h2 style={{ fontSize: 36 }}>{result.isNewBest ? '🎉 新纪录！' : '游戏结束'}</h2>
            <div style={{ fontSize: 28, marginTop: 16 }}>得分：{result.score}</div>
            <div style={{ marginTop: 16 }}><StarRating stars={result.stars} size={56} /></div>
            {!result.saved && (
              <div className="game-save-error" role="alert">
                <p>成绩暂时没有保存，请再试一次。</p>
                <button className="puzzle-action" onClick={() => {
                  finishing.current = false;
                  void finish(result.gameType, result.score, result.stars);
                }}>重试保存</button>
              </div>
            )}
            <div className="game-result-actions">
              <button onClick={reset} style={{ flex: 1, padding: 16, fontSize: 20, borderRadius: 16, border: 'none', background: '#06d6a0', color: '#fff', cursor: 'pointer' }}>再选游戏</button>
              <button onClick={() => navigate('/')} style={{ flex: 1, padding: 16, fontSize: 20, borderRadius: 16, border: '2px solid #ccc', background: '#fff', cursor: 'pointer' }}>回首页</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GameButton({ type, progress, disabled, onClick }: { type: GameType; progress?: PuzzleProgress; disabled?: boolean; onClick: () => void }) {
  const { emoji, label, color, description } = GAME_INFO[type];
  const completed = progress?.levelScores.length ?? 0;
  return (
    <button className="game-menu-card" aria-label={label} aria-describedby={isPuzzleGame(type) ? `game-progress-${type}` : undefined} disabled={disabled} onClick={onClick} style={{ borderColor: color }}>
      <span className="game-menu-emoji" aria-hidden="true">{emoji}</span>
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
        {isPuzzleGame(type) && (
          <small className="game-card-progress" id={`game-progress-${type}`}>
            {completed === PUZZLE_ROUND_COUNT
              ? `${PUZZLE_ROUND_COUNT} 关已通关 · 可再玩一轮`
              : completed > 0
                ? `已完成 ${completed} / ${PUZZLE_ROUND_COUNT} 关 · 继续第 ${completed + 1} 关`
                : `${PUZZLE_ROUND_COUNT} 关 · 随时休息，下次继续`}
          </small>
        )}
      </span>
    </button>
  );
}

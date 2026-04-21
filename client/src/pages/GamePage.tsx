import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useProgress } from '../hooks/useProgress';
import { TopBar } from '../components/TopBar';
import { GameListenChoose } from '../components/GameListenChoose';
import { GameImageChoose } from '../components/GameImageChoose';
import { GameMemoryFlip } from '../components/GameMemoryFlip';
import { StarRating } from '../components/StarRating';
import type { GameType } from '../types';

type Phase = 'select' | 'playing' | 'result';

interface Result {
  gameType: GameType;
  score: number;
  stars: 0 | 1 | 2 | 3;
  isNewBest: boolean;
}

export function GamePage() {
  const { user, logout } = useUser();
  const { gameScores, recordGame } = useProgress(user?.id);
  const [phase, setPhase] = useState<Phase>('select');
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const navigate = useNavigate();
  const totalStars = gameScores.reduce((s, g) => s + g.bestStars, 0);

  if (!user) return null;

  async function finish(type: GameType, score: number, stars: 0 | 1 | 2 | 3) {
    const r = await recordGame(type, score, stars);
    setResult({ gameType: type, score, stars, isNewBest: r?.isNewBest ?? false });
    setPhase('result');
  }

  function reset() {
    setPhase('select');
    setGameType(null);
    setResult(null);
  }

  return (
    <div>
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />

      {phase === 'select' && (
        <div style={{ maxWidth: 720, margin: '24px auto', padding: 16, display: 'grid', gap: 16 }}>
          <h2 style={{ fontSize: 28, textAlign: 'center' }}>选个游戏来玩吧 🎮</h2>
          <GameButton emoji="🎧" label="听音选字母" color="#8ecae6" onClick={() => { setGameType('listen'); setPhase('playing'); }} />
          <GameButton emoji="🖼" label="看图选拼音" color="#fb8500" onClick={() => { setGameType('image'); setPhase('playing'); }} />
          <GameButton emoji="🃏" label="翻牌配对" color="#06d6a0" onClick={() => { setGameType('memory'); setPhase('playing'); }} />
          <button onClick={() => navigate('/')} style={{ marginTop: 16, padding: 12, fontSize: 18, background: 'transparent', border: '2px solid #ccc', borderRadius: 12, cursor: 'pointer' }}>← 回首页</button>
        </div>
      )}

      {phase === 'playing' && gameType === 'listen' && <GameListenChoose onFinish={(s, st) => void finish('listen', s, st)} />}
      {phase === 'playing' && gameType === 'image' && <GameImageChoose onFinish={(s, st) => void finish('image', s, st)} />}
      {phase === 'playing' && gameType === 'memory' && <GameMemoryFlip onFinish={(s, st) => void finish('memory', s, st)} />}

      {phase === 'result' && result && (
        <div style={{ maxWidth: 480, margin: '40px auto', padding: 32, textAlign: 'center', background: '#fff', borderRadius: 24, border: '4px solid #ffd166' }}>
          <h2 style={{ fontSize: 36 }}>{result.isNewBest ? '🎉 新纪录！' : '游戏结束'}</h2>
          <div style={{ fontSize: 28, marginTop: 16 }}>得分：{result.score}</div>
          <div style={{ marginTop: 16 }}><StarRating stars={result.stars} size={56} /></div>
          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            <button onClick={reset} style={{ flex: 1, padding: 16, fontSize: 20, borderRadius: 16, border: 'none', background: '#06d6a0', color: '#fff', cursor: 'pointer' }}>再玩一局</button>
            <button onClick={() => navigate('/')} style={{ flex: 1, padding: 16, fontSize: 20, borderRadius: 16, border: '2px solid #ccc', background: '#fff', cursor: 'pointer' }}>回首页</button>
          </div>
        </div>
      )}
    </div>
  );
}

function GameButton({ emoji, label, color, onClick }: { emoji: string; label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
      padding: 24, fontSize: 28, borderRadius: 24,
      border: `4px solid ${color}`, background: '#fff', cursor: 'pointer',
    }}>
      <span style={{ fontSize: 48 }}>{emoji}</span>
      <span style={{ fontWeight: 'bold' }}>{label}</span>
    </button>
  );
}

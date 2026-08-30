import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { getAdjacentReading, getReading } from '../data/readings';
import { useProgress } from '../hooks/useProgress';
import { useReadingPlayer } from '../hooks/useReadingPlayer';
import { useUser } from '../hooks/useUser';
import type { ReadingNewCharacter, ReadingToken } from '../types';
import { markReadingVisited } from '../utils/readingProgress';
import './ReadingPages.css';

export function ReadingDetailPage() {
  const { readingId } = useParams<{ readingId: string }>();
  const { user, logout } = useUser();
  const { gameScores } = useProgress(user?.id);
  const reading = getReading(readingId);
  const pageRef = useRef<HTMLElement | null>(null);
  const sentenceRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [selectedNewCharacter, setSelectedNewCharacter] = useState<ReadingNewCharacter | null>(null);
  const sentences = useMemo(
    () => reading?.paragraphs.flatMap((paragraph) => paragraph.sentences) ?? [],
    [reading],
  );
  const player = useReadingPlayer(sentences);

  useEffect(() => {
    setSelectedNewCharacter(null);
    if (typeof pageRef.current?.scrollTo === 'function') {
      pageRef.current.scrollTo({ top: 0 });
    }
    if (user && reading) markReadingVisited(user.id, reading.id);
  }, [user?.id, reading]);

  useEffect(() => {
    if (player.status !== 'playing' || player.currentIndex < 0) return;
    const currentSentence = sentenceRefs.current[player.currentIndex];
    if (typeof currentSentence?.scrollIntoView === 'function') {
      currentSentence.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [player.status, player.currentIndex]);

  if (!user) return null;
  if (!reading) return <Navigate to="/readings" replace />;

  const totalStars = gameScores.reduce((sum, game) => sum + game.bestStars, 0);
  const adjacent = getAdjacentReading(reading.id);
  const statusText = {
    idle: '准备好后，点播放开始朗读',
    playing: player.currentIndex >= 0
      ? `正在朗读第 ${player.currentIndex + 1} 句`
      : '正在准备朗读',
    paused: '已暂停，继续时会从当前句重新朗读',
    finished: '朗读完成，可以再读一遍',
  }[player.status];

  let sentenceIndex = 0;

  return (
    <div className="app-shell">
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />
      <main ref={pageRef} className="page-main fit-screen reading-detail-page">
        <Link className="reading-back-link" to="/readings">← 返回短文列表</Link>

        <article className="reading-article">
          <header className="reading-article-header">
            <div className="reading-article-meta">
              <span>{reading.theme}</span>
              <span>{reading.characterCount} 字</span>
              <span>难度 {reading.difficulty} / 5</span>
            </div>
            <h1 aria-label={reading.title}>
              <AnnotatedTokens
                tokens={reading.titleTokens}
                newCharacters={reading.newCharacters}
                onNewCharacter={setSelectedNewCharacter}
              />
            </h1>
          </header>

          <section className="reading-player" aria-label="短文朗读控制">
            <div className="reading-player-buttons">
              <button
                className="reading-play-button"
                type="button"
                onClick={player.play}
                disabled={player.status === 'playing'}
              >
                {player.status === 'paused'
                  ? '▶️ 继续'
                  : player.status === 'finished'
                    ? '🔁 重播'
                    : '▶️ 播放'}
              </button>
              <button
                className="reading-pause-button"
                type="button"
                onClick={player.pause}
                disabled={player.status !== 'playing'}
              >
                ⏸️ 暂停
              </button>
            </div>
            <p aria-live="polite">{statusText}</p>
          </section>

          {reading.newCharacters.length > 0 && (
            <aside className="reading-new-character-note">
              <strong>🌱 生字提示：</strong>
              粉色的字是本篇生字，点一下可以放大查看拼音。
            </aside>
          )}

          {selectedNewCharacter && (
            <div
              className="reading-new-character-overlay"
              onClick={() => setSelectedNewCharacter(null)}
            >
              <section
                className="reading-new-character-card"
                role="dialog"
                aria-modal="true"
                aria-label="生字卡"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="reading-new-character-close"
                  onClick={() => setSelectedNewCharacter(null)}
                  aria-label="关闭生字卡"
                >
                  ×
                </button>
                <span>本篇生字</span>
                <ruby>
                  {selectedNewCharacter.char}
                  <rt>{selectedNewCharacter.pinyin}</rt>
                </ruby>
              </section>
            </div>
          )}

          <div className="reading-copy">
            {reading.paragraphs.map((paragraph, paragraphIndex) => (
              <p key={paragraphIndex}>
                {paragraph.sentences.map((sentence) => {
                  const index = sentenceIndex++;
                  const isCurrent = index === player.currentIndex;
                  return (
                    <span
                      key={`${reading.id}-${index}`}
                      ref={(element) => { sentenceRefs.current[index] = element; }}
                      className={`reading-sentence${isCurrent ? ' is-current' : ''}`}
                      aria-current={isCurrent ? 'true' : undefined}
                    >
                      <AnnotatedTokens
                        tokens={sentence.tokens}
                        newCharacters={reading.newCharacters}
                        onNewCharacter={setSelectedNewCharacter}
                      />
                    </span>
                  );
                })}
              </p>
            ))}
          </div>
        </article>

        <nav className="reading-adjacent-nav" aria-label="上一篇和下一篇">
          {adjacent.previous
            ? <Link to={`/readings/${adjacent.previous.id}`}>← {adjacent.previous.title}</Link>
            : <span />}
          {adjacent.next
            ? <Link to={`/readings/${adjacent.next.id}`}>{adjacent.next.title} →</Link>
            : <span />}
        </nav>
      </main>
    </div>
  );
}

function AnnotatedTokens({
  tokens,
  newCharacters,
  onNewCharacter,
}: {
  tokens: ReadingToken[];
  newCharacters: ReadingNewCharacter[];
  onNewCharacter: (character: ReadingNewCharacter) => void;
}) {
  const newCharacterMap = useMemo(
    () => new Map(newCharacters.map((item) => [item.char, item])),
    [newCharacters],
  );

  return tokens.map((token, index) => {
    if (!token.pinyin) {
      return <span className="reading-punctuation" key={index}>{token.text}</span>;
    }

    const ruby = (
      <ruby>
        {token.text}
        <rt>{token.pinyin}</rt>
      </ruby>
    );
    const newCharacter = token.isNew ? newCharacterMap.get(token.text) : undefined;

    return newCharacter ? (
      <button
        type="button"
        className="reading-new-character"
        key={index}
        onClick={() => onNewCharacter(newCharacter)}
        aria-label={`查看生字 ${newCharacter.char}，拼音 ${newCharacter.pinyin}`}
      >
        {ruby}
      </button>
    ) : (
      <span className="reading-token" key={index}>{ruby}</span>
    );
  });
}

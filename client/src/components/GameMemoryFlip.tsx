import { useEffect, useMemo, useState } from 'react';
import { PINYIN_DATA } from '../data/pinyin';
import { useAudio } from '../hooks/useAudio';
import { pickN, shuffle } from './gameUtils';
import { StarRating } from './StarRating';

interface Card {
  uid: string;
  pinyinId: string;
  display: string;
  audioText: string;
}

const PAIRS_COUNT = 6;

function buildDeck(): Card[] {
  const picks = pickN(PINYIN_DATA, PAIRS_COUNT);
  const cards: Card[] = picks.flatMap((p, i) => ([
    { uid: `${p.id}-a-${i}`, pinyinId: p.id, display: p.display, audioText: p.audioText },
    { uid: `${p.id}-b-${i}`, pinyinId: p.id, display: p.display, audioText: p.audioText },
  ]));
  return shuffle(cards);
}

interface Props {
  onFinish: (score: number, stars: 0 | 1 | 2 | 3) => void;
}

export function GameMemoryFlip({ onFinish }: Props) {
  const [deck] = useState<Card[]>(() => buildDeck());
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [tries, setTries] = useState(0);
  const { play } = useAudio();

  const isDone = matched.size === deck.length;

  const stars = useMemo<0 | 1 | 2 | 3>(() => {
    if (!isDone) return 0;
    if (tries <= PAIRS_COUNT + 2) return 3;
    if (tries <= PAIRS_COUNT + 5) return 2;
    if (tries <= PAIRS_COUNT + 9) return 1;
    return 0;
  }, [isDone, tries]);

  useEffect(() => {
    if (isDone) onFinish(matched.size / 2, stars);
  }, [isDone, matched.size, stars, onFinish]);

  function flip(card: Card) {
    if (flipped.length === 2) return;
    if (flipped.includes(card.uid)) return;
    if (matched.has(card.uid)) return;

    void play(card.audioText);
    const next = [...flipped, card.uid];
    setFlipped(next);

    if (next.length === 2) {
      setTries(t => t + 1);
      const [a, b] = next.map(uid => deck.find(c => c.uid === uid)!);
      if (a.pinyinId === b.pinyinId) {
        setTimeout(() => {
          setMatched(m => new Set([...m, a.uid, b.uid]));
          setFlipped([]);
        }, 600);
      } else {
        setTimeout(() => setFlipped([]), 900);
      }
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 18, color: '#666' }}>
        翻牌次数：{tries}　已配对：{matched.size / 2} / {PAIRS_COUNT}　<StarRating stars={stars} size={20} />
      </div>
      <h2 style={{ fontSize: 28, marginTop: 16 }}>找出两张相同的拼音卡片 🃏</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
        {deck.map(card => {
          const open = flipped.includes(card.uid) || matched.has(card.uid);
          return (
            <button
              key={card.uid}
              onClick={() => flip(card)}
              style={{
                aspectRatio: '1', fontSize: 40, fontWeight: 'bold',
                borderRadius: 16, border: '3px solid #8ecae6',
                background: matched.has(card.uid) ? '#d8f3dc' : (open ? '#fff' : '#ffd166'),
                cursor: open ? 'default' : 'pointer',
              }}
            >
              {open ? card.display : '?'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

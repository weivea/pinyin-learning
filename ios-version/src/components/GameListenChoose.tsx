import { useEffect, useMemo, useState } from 'react';
import { PINYIN_DATA } from '../data/pinyin';
import { useAudio } from '../hooks/useAudio';
import { pickN, shuffle, starsForScore } from './gameUtils';
import { StarRating } from './StarRating';
import { pickAudioForItem, type PickedAudio } from './pickAudio';
import type { PinyinItem } from '../types';

interface Question {
  answer: PinyinItem;
  options: PinyinItem[];
  audio: PickedAudio;
}

const TOTAL_QUESTIONS = 10;

function buildQuestions(): Question[] {
  const picks = pickN(PINYIN_DATA, TOTAL_QUESTIONS);
  return picks.map(answer => {
    const distractors = pickN(PINYIN_DATA.filter(p => p.id !== answer.id), 3);
    return {
      answer,
      options: shuffle([answer, ...distractors]),
      audio: pickAudioForItem(answer),
    };
  });
}

interface Props {
  onFinish: (score: number, stars: 0 | 1 | 2 | 3) => void;
}

export function GameListenChoose({ onFinish }: Props) {
  const [questions] = useState<Question[]>(() => buildQuestions());
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null);
  const { playPinyin } = useAudio();
  const current = questions[index];

  useEffect(() => {
    if (current) void playPinyin(current.audio.base, current.audio.tone, current.audio.text);
  }, [current, playPinyin]);

  const stars = useMemo(() => starsForScore(correct, questions.length), [correct, questions.length]);

  function pick(option: PinyinItem) {
    if (feedback) return;
    const isRight = option.id === current.answer.id;
    if (isRight) setCorrect(c => c + 1);
    setFeedback(isRight ? 'right' : 'wrong');
    setTimeout(() => {
      setFeedback(null);
      if (index + 1 >= questions.length) onFinish(correct + (isRight ? 1 : 0), starsForScore(correct + (isRight ? 1 : 0), questions.length));
      else setIndex(i => i + 1);
    }, 900);
  }

  if (!current) return null;

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 18, color: '#666' }}>
        第 {index + 1} / {questions.length} 题　答对：{correct}　<StarRating stars={stars} size={20} />
      </div>

      <h2 style={{ fontSize: 32, marginTop: 24 }}>听一听，选对的字母 👇</h2>
      <button
        onClick={() => void playPinyin(current.audio.base, current.audio.tone, current.audio.text)}
        style={{ fontSize: 64, padding: 24, borderRadius: 32, border: 'none', background: '#ffd166', cursor: 'pointer', marginTop: 16 }}
        aria-label="再听一次"
      >
        🔊 再听一次
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 32 }}>
        {current.options.map(opt => (
          <button
            key={opt.id}
            onClick={() => pick(opt)}
            disabled={!!feedback}
            style={{
              padding: 32, fontSize: 64, fontWeight: 'bold',
              borderRadius: 24, border: '4px solid #8ecae6', background: '#fff',
              cursor: feedback ? 'default' : 'pointer',
            }}
          >
            {opt.display}
          </button>
        ))}
      </div>

      {feedback === 'right' && <div style={{ fontSize: 48, marginTop: 16 }}>🎉 答对了！</div>}
      {feedback === 'wrong' && <div style={{ fontSize: 24, marginTop: 16, color: '#fb8500' }}>差一点，再听听看～ 正确：{current.answer.display}</div>}
    </div>
  );
}

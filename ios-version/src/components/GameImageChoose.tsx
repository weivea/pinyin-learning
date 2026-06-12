import { useMemo, useState } from 'react';
import { PINYIN_DATA } from '../data/pinyin';
import { pickN, shuffle, starsForScore } from './gameUtils';
import { EmojiTile } from './EmojiTile';
import { StarRating } from './StarRating';
import type { ExampleWord } from '../types';

interface Question {
  answer: ExampleWord;
  options: string[];
}

const TOTAL_QUESTIONS = 10;

function buildQuestions(): Question[] {
  const allWords = PINYIN_DATA.flatMap(p => p.examples);
  const seen = new Set<string>();
  const unique = allWords.filter(w => {
    if (seen.has(w.hanzi)) return false;
    seen.add(w.hanzi);
    return true;
  });
  const picks = pickN(unique, TOTAL_QUESTIONS);
  return picks.map(answer => {
    const distractors = pickN(unique.filter(w => w.pinyin !== answer.pinyin), 3).map(w => w.pinyin);
    return { answer, options: shuffle([answer.pinyin, ...distractors]) };
  });
}

interface Props {
  onFinish: (score: number, stars: 0 | 1 | 2 | 3) => void;
}

export function GameImageChoose({ onFinish }: Props) {
  const [questions] = useState<Question[]>(() => buildQuestions());
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null);
  const current = questions[index];
  const stars = useMemo(() => starsForScore(correct, questions.length), [correct, questions.length]);

  function pick(option: string) {
    if (feedback) return;
    const isRight = option === current.answer.pinyin;
    if (isRight) setCorrect(c => c + 1);
    setFeedback(isRight ? 'right' : 'wrong');
    setTimeout(() => {
      setFeedback(null);
      if (index + 1 >= questions.length) {
        const final = correct + (isRight ? 1 : 0);
        onFinish(final, starsForScore(final, questions.length));
      } else setIndex(i => i + 1);
    }, 900);
  }

  if (!current) return null;

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 18, color: '#666' }}>
        第 {index + 1} / {questions.length} 题　答对：{correct}　<StarRating stars={stars} size={20} />
      </div>
      <h2 style={{ fontSize: 32, marginTop: 24 }}>看图，选对的拼音 👇</h2>
      <div style={{ marginTop: 16 }}>
        <EmojiTile emoji={current.answer.emoji} size={160} />
        <div style={{ fontSize: 48, fontWeight: 'bold', marginTop: 8 }}>{current.answer.hanzi}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 24 }}>
        {current.options.map(opt => (
          <button
            key={opt}
            onClick={() => pick(opt)}
            disabled={!!feedback}
            style={{
              padding: 24, fontSize: 36, fontWeight: 'bold',
              borderRadius: 24, border: '4px solid #8ecae6', background: '#fff',
              cursor: feedback ? 'default' : 'pointer',
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      {feedback === 'right' && <div style={{ fontSize: 48, marginTop: 16 }}>🎉 答对了！</div>}
      {feedback === 'wrong' && <div style={{ fontSize: 24, marginTop: 16, color: '#fb8500' }}>正确答案：{current.answer.pinyin}</div>}
    </div>
  );
}

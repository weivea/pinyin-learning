import type { ExampleWord as EW } from '../types';
import { EmojiTile } from './EmojiTile';
import { AudioButton } from './AudioButton';
import { useAudio } from '../hooks/useAudio';
import { buildSpellSteps } from '../utils/spell';
import { useMemo } from 'react';

interface Props { word: EW; }

export function ExampleWord({ word }: Props) {
  const { playSequence, spellIndex } = useAudio();
  const steps = useMemo(() => buildSpellSteps(word.hanzi, word.pinyin), [word.hanzi, word.pinyin]);

  const handleSpell = () => {
    void playSequence(steps);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: 16, borderRadius: 24, background: '#fff', border: '3px solid #8ecae6',
      gap: 8, minWidth: 120,
    }}>
      <EmojiTile emoji={word.emoji} size={64} />
      <div style={{ fontSize: 36, fontWeight: 'bold' }}>{word.hanzi}</div>
      <div style={{ fontSize: 24, color: '#666' }}>{word.pinyin}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <AudioButton
          text={word.hanzi}
          pinyin={word.pinyin}
          tone={word.tone}
          size="sm"
        />
        <button
          onClick={handleSpell}
          aria-label={`拼读 ${word.hanzi}`}
          style={{
            height: 32, padding: '0 12px', borderRadius: 16,
            border: '2px solid #06d6a0', background: '#fff',
            color: '#06d6a0', fontSize: 14, fontWeight: 'bold', cursor: 'pointer',
          }}
        >
          拼读
        </button>
      </div>
      <div style={{
        height: 24, marginTop: 4, fontSize: 16, color: '#888',
        display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {spellIndex >= 0 && steps.map((s, i) => (
          <span
            key={i}
            style={{
              fontWeight: i === spellIndex ? 'bold' : 'normal',
              color: i === spellIndex ? '#fb8500' : '#bbb',
              fontSize: i === spellIndex ? 18 : 14,
              transition: 'all 120ms',
            }}
          >
            {s.caption}
            {i < steps.length - 1 && <span style={{ marginLeft: 6 }}>›</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

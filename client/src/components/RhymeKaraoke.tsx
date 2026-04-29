import type { CSSProperties } from 'react';
import { tokenize } from '../utils/tokenize';
import { useKaraoke } from '../hooks/useKaraoke';

interface Props {
  text: string;
  tokens?: string[];
  isPlaying: boolean;
  durationMs: number;
}

export function RhymeKaraoke({ text, tokens, isPlaying, durationMs }: Props) {
  const list = tokenize(text, tokens);
  const { currentIndex } = useKaraoke(list.length, isPlaying, durationMs);

  return (
    <div style={containerStyle}>
      {list.map((tok, i) => {
        const state =
          currentIndex < 0 || i > currentIndex ? 'future'
          : i === currentIndex ? 'active'
          : 'past';
        return (
          <span
            key={i}
            data-testid="rhyme-token"
            data-state={state}
            style={tokenStyle(state)}
          >
            {tok}
          </span>
        );
      })}
    </div>
  );
}

const containerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  flexWrap: 'wrap',
  gap: 6,
  fontSize: 28,
  fontWeight: 600,
  margin: '12px 0',
};

function tokenStyle(state: 'past' | 'active' | 'future'): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-block',
    transition: 'all 120ms ease-out',
  };
  if (state === 'active') {
    return {
      ...base,
      color: '#fb8500',
      transform: 'scale(1.15)',
      textShadow: '0 0 8px rgba(251,133,0,0.4)',
    };
  }
  if (state === 'past') {
    return { ...base, color: '#999' };
  }
  return { ...base, color: '#333' };
}

import type { ToneVariant } from '../types';
import { useAudio } from '../hooks/useAudio';

interface Props {
  tones: ToneVariant[];
  onPlay?: (tone: ToneVariant) => void;
}

export function ToneButtons({ tones, onPlay }: Props) {
  const { play } = useAudio();
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
      {tones.map(t => (
        <button
          key={t.tone}
          onClick={() => { void play(t.audioText); onPlay?.(t); }}
          aria-label={`播放 ${t.text}`}
          style={{
            fontSize: 56, padding: '16px 28px', minWidth: 96,
            borderRadius: 24, border: '4px solid #ffb703', background: '#fff',
            cursor: 'pointer',
          }}
        >
          {t.text}
        </button>
      ))}
    </div>
  );
}

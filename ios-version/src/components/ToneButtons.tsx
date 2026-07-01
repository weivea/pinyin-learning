import type { ToneVariant } from '../types';
import { useAudio } from '../hooks/useAudio';
import { stripTone } from '../utils/pinyin';

interface Props {
  tones: ToneVariant[];
  /** 拼音基底（如 "a"、"üe"）。若未传，则从 tones[0].text 推导。 */
  basePinyin?: string;
  onPlay?: (tone: ToneVariant) => void;
}

export function ToneButtons({ tones, basePinyin, onPlay }: Props) {
  const { playPinyin } = useAudio();
  const base = basePinyin ?? stripTone(tones[0]?.text ?? '');
  return (
    <div style={{ display: 'flex', gap: 'clamp(8px, 1.5vw, 16px)', flexWrap: 'wrap', justifyContent: 'center' }}>
      {tones.map(t => (
        <button
          key={t.tone}
          onClick={() => { void playPinyin(base, t.tone); onPlay?.(t); }}
          aria-label={`播放 ${t.text}`}
          style={{
            fontSize: 'clamp(36px, 5vh, 56px)', padding: 'clamp(8px, 1.4vh, 16px) clamp(16px, 2.2vw, 28px)',
            minWidth: 'clamp(64px, 8vw, 96px)',
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

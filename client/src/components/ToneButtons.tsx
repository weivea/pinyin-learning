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
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
      {tones.map(t => (
        <button
          key={t.tone}
          onClick={() => { void playPinyin(base, t.tone, t.audioText); onPlay?.(t); }}
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

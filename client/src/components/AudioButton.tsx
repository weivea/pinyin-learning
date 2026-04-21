import { useAudio } from '../hooks/useAudio';
import { stripTone } from '../utils/pinyin';

interface Props {
  text: string;
  pinyin?: string;
  tone?: 0 | 1 | 2 | 3 | 4;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AudioButton({ text, pinyin, tone, label = '🔊', size = 'md' }: Props) {
  const { play, playPinyin } = useAudio();
  const sizes = { sm: 32, md: 48, lg: 72 };
  const px = sizes[size];

  const handleClick = () => {
    if (pinyin && tone && tone >= 1) {
      const base = stripTone(pinyin);
      void playPinyin(base, tone as 1 | 2 | 3 | 4, text);
    } else {
      void play(text);
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={`播放 ${text}`}
      style={{
        width: px, height: px, borderRadius: px / 2,
        border: 'none', background: '#ffd166', fontSize: px * 0.5,
      }}
    >
      {label}
    </button>
  );
}

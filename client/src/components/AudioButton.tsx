import { useAudio } from '../hooks/useAudio';

interface Props {
  text: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AudioButton({ text, label = '🔊', size = 'md' }: Props) {
  const { play } = useAudio();
  const sizes = { sm: 32, md: 48, lg: 72 };
  const px = sizes[size];
  return (
    <button
      onClick={() => void play(text)}
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

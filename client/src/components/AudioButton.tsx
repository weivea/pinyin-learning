import { useAudio } from '../hooks/useAudio';
import { stripTone } from '../utils/pinyin';

interface Props {
  /** 显示用文本/汉字。当无 pinyin 时也作为 Edge TTS 朗读输入。 */
  text: string;
  /** 拼音（带或不带声调皆可）。提供后将走静态拼音音频。 */
  pinyin?: string;
  /** 0 / undefined = 无调（声母或单韵母无调读）；1-4 = 带调。 */
  tone?: 0 | 1 | 2 | 3 | 4;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AudioButton({ text, pinyin, tone, label = '🔊', size = 'md' }: Props) {
  const { play, playPinyin } = useAudio();
  const sizes = { sm: 32, md: 48, lg: 72 };
  const px = sizes[size];

  const handleClick = () => {
    if (pinyin) {
      // 任何提供拼音的场景都走静态音频（带调或无调）。
      const base = stripTone(pinyin);
      void playPinyin(base, tone);
    } else {
      // 仅汉字（如例字"妈""爷爷"）走 Edge TTS。
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

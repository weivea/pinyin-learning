import type { ExampleWord as EW } from '../types';
import { EmojiTile } from './EmojiTile';
import { AudioButton } from './AudioButton';

interface Props { word: EW; }

export function ExampleWord({ word }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: 16, borderRadius: 24, background: '#fff', border: '3px solid #8ecae6',
      gap: 8, minWidth: 120,
    }}>
      <EmojiTile emoji={word.emoji} size={64} />
      <div style={{ fontSize: 36, fontWeight: 'bold' }}>{word.hanzi}</div>
      <div style={{ fontSize: 24, color: '#666' }}>{word.pinyin}</div>
      <AudioButton
        text={word.hanzi}
        pinyin={word.pinyin}
        tone={word.tone}
        size="sm"
      />
    </div>
  );
}

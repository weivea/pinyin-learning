import type { CSSProperties } from 'react';
import type { PinyinItem } from '../types';
import { AudioButton } from './AudioButton';
import { ToneButtons } from './ToneButtons';
import { ExampleWord } from './ExampleWord';

interface Props {
  item: PinyinItem;
  onPrev?: () => void;
  onNext?: () => void;
  onLearned?: () => void;
}

export function PinyinCard({ item, onPrev, onNext, onLearned }: Props) {
  return (
    <div style={{
      maxWidth: 720, margin: '24px auto', padding: 32,
      borderRadius: 32, background: '#fff', border: '4px solid #ffd166',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 160, fontWeight: 'bold', lineHeight: 1, color: '#fb8500' }}>
        {item.display}
      </div>

      {item.hasTones && item.tones ? (
        <div style={{ marginTop: 24 }}>
          <ToneButtons tones={item.tones} onPlay={() => onLearned?.()} />
        </div>
      ) : (
        <div style={{ marginTop: 24 }}>
          <AudioButton text={item.audioText} size="lg" />
        </div>
      )}

      <h3 style={{ marginTop: 32, fontSize: 24, color: '#666' }}>试着读这些字：</h3>
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
        {item.examples.map(w => <ExampleWord key={w.hanzi} word={w} />)}
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onPrev} disabled={!onPrev} style={navBtnStyle}>← 上一个</button>
        <button onClick={() => { onLearned?.(); onNext?.(); }} disabled={!onNext} style={{ ...navBtnStyle, background: '#06d6a0', color: '#fff' }}>
          下一个 →
        </button>
      </div>
    </div>
  );
}

const navBtnStyle: CSSProperties = {
  fontSize: 22, padding: '12px 24px', borderRadius: 16,
  border: '3px solid #8ecae6', background: '#fff', cursor: 'pointer',
};

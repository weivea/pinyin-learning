import type { PinyinItem } from '../types';
import { AudioButton } from './AudioButton';
import { ToneButtons } from './ToneButtons';
import { ExampleWord } from './ExampleWord';
import { MnemonicSection } from './MnemonicSection';
import './PinyinCard.css';

interface Props {
  item: PinyinItem;
  onPrev?: () => void;
  onNext?: () => void;
  onLearned?: () => void;
}

export function PinyinCard({ item, onPrev, onNext, onLearned }: Props) {
  return (
    <div className="pinyin-card">
      <div className="pinyin-card__columns">
        <div className="pinyin-card__primary">
          <div className="pinyin-card__glyph">{item.display}</div>

          {item.hasTones && item.tones ? (
            <div className="pinyin-card__audio">
              <ToneButtons tones={item.tones} basePinyin={item.display} onPlay={() => onLearned?.()} />
            </div>
          ) : (
            <div className="pinyin-card__audio">
              <AudioButton text={item.audioText} pinyin={item.id} size="lg" />
            </div>
          )}

          <MnemonicSection
            pinyinId={item.id}
            mnemonic={item.mnemonic}
            rhyme={item.rhyme}
          />
        </div>

        <div className="pinyin-card__secondary">
          <h3 className="pinyin-card__examples-title">试着读这些字：</h3>
          <div className="pinyin-card__examples">
            {item.examples.map(w => <ExampleWord key={w.hanzi} word={w} />)}
          </div>
        </div>
      </div>

      <div className="pinyin-card__nav">
        <button onClick={onPrev} disabled={!onPrev} className="pinyin-card__nav-btn">← 上一个</button>
        <button
          onClick={() => { onLearned?.(); onNext?.(); }}
          disabled={!onNext}
          className="pinyin-card__nav-btn"
          style={{ background: '#06d6a0', color: '#fff', borderColor: '#06d6a0' }}
        >
          下一个 →
        </button>
      </div>
    </div>
  );
}

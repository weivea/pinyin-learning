import type { CSSProperties } from 'react';
import type { PinyinCategory } from '../types';
import type { ReciterStatus } from '../hooks/useReciter';

export type ReciteScope = 'all' | PinyinCategory;

interface Props {
  status: ReciterStatus;
  scope: ReciteScope;
  onScopeChange: (scope: ReciteScope) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

const SCOPES: { id: ReciteScope; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'initial', label: '声母' },
  { id: 'simple-final', label: '单韵母' },
  { id: 'compound-final', label: '复韵母' },
  { id: 'whole-syllable', label: '整体认读' },
];

const btn = (extra: CSSProperties = {}): CSSProperties => ({
  minWidth: 96, minHeight: 56,
  padding: '12px 20px', fontSize: 20, fontWeight: 'bold',
  borderRadius: 14, border: '2px solid #ccc', background: '#fff', cursor: 'pointer',
  ...extra,
});

export function RecitationControls({
  status, scope, onScopeChange, onStart, onPause, onResume, onReset,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 0' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} role="radiogroup" aria-label="跟读范围">
        {SCOPES.map(s => (
          <button
            key={s.id}
            aria-label={s.label}
            aria-pressed={scope === s.id}
            onClick={() => onScopeChange(s.id)}
            style={btn({
              border: scope === s.id ? '3px solid #fb8500' : '2px solid #ccc',
              background: scope === s.id ? '#fff8e7' : '#fff',
            })}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        {(status === 'idle' || status === 'finished') && (
          <button aria-label="开始跟读" onClick={onStart}
                  style={btn({ background: '#06d6a0', color: '#fff', border: 'none' })}>
            ▶ 开始跟读
          </button>
        )}
        {status === 'playing' && (
          <>
            <button aria-label="暂停" onClick={onPause}
                    style={btn({ background: '#ffd166', border: 'none' })}>⏸ 暂停</button>
            <button aria-label="重置" onClick={onReset} style={btn()}>↺ 重置</button>
          </>
        )}
        {status === 'paused' && (
          <>
            <button aria-label="继续" onClick={onResume}
                    style={btn({ background: '#06d6a0', color: '#fff', border: 'none' })}>
              ▶ 继续
            </button>
            <button aria-label="重置" onClick={onReset} style={btn()}>↺ 重置</button>
          </>
        )}
      </div>
    </div>
  );
}

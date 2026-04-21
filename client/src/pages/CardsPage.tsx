import { useMemo, useState } from 'react';
import { useUser } from '../hooks/useUser';
import { useProgress } from '../hooks/useProgress';
import { TopBar } from '../components/TopBar';
import { PinyinGrid } from '../components/PinyinGrid';
import { PinyinCard } from '../components/PinyinCard';
import { getByCategory } from '../data/pinyin';
import type { PinyinCategory, PinyinItem } from '../types';

const CATEGORIES: { id: PinyinCategory; label: string }[] = [
  { id: 'initial', label: '声母' },
  { id: 'simple-final', label: '单韵母' },
  { id: 'compound-final', label: '复韵母' },
  { id: 'whole-syllable', label: '整体认读' },
];

export function CardsPage() {
  const { user, logout } = useUser();
  const { pinyinProgress, gameScores, learnPinyin } = useProgress(user?.id);
  const [category, setCategory] = useState<PinyinCategory>('initial');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const items = useMemo(() => getByCategory(category), [category]);
  const learnedIds = useMemo(
    () => new Set(pinyinProgress.filter(p => p.learnedCount > 0).map(p => p.pinyin)),
    [pinyinProgress]
  );
  const selectedIndex = selectedId ? items.findIndex(i => i.id === selectedId) : -1;
  const selected: PinyinItem | null = selectedIndex >= 0 ? items[selectedIndex] : null;
  const totalStars = gameScores.reduce((s, g) => s + g.bestStars, 0);

  if (!user) return null;

  return (
    <div>
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />

      <div style={{ maxWidth: 960, margin: '24px auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => { setCategory(c.id); setSelectedId(null); }}
              style={{
                padding: '12px 20px', fontSize: 20, borderRadius: 16,
                border: category === c.id ? '3px solid #fb8500' : '2px solid #ccc',
                background: category === c.id ? '#fff8e7' : '#fff', cursor: 'pointer',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {selected ? (
          <>
            <button onClick={() => setSelectedId(null)} style={{
              padding: '8px 16px', fontSize: 18, borderRadius: 12,
              border: '2px solid #ccc', background: '#fff', cursor: 'pointer',
            }}>← 返回列表</button>
            <PinyinCard
              item={selected}
              onPrev={selectedIndex > 0 ? () => setSelectedId(items[selectedIndex - 1].id) : undefined}
              onNext={selectedIndex < items.length - 1 ? () => setSelectedId(items[selectedIndex + 1].id) : undefined}
              onLearned={() => void learnPinyin(selected.id)}
            />
          </>
        ) : (
          <PinyinGrid items={items} learnedIds={learnedIds} onClick={item => {
            setSelectedId(item.id);
            void learnPinyin(item.id);
          }} />
        )}
      </div>
    </div>
  );
}

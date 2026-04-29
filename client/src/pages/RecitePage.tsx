import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '../hooks/useUser';
import { useProgress } from '../hooks/useProgress';
import { TopBar } from '../components/TopBar';
import { RecitationTable, type RecitationGroup } from '../components/RecitationTable';
import { RecitationControls, type ReciteScope } from '../components/RecitationControls';
import { useReciter } from '../hooks/useReciter';
import { getByCategory } from '../data/pinyin';
import { pinyinAudioUrl, stripTone } from '../utils/pinyin';
import { ttsUrl } from '../api/tts';
import type { PinyinItem } from '../types';

const GROUPS_META: { category: RecitationGroup['category']; label: string }[] = [
  { category: 'initial', label: '声母' },
  { category: 'simple-final', label: '单韵母' },
  { category: 'compound-final', label: '复韵母' },
  { category: 'whole-syllable', label: '整体认读' },
];

/** 播放一个 PinyinItem，监听 ended/error；失败 resolve 不抛。 */
function playReciteItem(item: PinyinItem): Promise<void> {
  return new Promise<void>((resolve) => {
    const base = stripTone(item.id);
    const url = pinyinAudioUrl(base);
    const audio = new Audio(url);
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    audio.onended = finish;
    audio.onerror = () => {
      // 静态失败 → TTS 兜底（无调单读）
      try {
        const tts = new Audio(ttsUrl(item.audioText));
        tts.onended = finish;
        tts.onerror = finish;
        void tts.play().catch(finish);
      } catch {
        finish();
      }
    };
    void audio.play().catch(() => audio.onerror?.(new Event('error') as any));
  });
}

export function RecitePage() {
  const { user, logout } = useUser();
  const { gameScores } = useProgress(user?.id);
  const [scope, setScope] = useState<ReciteScope>('all');

  const groups: RecitationGroup[] = useMemo(
    () => GROUPS_META.map(m => ({ ...m, items: getByCategory(m.category) })),
    [],
  );

  const reciteItems = useMemo<PinyinItem[]>(() => {
    if (scope === 'all') return groups.flatMap(g => g.items);
    return groups.find(g => g.category === scope)?.items ?? [];
  }, [scope, groups]);

  const reciter = useReciter(reciteItems, { onItem: (item) => playReciteItem(item) });

  // 范围变化时重置
  useEffect(() => { reciter.reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [scope]);

  const handleCellClick = useCallback((item: PinyinItem) => {
    if (reciter.status === 'playing') return;
    void playReciteItem(item);
  }, [reciter.status]);

  if (!user) return null;
  const totalStars = gameScores.reduce((s, g) => s + g.bestStars, 0);
  const highlightId = reciter.currentIndex >= 0 ? reciteItems[reciter.currentIndex]?.id ?? null : null;

  return (
    <div>
      <TopBar user={user} totalStars={totalStars} onLogout={logout} />
      <div style={{ maxWidth: 960, margin: '24px auto', padding: '0 16px' }}>
        <RecitationControls
          status={reciter.status}
          scope={scope}
          onScopeChange={setScope}
          onStart={reciter.start}
          onPause={reciter.pause}
          onResume={reciter.resume}
          onReset={reciter.reset}
        />
        <RecitationTable
          groups={groups}
          highlightId={highlightId}
          onCellClick={handleCellClick}
        />
      </div>
    </div>
  );
}

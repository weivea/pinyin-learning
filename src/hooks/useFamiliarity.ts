import { useCallback, useEffect, useState } from 'react';
import {
  getFamiliarity,
  setFamiliarity as saveFamiliarity,
  type FamiliarityKind,
} from '../utils/familiarity';

/** 详情页用的熟悉度 hook：本地 state + 持久化。
 *  返回 [level, setLevel]，setLevel 会写入本地存储并更新组件状态。 */
export function useFamiliarity(
  kind: FamiliarityKind,
  userId: number | undefined,
  id: string | undefined,
): readonly [number, (level: number) => void] {
  const [level, setLevelState] = useState(() =>
    id ? getFamiliarity(kind, userId, id) : 0,
  );

  useEffect(() => {
    setLevelState(id ? getFamiliarity(kind, userId, id) : 0);
  }, [kind, userId, id]);

  const setLevel = useCallback(
    (next: number) => {
      if (!id) return;
      const saved = saveFamiliarity(kind, userId, id, next);
      setLevelState(saved);
    },
    [kind, userId, id],
  );

  return [level, setLevel] as const;
}

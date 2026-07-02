import { describe, it, expect } from 'vitest';
import { gradeStroke, starsForMistakes, distToPolyline, polylineLength, type Pt } from './letterTracing';

// 竖线：从 (50,16) 到 (50,80)
const vertical: Pt[] = Array.from({ length: 25 }, (_, i) => ({ x: 50, y: 16 + (64 * i) / 24 }));

describe('letterTracing 判分', () => {
  it('沿着目标线完整描过 → 判对', () => {
    const user: Pt[] = Array.from({ length: 20 }, (_, i) => ({ x: 50 + (Math.random() - 0.5) * 4, y: 16 + (64 * i) / 19 }));
    const res = gradeStroke(user, vertical);
    expect(res.ok).toBe(true);
    expect(res.coveredStart).toBe(true);
    expect(res.coveredEnd).toBe(true);
  });

  it('反方向描（端点顺序相反）仍判对（对低龄宽松）', () => {
    const user: Pt[] = Array.from({ length: 20 }, (_, i) => ({ x: 50, y: 80 - (64 * i) / 19 }));
    expect(gradeStroke(user, vertical).ok).toBe(true);
  });

  it('离目标线太远 → 判错', () => {
    const user: Pt[] = Array.from({ length: 20 }, (_, i) => ({ x: 80, y: 16 + (64 * i) / 19 }));
    expect(gradeStroke(user, vertical).ok).toBe(false);
  });

  it('只点一个点（长度不足）→ 判错', () => {
    expect(gradeStroke([{ x: 50, y: 50 }], vertical).ok).toBe(false);
  });

  it('只描了一半（没到终点）→ 判错', () => {
    const user: Pt[] = Array.from({ length: 10 }, (_, i) => ({ x: 50, y: 16 + (30 * i) / 9 }));
    const res = gradeStroke(user, vertical);
    expect(res.coveredEnd).toBe(false);
    expect(res.ok).toBe(false);
  });

  it('目标笔画点数不足 → 判错', () => {
    expect(gradeStroke([{ x: 0, y: 0 }], [{ x: 0, y: 0 }]).ok).toBe(false);
  });
});

describe('几何辅助', () => {
  it('distToPolyline: 线上点距离≈0', () => {
    expect(distToPolyline({ x: 50, y: 50 }, vertical)).toBeLessThan(1);
  });

  it('polylineLength: 竖线长度≈64', () => {
    expect(polylineLength(vertical)).toBeCloseTo(64, 1);
  });
});

describe('starsForMistakes', () => {
  it('0 错 3 星，1-2 错 2 星，≥3 错 1 星', () => {
    expect(starsForMistakes(0)).toBe(3);
    expect(starsForMistakes(1)).toBe(2);
    expect(starsForMistakes(2)).toBe(2);
    expect(starsForMistakes(3)).toBe(1);
    expect(starsForMistakes(9)).toBe(1);
  });
});

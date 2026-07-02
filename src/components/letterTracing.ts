/** 字母描红闯关的纯几何判分逻辑（无 DOM，便于单测）。
 *  坐标系与字母笔画一致：viewBox 0 0 100 100。 */

export interface Pt {
  x: number;
  y: number;
}

/** 点到线段距离。 */
export function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** 点到折线（目标笔画采样点）的最近距离。 */
export function distToPolyline(p: Pt, poly: Pt[]): number {
  if (poly.length === 0) return Infinity;
  if (poly.length === 1) return Math.hypot(p.x - poly[0].x, p.y - poly[0].y);
  let min = Infinity;
  for (let i = 0; i < poly.length - 1; i++) {
    const d = distToSegment(p, poly[i], poly[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

/** 折线总长度。 */
export function polylineLength(poly: Pt[]): number {
  let len = 0;
  for (let i = 0; i < poly.length - 1; i++) {
    len += Math.hypot(poly[i + 1].x - poly[i].x, poly[i + 1].y - poly[i].y);
  }
  return len;
}

export interface GradeOptions {
  /** 用户轨迹点到目标笔画的平均距离阈值（viewBox 单位）。越大越宽松。 */
  distThreshold?: number;
  /** 端点覆盖容差：用户轨迹需分别靠近目标两端。 */
  endpointTolerance?: number;
  /** 用户轨迹最短长度，避免"点一下"判过。 */
  minUserLength?: number;
}

export interface GradeResult {
  ok: boolean;
  avgDist: number;
  /** 覆盖率：用户轨迹是否触及目标两端。 */
  coveredStart: boolean;
  coveredEnd: boolean;
}

/**
 * 判定一笔是否描对：
 * - 用户轨迹点到目标笔画中心线的平均距离足够小（描在线上）
 * - 用户轨迹触及目标笔画的两个端点附近（描完整条，方向不限）
 * - 用户轨迹本身有足够长度（不是一个点）
 */
export function gradeStroke(user: Pt[], target: Pt[], opts: GradeOptions = {}): GradeResult {
  const distThreshold = opts.distThreshold ?? 14;
  const endpointTolerance = opts.endpointTolerance ?? 22;
  const minUserLength = opts.minUserLength ?? 12;

  if (user.length === 0 || target.length < 2) {
    return { ok: false, avgDist: Infinity, coveredStart: false, coveredEnd: false };
  }

  const avgDist = user.reduce((sum, p) => sum + distToPolyline(p, target), 0) / user.length;

  const start = target[0];
  const end = target[target.length - 1];
  const nearStart = Math.min(...user.map((p) => Math.hypot(p.x - start.x, p.y - start.y)));
  const nearEnd = Math.min(...user.map((p) => Math.hypot(p.x - end.x, p.y - end.y)));
  const coveredStart = nearStart <= endpointTolerance;
  const coveredEnd = nearEnd <= endpointTolerance;

  const userLen = polylineLength(user);

  const ok = avgDist <= distThreshold && coveredStart && coveredEnd && userLen >= minUserLength;
  return { ok, avgDist, coveredStart, coveredEnd };
}

/** 依据总错误次数给星（0 错 3 星，≤2 错 2 星，其余 1 星）。 */
export function starsForMistakes(mistakes: number): 0 | 1 | 2 | 3 {
  if (mistakes === 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}

/** 汉字笔顺数据加载器。
 *  数据由 scripts/gen-strokes.mjs 从 hanzi-writer-data 抽取，打包为 public/hanzi-strokes.json，
 *  首次查看笔顺时一次性加载并缓存（离线可用，无需 CDN）。 */

export interface CharStrokeData {
  strokes: string[];
  medians: number[][][];
}

type StrokeMap = Record<string, CharStrokeData>;

let cache: Promise<StrokeMap> | null = null;

export function loadStrokeData(): Promise<StrokeMap> {
  if (!cache) {
    cache = new Promise<StrokeMap>((resolve, reject) => {
      try {
        if (typeof fetch !== 'function') {
          reject(new Error('fetch unavailable'));
          return;
        }
        fetch('hanzi-strokes.json')
          .then((r) => {
            if (!r.ok) throw new Error(`stroke data ${r.status}`);
            return r.json() as Promise<StrokeMap>;
          })
          .then(resolve)
          .catch(reject);
      } catch (err) {
        reject(err);
      }
    }).catch((err) => {
      cache = null; // 允许下次重试
      throw err;
    });
  }
  return cache;
}

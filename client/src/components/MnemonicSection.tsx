import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { MnemonicAsset, RhymeData } from '../types';
import { ttsUrl } from '../api/tts';
import { pinyinAudioUrl } from '../utils/pinyin';
import { tokenize } from '../utils/tokenize';
import { RhymeKaraoke } from './RhymeKaraoke';

interface Props {
  pinyinId: string;
  mnemonic?: MnemonicAsset;
  rhyme?: RhymeData;
}

const GAP_MS = 120;
const PINYIN_GAP_MS = 30;
const HANZI_RATE = '-35%';
const PINYIN_PLAYBACK_RATE = 1.25;
const FALLBACK_PER_TOKEN_MS = 350;

/** CJK Unified Ideographs，与 tokenize 保持一致。 */
function isHanzi(token: string): boolean {
  if (!token) return false;
  const code = token.codePointAt(0)!;
  return code >= 0x4e00 && code <= 0x9fff;
}

export function MnemonicSection({ pinyinId, mnemonic, rhyme }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playIdRef = useRef(0);

  useEffect(() => {
    setIsPlaying(false);
    setActiveIndex(-1);
    audioRef.current?.pause();
    audioRef.current = null;
    playIdRef.current += 1;
  }, [pinyinId]);

  useEffect(() => () => {
    audioRef.current?.pause();
    audioRef.current = null;
    playIdRef.current += 1;
  }, []);

  if (!mnemonic && !rhyme) return null;

  /** 播放一段音频；duringMs 回调每帧把 elapsed 时长报给调用方用于推进高亮。 */
  const playOnce = (
    url: string,
    onProgress?: (elapsedMs: number, totalMs: number) => void,
    playbackRate?: number,
  ) => new Promise<void>((resolve) => {
    const audio = new Audio(url);
    if (playbackRate && playbackRate > 0) audio.playbackRate = playbackRate;
    audioRef.current = audio;
    let raf = 0;
    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
      audio.onloadedmetadata = null;
      if (raf) cancelAnimationFrame(raf);
    };
    const done = () => { cleanup(); resolve(); };
    audio.onended = done;
    audio.onerror = done;
    if (onProgress) {
      const start = performance.now();
      const tick = () => {
        const elapsed = performance.now() - start;
        const total = isFinite(audio.duration) && audio.duration > 0
          ? audio.duration * 1000
          : 0;
        onProgress(elapsed, total);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    audio.play().catch(done);
  });

  /** 把 token 列表按 hanzi/非 hanzi 分组：连续中文合并成一段。 */
  type Group = { kind: 'hanzi'; text: string; indices: number[] }
              | { kind: 'pinyin'; token: string; index: number };
  const groupTokens = (toks: string[]): Group[] => {
    const groups: Group[] = [];
    let buf: { text: string; indices: number[] } | null = null;
    const flush = () => {
      if (buf) { groups.push({ kind: 'hanzi', text: buf.text, indices: buf.indices }); buf = null; }
    };
    toks.forEach((t, i) => {
      if (isHanzi(t)) {
        if (!buf) buf = { text: '', indices: [] };
        buf.text += t;
        buf.indices.push(i);
      } else {
        flush();
        groups.push({ kind: 'pinyin', token: t, index: i });
      }
    });
    flush();
    return groups;
  };

  const playRhyme = async () => {
    if (!rhyme) return;
    const tokens = tokenize(rhyme.text, rhyme.tokens);
    if (tokens.length === 0) return;

    audioRef.current?.pause();
    const myId = ++playIdRef.current;
    setIsPlaying(true);

    const groups = groupTokens(tokens);

    for (let g = 0; g < groups.length; g++) {
      if (playIdRef.current !== myId) return;
      const group = groups[g];

      if (group.kind === 'pinyin') {
        setActiveIndex(group.index);
        await playOnce(pinyinAudioUrl(group.token), undefined, PINYIN_PLAYBACK_RATE);
      } else {
        // 中文整段连读，按时间窗推进每个字的高亮
        const indices = group.indices;
        const fallbackTotal = FALLBACK_PER_TOKEN_MS * indices.length;
        setActiveIndex(indices[0]);
        await playOnce(
          ttsUrl(group.text, { rate: HANZI_RATE }),
          (elapsed, total) => {
            const totalMs = total > 0 ? total : fallbackTotal;
            const per = totalMs / indices.length;
            const idx = Math.min(indices.length - 1, Math.floor(elapsed / per));
            const target = indices[idx];
            // 直接 set；React 会跳过相同值
            setActiveIndex(target);
          },
        );
      }

      if (playIdRef.current !== myId) return;
      if (g < groups.length - 1) {
        // 相邻拼音字母段之间用更短的间隙，避免 "O ... O ... O" 听感拖沓
        const next = groups[g + 1];
        const gap = group.kind === 'pinyin' && next.kind === 'pinyin'
          ? PINYIN_GAP_MS
          : GAP_MS;
        if (gap > 0) await new Promise<void>((r) => setTimeout(r, gap));
      }
    }
    if (playIdRef.current === myId) {
      setIsPlaying(false);
      setActiveIndex(-1);
    }
  };

  const speakHint = () => {
    if (!mnemonic) return;
    const audio = new Audio(ttsUrl(mnemonic.hint));
    void audio.play().catch(() => {});
  };

  return (
    <section key={pinyinId} style={containerStyle}>
      {mnemonic && (
        <div style={mnemonicBlockStyle}>
          <button
            onClick={speakHint}
            aria-label={`朗读：${mnemonic.hint}`}
            style={emojiButtonStyle}
            className="mnemonic-emoji"
          >
            {mnemonic.emoji}
          </button>
          <div style={hintStyle}>{mnemonic.hint}</div>
        </div>
      )}
      {rhyme && (
        <div style={rhymeBlockStyle}>
          <RhymeKaraoke
            text={rhyme.text}
            tokens={rhyme.tokens}
            isPlaying={isPlaying}
            durationMs={0}
            forcedIndex={activeIndex}
          />
          <button onClick={playRhyme} style={listenButtonStyle}>
            🔊 听口诀
          </button>
        </div>
      )}
    </section>
  );
}

const containerStyle: CSSProperties = {
  marginTop: 24,
  padding: '20px 16px',
  background: '#fffaf0',
  borderRadius: 24,
  border: '2px dashed #ffd166',
  animation: 'mnemonic-enter 240ms cubic-bezier(.34,1.56,.64,1)',
};

const mnemonicBlockStyle: CSSProperties = {
  textAlign: 'center',
  marginBottom: 16,
};

const emojiButtonStyle: CSSProperties = {
  fontSize: 80,
  lineHeight: 1,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: 8,
  transition: 'transform 200ms ease-out',
};

const hintStyle: CSSProperties = {
  fontSize: 18,
  color: '#666',
  marginTop: 4,
};

const rhymeBlockStyle: CSSProperties = {
  textAlign: 'center',
};

const listenButtonStyle: CSSProperties = {
  fontSize: 18,
  padding: '10px 20px',
  borderRadius: 16,
  border: '2px solid #fb8500',
  background: '#fff',
  cursor: 'pointer',
  marginTop: 8,
};

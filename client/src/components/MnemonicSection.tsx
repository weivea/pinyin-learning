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

  const playOnce = (url: string) => new Promise<void>((resolve) => {
    const audio = new Audio(url);
    audioRef.current = audio;
    const done = () => {
      audio.onended = null;
      audio.onerror = null;
      resolve();
    };
    audio.onended = done;
    audio.onerror = done;
    audio.play().catch(done);
  });

  const playRhyme = async () => {
    if (!rhyme) return;
    const tokens = tokenize(rhyme.text, rhyme.tokens);
    if (tokens.length === 0) return;

    audioRef.current?.pause();
    const myId = ++playIdRef.current;
    setIsPlaying(true);

    for (let i = 0; i < tokens.length; i++) {
      if (playIdRef.current !== myId) return;
      const tok = tokens[i];
      setActiveIndex(i);
      const url = isHanzi(tok)
        ? ttsUrl(tok)
        : pinyinAudioUrl(tok);
      await playOnce(url);
      if (playIdRef.current !== myId) return;
      if (i < tokens.length - 1 && GAP_MS > 0) {
        await new Promise<void>((r) => setTimeout(r, GAP_MS));
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

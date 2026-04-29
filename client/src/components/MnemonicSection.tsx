import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { MnemonicAsset, RhymeData } from '../types';
import { ttsUrl } from '../api/tts';
import { tokenize } from '../utils/tokenize';
import { RhymeKaraoke } from './RhymeKaraoke';

interface Props {
  pinyinId: string;
  mnemonic?: MnemonicAsset;
  rhyme?: RhymeData;
}

const FALLBACK_PER_TOKEN_MS = 300;

export function MnemonicSection({ pinyinId, mnemonic, rhyme }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsPlaying(false);
    setDurationMs(0);
    audioRef.current?.pause();
    audioRef.current = null;
  }, [pinyinId]);

  if (!mnemonic && !rhyme) return null;

  const playRhyme = () => {
    if (!rhyme) return;
    const speakText = rhyme.audioText ?? rhyme.text;
    const tokenCount = tokenize(rhyme.text, rhyme.tokens).length;
    const fallback = FALLBACK_PER_TOKEN_MS * Math.max(1, tokenCount);

    audioRef.current?.pause();
    const audio = new Audio(ttsUrl(speakText));
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      const d = isFinite(audio.duration) ? audio.duration * 1000 : fallback;
      setDurationMs(d > 0 ? d : fallback);
    });
    audio.addEventListener('ended', () => setIsPlaying(false));
    audio.addEventListener('error', () => setIsPlaying(false));

    setDurationMs(fallback);
    setIsPlaying(true);
    void audio.play().catch(() => setIsPlaying(false));
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
            durationMs={durationMs}
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

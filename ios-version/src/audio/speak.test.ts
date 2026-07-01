import { describe, it, expect, beforeEach, vi } from 'vitest';

const speakSpy = vi.fn().mockResolvedValue(undefined);
const stopSpy = vi.fn().mockResolvedValue(undefined);
vi.mock('@capacitor-community/text-to-speech', () => ({
  TextToSpeech: {
    speak: (...args: unknown[]) => speakSpy(...args),
    stop: (...args: unknown[]) => stopSpy(...args),
  },
}));

const isAzureConfiguredMock = vi.fn();
const synthesizeToUrlMock = vi.fn();
vi.mock('./azureTts', () => ({
  isAzureConfigured: () => isAzureConfiguredMock(),
  synthesizeToUrl: (...args: unknown[]) => synthesizeToUrlMock(...args),
}));

class MockAudio {
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public src: string) {}
  play() { queueMicrotask(() => this.onended?.()); return Promise.resolve(); }
  pause() {}
}
(globalThis as unknown as { Audio: unknown }).Audio = MockAudio;

import { speak, stopSpeaking } from './speak';

describe('speak (native fallback when Azure not configured)', () => {
  beforeEach(() => {
    speakSpy.mockClear();
    stopSpy.mockClear();
    isAzureConfiguredMock.mockReturnValue(false);
    synthesizeToUrlMock.mockReset();
  });

  it('speaks zh-CN with default rate via native TTS', async () => {
    await speak('妈');
    expect(stopSpy).toHaveBeenCalled();
    expect(speakSpy).toHaveBeenCalledWith(
      expect.objectContaining({ text: '妈', lang: 'zh-CN', rate: 1 }),
    );
  });

  it('passes a slow rate to native TTS', async () => {
    await speak('听广播', { rate: 0.7 });
    expect(speakSpy).toHaveBeenCalledWith(expect.objectContaining({ rate: 0.7 }));
  });

  it('does not throw when native plugin rejects', async () => {
    speakSpy.mockRejectedValueOnce(new Error('boom'));
    await expect(speak('x')).resolves.toBeUndefined();
  });

  it('stopSpeaking calls native stop', async () => {
    await stopSpeaking();
    expect(stopSpy).toHaveBeenCalled();
  });
});

describe('speak (Azure preferred when configured)', () => {
  beforeEach(() => {
    speakSpy.mockClear();
    stopSpy.mockClear();
    isAzureConfiguredMock.mockReturnValue(true);
    synthesizeToUrlMock.mockReset();
    synthesizeToUrlMock.mockResolvedValue('blob:mock');
  });

  it('uses Azure with phoneme params and maps numeric rate to percent', async () => {
    await speak('字', { rate: 0.65, pinyin: 'zi', tone: 4 });
    expect(synthesizeToUrlMock).toHaveBeenCalledWith(
      expect.objectContaining({ text: '字', pinyin: 'zi', tone: 4, rate: '-35%' }),
    );
    expect(speakSpy).not.toHaveBeenCalled();
  });

  it('falls back to native TTS when Azure synthesis fails', async () => {
    synthesizeToUrlMock.mockRejectedValueOnce(new Error('net down'));
    await speak('妈');
    expect(speakSpy).toHaveBeenCalledWith(
      expect.objectContaining({ text: '妈', lang: 'zh-CN' }),
    );
  });
});


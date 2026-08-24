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
  static autoEnd = true;
  static instances: MockAudio[] = [];
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  pause = vi.fn();
  constructor(public src: string) { MockAudio.instances.push(this); }
  play() {
    if (MockAudio.autoEnd) queueMicrotask(() => this.onended?.());
    return Promise.resolve();
  }
}
(globalThis as unknown as { Audio: unknown }).Audio = MockAudio;

import { speak, stopSpeaking, speakEnglish } from './speak';

describe('speak (native fallback when Azure not configured)', () => {
  beforeEach(() => {
    speakSpy.mockClear();
    stopSpy.mockClear();
    isAzureConfiguredMock.mockReturnValue(false);
    synthesizeToUrlMock.mockReset();
    MockAudio.autoEnd = true;
    MockAudio.instances = [];
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
    MockAudio.autoEnd = true;
    MockAudio.instances = [];
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

  it('stops an active Azure audio element and resolves its playback promise', async () => {
    MockAudio.autoEnd = false;
    const playback = speak('一篇短文');
    await vi.waitFor(() => expect(MockAudio.instances).toHaveLength(1));

    await stopSpeaking();

    await expect(playback).resolves.toBeUndefined();
    expect(MockAudio.instances[0].pause).toHaveBeenCalled();
  });
});

describe('speakEnglish (native en-US)', () => {
  beforeEach(() => {
    speakSpy.mockClear();
    stopSpy.mockClear();
    synthesizeToUrlMock.mockClear();
    isAzureConfiguredMock.mockReturnValue(true); // 即便配了 Azure，英文也走原生
  });

  it('speaks en-US via native TTS and never touches Azure', async () => {
    await speakEnglish('bee');
    expect(stopSpy).toHaveBeenCalled();
    expect(speakSpy).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'bee', lang: 'en-US' }),
    );
    expect(synthesizeToUrlMock).not.toHaveBeenCalled();
  });

  it('ignores empty text', async () => {
    await speakEnglish('   ');
    expect(speakSpy).not.toHaveBeenCalled();
  });

  it('does not throw when native plugin rejects', async () => {
    speakSpy.mockRejectedValueOnce(new Error('boom'));
    await expect(speakEnglish('ay')).resolves.toBeUndefined();
  });
});

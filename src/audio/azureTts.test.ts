import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const synthSpy = vi.fn();
let lastSsml = '';

vi.mock('microsoft-cognitiveservices-speech-sdk', () => {
  class SpeechConfig {
    speechSynthesisVoiceName = '';
    speechSynthesisOutputFormat = 0;
    static fromEndpoint() { return new SpeechConfig(); }
  }
  class SpeechSynthesizer {
    config: { speechSynthesisVoiceName: string };
    constructor(config: { speechSynthesisVoiceName: string }, _audio: unknown) {
      this.config = config;
      synthSpy(config.speechSynthesisVoiceName);
    }
    speakSsmlAsync(ssml: string, onResult: (r: unknown) => void) {
      lastSsml = ssml;
      onResult({ reason: 1, audioData: new Uint8Array([1, 2, 3]).buffer });
    }
    close() { /* noop */ }
  }
  return {
    SpeechConfig,
    SpeechSynthesizer,
    SpeechSynthesisOutputFormat: { Audio24Khz48KBitRateMonoMp3: 1 },
    ResultReason: { SynthesizingAudioCompleted: 1, Canceled: 2 },
    CancellationDetails: { fromResult: () => ({ reason: 0, errorDetails: '' }) },
  };
});

import { isAzureConfigured, synthesizeToUrl } from './azureTts';

describe('azureTts', () => {
  beforeEach(() => {
    synthSpy.mockClear();
    lastSsml = '';
    (globalThis.URL as unknown as { createObjectURL: () => string }).createObjectURL =
      vi.fn(() => 'blob:mock');
    vi.stubEnv('VITE_AZURE_SPEECH_KEY', 'k');
    vi.stubEnv('VITE_AZURE_SPEECH_ENDPOINT', 'https://r.cognitiveservices.azure.com/');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('isAzureConfigured is true when key+endpoint set', () => {
    expect(isAzureConfigured()).toBe(true);
  });

  it('isAzureConfigured is false when env missing', () => {
    vi.stubEnv('VITE_AZURE_SPEECH_KEY', '');
    vi.stubEnv('VITE_AZURE_SPEECH_ENDPOINT', '');
    expect(isAzureConfigured()).toBe(false);
  });

  it('throws AZURE_NOT_CONFIGURED when not configured', async () => {
    vi.stubEnv('VITE_AZURE_SPEECH_KEY', '');
    vi.stubEnv('VITE_AZURE_SPEECH_ENDPOINT', '');
    await expect(synthesizeToUrl({ text: '妈' })).rejects.toThrow('AZURE_NOT_CONFIGURED');
  });

  it('builds phoneme SSML and returns an object URL', async () => {
    const url = await synthesizeToUrl({ text: '妈', pinyin: 'ma', tone: 1 });
    expect(url).toBe('blob:mock');
    expect(lastSsml).toContain('<phoneme alphabet="sapi" ph="ma 1">妈</phoneme>');
    expect(synthSpy).toHaveBeenCalledTimes(1);
  });

  it('uses the default voice zh-CN-XiaoxiaoNeural', async () => {
    await synthesizeToUrl({ text: '你好' });
    expect(synthSpy).toHaveBeenCalledWith('zh-CN-XiaoxiaoNeural');
  });

  it('caches by params so the second identical call does not hit the SDK', async () => {
    await synthesizeToUrl({ text: '缓存', pinyin: 'huan', tone: 2 });
    synthSpy.mockClear();
    await synthesizeToUrl({ text: '缓存', pinyin: 'huan', tone: 2 });
    expect(synthSpy).not.toHaveBeenCalled();
  });
});

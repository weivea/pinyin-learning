import { describe, it, expect, afterEach, vi } from 'vitest';
import { speakEnglish, canSpeakEnglish } from './speech';

describe('speakEnglish', () => {
  afterEach(() => {
    // 清理可能注入的 stub
    delete (window as unknown as Record<string, unknown>).speechSynthesis;
    // @ts-expect-error 测试清理
    delete globalThis.SpeechSynthesisUtterance;
    vi.restoreAllMocks();
  });

  it('环境不支持时静默返回（jsdom 无 speechSynthesis）', () => {
    expect(canSpeakEnglish()).toBe(false);
    expect(() => speakEnglish('A')).not.toThrow();
  });

  it('空字符串不朗读', () => {
    const speak = vi.fn();
    stubSpeech(speak);
    speakEnglish('   ');
    expect(speak).not.toHaveBeenCalled();
  });

  it('支持时用 en-US 朗读字母', () => {
    const speak = vi.fn();
    stubSpeech(speak);
    speakEnglish('A');
    expect(canSpeakEnglish()).toBe(true);
    expect(speak).toHaveBeenCalledTimes(1);
    const utter = speak.mock.calls[0][0] as { lang: string; text: string };
    expect(utter.lang).toBe('en-US');
    expect(utter.text).toBe('A');
  });
});

function stubSpeech(speak: (u: unknown) => void) {
  class FakeUtterance {
    text: string;
    lang = '';
    rate = 1;
    pitch = 1;
    voice: unknown = null;
    constructor(text: string) { this.text = text; }
  }
  (globalThis as unknown as Record<string, unknown>).SpeechSynthesisUtterance = FakeUtterance;
  (window as unknown as Record<string, unknown>).speechSynthesis = {
    speak,
    cancel: () => {},
    getVoices: () => [],
  };
}

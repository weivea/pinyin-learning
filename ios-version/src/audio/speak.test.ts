import { describe, it, expect, beforeEach, vi } from 'vitest';

const speakSpy = vi.fn().mockResolvedValue(undefined);
const stopSpy = vi.fn().mockResolvedValue(undefined);
vi.mock('@capacitor-community/text-to-speech', () => ({
  TextToSpeech: {
    speak: (...args: unknown[]) => speakSpy(...args),
    stop: (...args: unknown[]) => stopSpy(...args),
  },
}));

import { speak, stopSpeaking } from './speak';

describe('speak', () => {
  beforeEach(() => { speakSpy.mockClear(); stopSpy.mockClear(); });

  it('speaks zh-CN with default rate', async () => {
    await speak('妈');
    expect(stopSpy).toHaveBeenCalled();
    expect(speakSpy).toHaveBeenCalledWith(
      expect.objectContaining({ text: '妈', lang: 'zh-CN', rate: 1 }),
    );
  });

  it('maps a slow rate', async () => {
    await speak('听广播', { rate: 0.7 });
    expect(speakSpy).toHaveBeenCalledWith(expect.objectContaining({ rate: 0.7 }));
  });

  it('does not throw when plugin rejects', async () => {
    speakSpy.mockRejectedValueOnce(new Error('boom'));
    await expect(speak('x')).resolves.toBeUndefined();
  });

  it('stopSpeaking calls plugin stop', async () => {
    await stopSpeaking();
    expect(stopSpy).toHaveBeenCalled();
  });
});

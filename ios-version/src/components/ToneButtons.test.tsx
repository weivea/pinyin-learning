import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToneButtons } from './ToneButtons';
import type { ToneVariant } from '../types';

const tones: ToneVariant[] = [
  { tone: 1, text: 'ā', audioText: '啊' },
  { tone: 2, text: 'á', audioText: '啊' },
  { tone: 3, text: 'ǎ', audioText: '啊' },
  { tone: 4, text: 'à', audioText: '啊' },
];

describe('ToneButtons', () => {
  it('renders 4 tone buttons', () => {
    render(<ToneButtons tones={tones} />);
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('invokes onPlay callback with the clicked tone', () => {
    const onPlay = vi.fn();
    render(<ToneButtons tones={tones} onPlay={onPlay} />);
    fireEvent.click(screen.getByLabelText('播放 ǎ'));
    expect(onPlay).toHaveBeenCalledWith(expect.objectContaining({ tone: 3, text: 'ǎ' }));
  });
});

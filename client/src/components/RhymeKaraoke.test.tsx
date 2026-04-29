import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RhymeKaraoke } from './RhymeKaraoke';

describe('RhymeKaraoke', () => {
  it('未播放时所有 token 为 future（无 active class）', () => {
    render(<RhymeKaraoke text="听广播 b b b" isPlaying={false} durationMs={0} />);
    const tokens = screen.getAllByTestId('rhyme-token');
    expect(tokens).toHaveLength(6);
    tokens.forEach(t => {
      expect(t.getAttribute('data-state')).toBe('future');
    });
  });

  it('提供 override tokens 时使用 override', () => {
    render(
      <RhymeKaraoke
        text="听广播 b b b"
        tokens={['听', '广播', 'b', 'b', 'b']}
        isPlaying={false}
        durationMs={0}
      />
    );
    expect(screen.getAllByTestId('rhyme-token')).toHaveLength(5);
    expect(screen.getByText('广播')).toBeInTheDocument();
  });

  it('空文本不渲染任何 token', () => {
    render(<RhymeKaraoke text="" isPlaying={false} durationMs={0} />);
    expect(screen.queryAllByTestId('rhyme-token')).toHaveLength(0);
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MnemonicSection } from './MnemonicSection';

describe('MnemonicSection', () => {
  it('mnemonic 与 rhyme 均缺失时不渲染', () => {
    const { container } = render(<MnemonicSection pinyinId="b" />);
    expect(container.firstChild).toBeNull();
  });

  it('仅 mnemonic 时渲染 emoji 与 hint，无口诀按钮', () => {
    render(
      <MnemonicSection
        pinyinId="b"
        mnemonic={{ emoji: '📻', hint: '像小喇叭' }}
      />
    );
    expect(screen.getByText('📻')).toBeInTheDocument();
    expect(screen.getByText('像小喇叭')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /听口诀/ })).toBeNull();
  });

  it('仅 rhyme 时渲染口诀区与按钮，无 emoji 块', () => {
    render(
      <MnemonicSection
        pinyinId="b"
        rhyme={{ text: '听广播 b b b' }}
      />
    );
    expect(screen.queryByText('📻')).toBeNull();
    expect(screen.getAllByTestId('rhyme-token').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /听口诀/ })).toBeInTheDocument();
  });

  it('mnemonic 与 rhyme 都提供时全部渲染', () => {
    render(
      <MnemonicSection
        pinyinId="b"
        mnemonic={{ emoji: '📻', hint: '像小喇叭' }}
        rhyme={{ text: '听广播 b b b' }}
      />
    );
    expect(screen.getByText('📻')).toBeInTheDocument();
    expect(screen.getByText('像小喇叭')).toBeInTheDocument();
    expect(screen.getAllByTestId('rhyme-token')).toHaveLength(6);
    expect(screen.getByRole('button', { name: /听口诀/ })).toBeInTheDocument();
  });
});

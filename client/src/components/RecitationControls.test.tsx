import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecitationControls } from './RecitationControls';

const baseProps = {
  scope: 'all' as const,
  onScopeChange: vi.fn(),
  onStart: vi.fn(),
  onPause: vi.fn(),
  onResume: vi.fn(),
  onReset: vi.fn(),
};

describe('RecitationControls', () => {
  it('renders [开始] when status is idle', () => {
    render(<RecitationControls {...baseProps} status="idle" />);
    expect(screen.getByRole('button', { name: '开始跟读' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '暂停' })).toBeNull();
  });

  it('renders [开始] when status is finished', () => {
    render(<RecitationControls {...baseProps} status="finished" />);
    expect(screen.getByRole('button', { name: '开始跟读' })).toBeInTheDocument();
  });

  it('renders [暂停][重置] when playing', () => {
    render(<RecitationControls {...baseProps} status="playing" />);
    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重置' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '开始跟读' })).toBeNull();
  });

  it('renders [继续][重置] when paused', () => {
    render(<RecitationControls {...baseProps} status="paused" />);
    expect(screen.getByRole('button', { name: '继续' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重置' })).toBeInTheDocument();
  });

  it('clicking 开始 calls onStart', () => {
    const onStart = vi.fn();
    render(<RecitationControls {...baseProps} status="idle" onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: '开始跟读' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('changing scope calls onScopeChange', () => {
    const onScopeChange = vi.fn();
    render(<RecitationControls {...baseProps} status="idle" onScopeChange={onScopeChange} />);
    fireEvent.click(screen.getByLabelText('声母'));
    expect(onScopeChange).toHaveBeenCalledWith('initial');
  });
});

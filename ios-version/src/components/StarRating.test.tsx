import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StarRating } from './StarRating';

describe('StarRating', () => {
  it('renders 2 filled and 1 empty', () => {
    render(<StarRating stars={2} />);
    const el = screen.getByLabelText('2 颗星');
    expect(el.textContent).toBe('⭐⭐☆');
  });

  it('renders 0 stars', () => {
    render(<StarRating stars={0} />);
    expect(screen.getByLabelText('0 颗星').textContent).toBe('☆☆☆');
  });
});

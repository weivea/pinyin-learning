interface Props {
  stars: 0 | 1 | 2 | 3;
  size?: number;
}

export function StarRating({ stars, size = 32 }: Props) {
  return (
    <span aria-label={`${stars} 颗星`} style={{ fontSize: size }}>
      {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
    </span>
  );
}

interface Props {
  emoji: string;
  size?: number;
}

export function EmojiTile({ emoji, size = 64 }: Props) {
  return (
    <span style={{ fontSize: size, lineHeight: 1 }} role="img" aria-label="emoji">
      {emoji}
    </span>
  );
}

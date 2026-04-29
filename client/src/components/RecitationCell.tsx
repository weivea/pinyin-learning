import { memo } from 'react';
import type { PinyinItem } from '../types';

interface Props {
  item: PinyinItem;
  isHighlight: boolean;
  onClick: () => void;
}

function RecitationCellInner({ item, isHighlight, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={`播放 ${item.display}`}
      aria-current={isHighlight ? 'true' : undefined}
      data-testid={`cell-${item.id}`}
      data-highlight={isHighlight ? 'true' : 'false'}
      style={{
        minWidth: 64, minHeight: 64,
        padding: '12px 16px',
        fontSize: 32, fontWeight: 'bold',
        borderRadius: 12,
        border: isHighlight ? '4px solid #fb8500' : '2px solid #ccc',
        background: isHighlight ? '#fff8e7' : '#fff',
        cursor: 'pointer',
      }}
    >
      {item.display}
    </button>
  );
}

export const RecitationCell = memo(RecitationCellInner);

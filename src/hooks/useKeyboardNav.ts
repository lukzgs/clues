import { type KeyboardEvent, useCallback, useState } from 'react';

interface UseKeyboardNavOptions {
  itemCount: number;
  columns?: number;
  onSelect?: (index: number) => void;
  onEscape?: () => void;
  loop?: boolean;
}

export function useKeyboardNav({
  itemCount,
  columns = 1,
  onSelect,
  onEscape,
  loop = true,
}: UseKeyboardNavOptions) {
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (itemCount <= 0) return;

      switch (event.key) {
        case 'ArrowRight': {
          event.preventDefault();
          setFocusedIndex((prev) => {
            if (prev + 1 >= itemCount) {
              return loop ? 0 : prev;
            }
            return prev + 1;
          });
          break;
        }

        case 'ArrowLeft': {
          event.preventDefault();
          setFocusedIndex((prev) => {
            if (prev - 1 < 0) {
              return loop ? itemCount - 1 : prev;
            }
            return prev - 1;
          });
          break;
        }

        case 'ArrowDown': {
          event.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev + columns;
            if (next >= itemCount) {
              return loop ? prev % columns : prev;
            }
            return next;
          });
          break;
        }

        case 'ArrowUp': {
          event.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev - columns;
            if (next < 0) {
              if (!loop) return prev;
              const lastRowStart =
                Math.floor((itemCount - 1) / columns) * columns;
              const target = lastRowStart + (prev % columns);
              return target < itemCount ? target : target - columns;
            }
            return next;
          });
          break;
        }

        case 'Home': {
          event.preventDefault();
          setFocusedIndex(0);
          break;
        }

        case 'End': {
          event.preventDefault();
          setFocusedIndex(itemCount - 1);
          break;
        }

        case 'Enter':
        case ' ': {
          if (onSelect) {
            event.preventDefault();
            onSelect(focusedIndex);
          }
          break;
        }

        case 'Escape': {
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        }
      }
    },
    [itemCount, columns, onSelect, onEscape, loop, focusedIndex],
  );

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
  };
}

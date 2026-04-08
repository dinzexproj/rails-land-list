import { useEffect, useRef } from 'react';

/**
 * Calls onLoadMore when the sentinel element intersects the viewport.
 * Pass watchKey (e.g. items.length) so the effect re-runs after the sentinel is in the DOM.
 */
export function useInfiniteScrollSentinel(sentinelRef, onLoadMore, { enabled, rootMargin = '240px', watchKey = 0 } = {}) {
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    if (!enabled) return undefined;
    const el = sentinelRef.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) onLoadMoreRef.current();
      },
      { root: null, rootMargin, threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ref object from parent is stable; watchKey re-runs when list mounts
  }, [enabled, rootMargin, watchKey]);
}

import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Returns the r3f `frameloop` value for a canvas wrapper: 'always' while the
 * tab is visible AND the wrapper intersects the viewport (with margin),
 * 'never' otherwise — so particle canvases stop burning GPU/CPU when the
 * tab is backgrounded or the canvas is scrolled far out of view.
 */
export function useCanvasActive(ref: RefObject<HTMLElement>): 'always' | 'never' {
  const [tabVisible, setTabVisible] = useState(() => !document.hidden);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // NOTE: no dependency array — deliberately re-attaches after every commit.
  // Suspense reveal/hide (lazy canvases) can swap or display:none the node
  // after a once-only effect ran, leaving the observer bound to a stale
  // element that reports non-intersecting forever (frozen canvas).
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '200px',
    });
    io.observe(el);
    return () => io.disconnect();
  });

  return tabVisible && inView ? 'always' : 'never';
}

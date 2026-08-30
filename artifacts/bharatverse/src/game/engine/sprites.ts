import { useEffect, useState } from 'react';

/**
 * Image loading for canvas scenes (Minigames Phase Task 0). Images are cached
 * module-wide; a scene only starts once everything it draws is ready, so
 * there is never a flash of missing sprites.
 */
const cache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  let p = cache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Image failed to load: ${src}`));
      img.src = src;
    });
    cache.set(src, p);
  }
  return p;
}

/**
 * Resolves to a name->image map, or null while (re)loading. Reacts to source
 * changes: swapping the src set resets to null and loads the new images, so a
 * caller can never render with a previous set's map. Load failures throw to
 * the error boundary.
 */
export function useLoadedImages(
  srcs: Record<string, string>
): Record<string, HTMLImageElement> | null {
  const [images, setImages] = useState<Record<string, HTMLImageElement> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  if (error) throw error;

  // Value signature, not object identity — callers may pass fresh literals.
  const signature = JSON.stringify(srcs);

  useEffect(() => {
    let alive = true;
    setImages(null);
    const entries = Object.entries(JSON.parse(signature) as Record<string, string>);
    Promise.all(entries.map(([, src]) => loadImage(src)))
      .then(loaded => {
        if (!alive) return;
        const map: Record<string, HTMLImageElement> = {};
        entries.forEach(([name], i) => {
          map[name] = loaded[i];
        });
        setImages(map);
      })
      .catch(e => {
        if (alive) setError(e instanceof Error ? e : new Error(String(e)));
      });
    return () => {
      alive = false;
    };
  }, [signature]);

  return images;
}

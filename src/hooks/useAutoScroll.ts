import { useEffect, useRef, useCallback } from 'react';

export function useAutoScroll<T>(dependencies: T[], enabled: boolean = true) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!scrollRef.current || !enabled) return;

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior,
    });
  }, [enabled]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

      isUserScrollingRef.current = !isAtBottom;

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 1000);
    };

    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isUserScrollingRef.current) {
      setTimeout(() => scrollToBottom('smooth'), 100);
    }
  }, dependencies);

  return {
    scrollRef,
    scrollToBottom,
  };
}

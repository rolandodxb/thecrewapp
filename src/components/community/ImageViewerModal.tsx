import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X, ZoomIn, Heart, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageViewerModalProps {
  imageUrl?: string;
  imageUrls?: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onDoubleClick?: () => void;
}

interface HeartAnimation {
  id: number;
  x: number;
  y: number;
}

export default function ImageViewerModal({
  imageUrl,
  imageUrls,
  initialIndex = 0,
  isOpen,
  onClose,
  onDoubleClick
}: ImageViewerModalProps) {
  const images = imageUrls && imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [hearts, setHearts] = useState<HeartAnimation[]>([]);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const lastTapRef = useRef<number>(0);
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tapCountRef = useRef<number>(0);
  const heartIdRef = useRef<number>(0);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; dist: number } | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      x.set(0);
      y.set(0);
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'auto';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'auto';
    };
  }, [isOpen, initialIndex, x, y]);

  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches: React.TouchList): { x: number; y: number } => {
    if (touches.length === 1) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    const x = (touches[0].clientX + touches[1].clientX) / 2;
    const y = (touches[0].clientY + touches[1].clientY) / 2;
    return { x, y };
  };

  const triggerHeartAnimation = useCallback((clientX?: number, clientY?: number) => {
    const container = imageContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = clientX !== undefined ? clientX - rect.left : rect.width / 2;
    const y = clientY !== undefined ? clientY - rect.top : rect.height / 2;

    const newHeart: HeartAnimation = {
      id: heartIdRef.current++,
      x,
      y
    };

    setHearts(prev => [...prev, newHeart]);

    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 1500);

    onDoubleClick?.();
  }, [onDoubleClick]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      touchStartRef.current = { x: center.x, y: center.y, dist };
      e.preventDefault();
    } else if (e.touches.length === 1) {
      longPressTimerRef.current = setTimeout(() => {
        if (scale === 1) {
          setScale(2);
        }
      }, 600);

      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        dist: 0
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartRef.current) {
      e.preventDefault();
      const currentDist = getTouchDistance(e.touches);
      const scaleDelta = currentDist / touchStartRef.current.dist;
      const newScale = Math.min(Math.max(scale * scaleDelta, 1), 4);
      setScale(newScale);
      touchStartRef.current.dist = currentDist;
    } else if (e.touches.length === 1 && scale > 1 && touchStartRef.current) {
      const deltaX = e.touches[0].clientX - touchStartRef.current.x;
      const deltaY = e.touches[0].clientY - touchStartRef.current.y;

      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));

      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        dist: 0
      };
    }

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (e.touches.length === 0) {
      touchStartRef.current = null;
    }

    if (scale < 1.1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleImageTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    let clientX: number, clientY: number;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    if (timeSinceLastTap < 400 && timeSinceLastTap > 0) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }

      triggerHeartAnimation(clientX, clientY);
      tapCountRef.current = 0;
    } else {
      tapCountRef.current = 1;

      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
      }

      singleTapTimerRef.current = setTimeout(() => {
        if (tapCountRef.current === 1) {
        }
        tapCountRef.current = 0;
      }, 400);
    }

    lastTapRef.current = now;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scale * delta, 1), 4);
    setScale(newScale);

    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  if (!isOpen || images.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
          style={{ touchAction: 'none' }}
        >
          <motion.button
            onClick={handleClose}
            className="fixed top-4 right-4 md:top-6 md:right-6 z-[10001] w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 flex items-center justify-center transition backdrop-blur-md border-2 border-white/30"
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <X className="w-7 h-7 text-white drop-shadow-lg" />
          </motion.button>

          {scale > 1.2 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-4 md:top-6 md:left-6 z-[10001] px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-bold flex items-center gap-2 border border-white/30"
            >
              <ZoomIn className="w-4 h-4" />
              {Math.round(scale * 100)}%
            </motion.div>
          )}

          {images.length > 1 && (
            <>
              <motion.button
                onClick={goToPrevious}
                className="fixed left-2 md:left-6 top-1/2 -translate-y-1/2 z-[10000] w-12 h-12 md:w-16 md:h-16 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white rounded-full flex items-center justify-center transition backdrop-blur-md border-2 border-white/20"
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
              </motion.button>

              <motion.button
                onClick={goToNext}
                className="fixed right-2 md:right-6 top-1/2 -translate-y-1/2 z-[10000] w-12 h-12 md:w-16 md:h-16 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white rounded-full flex items-center justify-center transition backdrop-blur-md border-2 border-white/20"
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
              </motion.button>

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-[10001] px-5 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-base font-bold border border-white/30"
              >
                {currentIndex + 1} / {images.length}
              </motion.div>
            </>
          )}

          <div
            ref={imageContainerRef}
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheel}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative w-full h-full flex items-center justify-center"
                style={{
                  transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                  transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                  cursor: scale > 1 ? 'grab' : 'pointer'
                }}
              >
                <img
                  src={images[currentIndex]}
                  alt={`Image ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain select-none"
                  draggable={false}
                  onClick={handleImageTap}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {hearts.map((heart) => (
                <motion.div
                  key={heart.id}
                  initial={{ scale: 0, opacity: 0, y: 0 }}
                  animate={{
                    scale: [0, 1.2, 1],
                    opacity: [0, 1, 1, 0],
                    y: [0, -50]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1.5,
                    ease: 'easeOut',
                    times: [0, 0.2, 0.4, 1]
                  }}
                  className="absolute pointer-events-none z-[10000]"
                  style={{
                    left: heart.x,
                    top: heart.y,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="relative">
                    <Heart
                      className="w-24 h-24 md:w-32 md:h-32 text-red-500 fill-red-500"
                      style={{
                        filter: 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.8)) drop-shadow(0 0 40px rgba(239, 68, 68, 0.6))',
                        strokeWidth: 1.5
                      }}
                    />
                    <motion.div
                      className="absolute inset-0"
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1 }}
                    >
                      <Heart
                        className="w-24 h-24 md:w-32 md:h-32 text-red-400"
                        style={{
                          filter: 'blur(8px)'
                        }}
                      />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-[10001] px-6 py-3 bg-black/60 backdrop-blur-md rounded-full text-white text-xs md:text-sm text-center max-w-xl border border-white/20"
          >
            <p className="font-medium">
              Double tap to like • Pinch to zoom • {images.length > 1 ? 'Swipe to navigate' : 'Drag to move'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { SPINE_HEALTH_TIPS } from '@/content/tips';
import { cn } from '@/lib/utils';

const TIP_ROTATION_INTERVAL = 5000;
const TIP_FADE_DURATION_MS = 300;

export function RotatingTips() {
  const homeTips = useMemo(
    () =>
      SPINE_HEALTH_TIPS.filter((tip) =>
        ['tip-2', 'tip-5', 'tip-3', 'tip-6', 'tip-8'].includes(tip.id)
      ),
    []
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const fadeTimeoutRef = useRef<number | null>(null);

  const currentTip = homeTips[currentIndex];

  useEffect(() => {
    const clearFadeTimeout = () => {
      if (fadeTimeoutRef.current) {
        window.clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
    };

    const interval = window.setInterval(() => {
      setIsVisible(false);
      clearFadeTimeout();
      fadeTimeoutRef.current = window.setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % homeTips.length);
        setIsVisible(true);
        fadeTimeoutRef.current = null;
      }, TIP_FADE_DURATION_MS);
    }, TIP_ROTATION_INTERVAL);

    return () => {
      window.clearInterval(interval);
      clearFadeTimeout();
    };
  }, [homeTips.length]);

  return (
    <div className="relative overflow-hidden">
      <div
        className={cn(
          'rounded-[16px] border border-[#dcf5f7] bg-[#f2fbfc] px-4 py-[13px]',
          'transition-all duration-300 ease-in-out',
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        )}
      >
        <p className="text-[13px] leading-[19px] text-[#005b65]">
          <strong>{currentTip.title}.</strong> {currentTip.text}
        </p>
      </div>

      <div className="mt-2 flex gap-[5px]">
        {homeTips.map((tip, index) => (
          <button
            key={tip.id}
            type="button"
            onClick={() => {
              if (fadeTimeoutRef.current) {
                window.clearTimeout(fadeTimeoutRef.current);
                fadeTimeoutRef.current = null;
              }
              setCurrentIndex(index);
              setIsVisible(true);
            }}
            className={cn(
              'rounded-full transition-all duration-200',
              index === currentIndex
                ? 'h-[5px] w-[14px] bg-[#008391]'
                : 'h-[5px] w-[5px] bg-[#b7ebf0] hover:bg-[#8fdde5]'
            )}
            aria-label={`Go to tip ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

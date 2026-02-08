'use client';

import { useEffect, useState } from 'react';
import { SPINE_HEALTH_TIPS } from '@/content/tips';
import { cn } from '@/lib/utils';

const TIP_ROTATION_INTERVAL = 5000; // 5 seconds

export function RotatingTips() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setIsVisible(false);

      // After fade out, change tip and fade in
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % SPINE_HEALTH_TIPS.length);
        setIsVisible(true);
      }, 300); // Match the CSS transition duration
    }, TIP_ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const currentTip = SPINE_HEALTH_TIPS[currentIndex];

  return (
    <div className="relative overflow-hidden">
      {/* Tip Card */}
      <div
        className={cn(
          'bg-card/50 border border-border/50 rounded-lg p-5',
          'transition-all duration-300 ease-in-out',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        )}
      >
        <div className="flex items-start gap-4">
          <span className="text-2xl flex-shrink-0" role="img" aria-hidden>
            {currentTip.icon}
          </span>
          <div className="space-y-1 min-w-0">
            <h3 className="text-sm font-medium text-foreground">
              {currentTip.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentTip.text}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {SPINE_HEALTH_TIPS.map((tip, index) => (
          <button
            key={tip.id}
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => {
                setCurrentIndex(index);
                setIsVisible(true);
              }, 300);
            }}
            className={cn(
              'w-1.5 h-1.5 rounded-full transition-all duration-200',
              index === currentIndex
                ? 'bg-foreground w-4'
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            )}
            aria-label={`Go to tip ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

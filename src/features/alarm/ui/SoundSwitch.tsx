'use client';

import React, { useRef } from 'react';
import { Music } from 'lucide-react';
import { getSoundOptionsCount } from '../model/ringSession';
import { AlarmSettings } from '../model/alarmTypes';

interface SoundSwitchProps {
  currentIndex: number;
  settings: AlarmSettings;
  onSwitch: () => void;
  onOpenSettings?: () => void;
}

export const SoundSwitch: React.FC<SoundSwitchProps> = ({
  currentIndex,
  settings,
  onSwitch,
  onOpenSettings,
}) => {
  const totalCount = getSoundOptionsCount(settings);
  const normalizedIndex = ((currentIndex % totalCount) + totalCount) % totalCount;
  const longPressTimerRef = useRef<any>(null);
  const isLongPressRef = useRef<boolean>(false);

  const handlePointerDown = () => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (onOpenSettings) onOpenSettings();
    }, 600);
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    onSwitch();
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-label="Đổi nhạc chuông"
        title="Bấm để đổi âm thanh, bấm giữ để chọn file nhạc riêng"
        className="w-10 h-10 rounded-full bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700/80 flex items-center justify-center text-amber-400 hover:text-amber-300 transition-all shadow-md active:scale-95"
      >
        <Music className="w-5 h-5" />
      </button>

      {/* Indicator dots */}
      <div className="flex items-center gap-1 px-1">
        {Array.from({ length: totalCount }).map((_, idx) => (
          <span
            key={idx}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              idx === normalizedIndex
                ? 'bg-amber-400 scale-125'
                : 'bg-zinc-600/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

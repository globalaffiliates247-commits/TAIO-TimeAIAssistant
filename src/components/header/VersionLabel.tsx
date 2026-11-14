'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { VERSION_LABEL } from '@/core/buildInfo';

export const VersionLabel: React.FC<{ placement?: 'fixed_mac' | 'inline' }> = ({ placement = 'fixed_mac' }) => {
  const { isNativePlatform, deviceLook } = useApp();
  const isPhone = isNativePlatform || deviceLook === 'phone';

  if (placement === 'fixed_mac') {
    if (isPhone) return null;
    return (
      <div 
        className="fixed bottom-2 left-3 z-30 pointer-events-none select-none text-[10px] text-slate-400 font-mono tracking-tight"
        title={`Phiên bản ứng dụng: ${VERSION_LABEL}`}
      >
        {VERSION_LABEL}
      </div>
    );
  }

  return (
    <div 
      className="text-center py-2 text-[10px] text-slate-400 font-mono select-none tracking-tight"
      title={`Phiên bản ứng dụng: ${VERSION_LABEL}`}
    >
      {VERSION_LABEL}
    </div>
  );
};

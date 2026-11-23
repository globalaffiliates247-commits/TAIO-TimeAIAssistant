// TAIO Time App — Reusable Author Avatar (PRD v0.3.54 Part H)
'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import authorsMap from '../data/authors.json';

export interface AuthorAvatarProps {
  author?: string;
  avatarUrl?: string;
  size?: number; // default 22
  className?: string;
}

export const AuthorAvatar: React.FC<AuthorAvatarProps> = ({
  author,
  avatarUrl,
  size = 22,
  className = '',
}) => {
  const { palette } = useApp();
  if (!author || !author.trim()) return null;

  const authorName = author.trim();
  const authorsDict = (authorsMap || {}) as Record<string, string>;
  const photo = avatarUrl || authorsDict[authorName];
  const initial = authorName.charAt(0).toUpperCase();

  const isCool = palette === 'cool' || palette === 'bright-blue' || palette === 'calm-blue';
  const bgClass = isCool 
    ? 'bg-blue-600 text-white' 
    : 'bg-[var(--taio-brand)] text-[var(--taio-on-brand)]';

  if (photo) {
    return (
      <img
        src={photo}
        alt={authorName}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover shrink-0 border border-black/10 shadow-2xs ${className}`}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, Math.round(size * 0.55)),
      }}
      className={`rounded-full font-bold flex items-center justify-center shrink-0 shadow-2xs select-none ${bgClass} ${className}`}
      title={authorName}
    >
      {initial}
    </div>
  );
};

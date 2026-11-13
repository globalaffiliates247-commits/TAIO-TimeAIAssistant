'use client';
import React from 'react';
import { MotivationSticker } from '../../motivation';

export const QuoteCard: React.FC = () => {
  return <MotivationSticker slotKey="goals_tab" context="goal" size="card" />;
};

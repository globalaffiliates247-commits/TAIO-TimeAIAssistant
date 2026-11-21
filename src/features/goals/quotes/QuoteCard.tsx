'use client';
import React from 'react';
import { MotivationSticker } from '../../motivation';

export interface QuoteCardProps {
  className?: string;
  activeGoalId?: string;
  activeGoalName?: string;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ className, activeGoalId, activeGoalName }) => {
  return (
    <MotivationSticker
      slotKey="goals_tab"
      context="goal"
      size="card"
      className={className}
      activeGoalId={activeGoalId}
      activeGoalName={activeGoalName}
    />
  );
};

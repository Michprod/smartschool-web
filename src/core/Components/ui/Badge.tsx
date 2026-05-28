import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
}

export default function Badge({ children, tone = 'default' }: BadgeProps) {
  return <span className={`ui-badge ui-badge-${tone}`}>{children}</span>;
}


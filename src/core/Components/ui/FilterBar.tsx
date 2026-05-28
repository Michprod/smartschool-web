import React from 'react';
import Card from './Card';

export default function FilterBar({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <Card className={`ui-filter-bar ${className}`.trim()}>{children}</Card>;
}


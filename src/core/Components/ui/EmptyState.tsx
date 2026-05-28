import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="ui-empty-state">
      <span className="material-symbols-outlined">inbox</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}


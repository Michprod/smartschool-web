import React from 'react';

export default function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="ui-section-header">
      <h2>{title}</h2>
      {action}
    </div>
  );
}


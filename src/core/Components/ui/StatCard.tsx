import React from 'react';
import Card from './Card';

interface StatCardProps {
  title: string;
  value: string;
  icon?: string;
  hint?: string;
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export default function StatCard({ title, value, icon, hint, tone = 'default' }: StatCardProps) {
  return (
    <Card className={`ui-stat-card ui-tone-${tone}`}>
      <div className="ui-stat-top">
        <p>{title}</p>
        {icon ? <span className="material-symbols-outlined">{icon}</span> : null}
      </div>
      <h3>{value}</h3>
      {hint ? <small>{hint}</small> : null}
    </Card>
  );
}


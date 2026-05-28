import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: string[];
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <header className="ui-page-header">
      <div>
        {breadcrumbs?.length ? <p className="ui-breadcrumbs">{breadcrumbs.join(' / ')}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p className="ui-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ui-header-actions">{actions}</div> : null}
    </header>
  );
}


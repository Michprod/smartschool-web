import React from 'react';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export default function ActionButton({ label, icon, variant = 'primary', className = '', ...props }: ActionButtonProps) {
  return (
    <button {...props} className={`btn btn-${variant} ${className}`.trim()}>
      {icon ? <span className="material-symbols-outlined">{icon}</span> : null}
      {label}
    </button>
  );
}


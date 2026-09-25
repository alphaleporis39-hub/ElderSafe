import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '', ...props }) => {
  const baseStyle = 'inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wide transition-colors duration-150';
  
  const variants = {
    default: 'bg-navy-800 text-navy-300 border border-navy-700',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/35',
    info: 'bg-primary-500/10 text-primary-400 border border-primary-500/30',
    outline: 'border border-navy-700 text-navy-200',
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

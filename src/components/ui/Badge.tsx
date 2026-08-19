import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '', ...props }) => {
  const baseStyle = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide transition-colors duration-200';
  
  const variants = {
    default: 'bg-navy-100 text-navy-700 dark:bg-navy-800 dark:text-navy-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30',
    info: 'bg-accent-50 text-accent-700 border border-accent-200 dark:bg-accent-950/30 dark:text-accent-400 dark:border-accent-900/30',
    outline: 'border border-navy-200 text-navy-900 dark:border-navy-700 dark:text-white',
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

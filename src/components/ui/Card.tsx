import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', glass = false, hoverable = false, ...props }) => {
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        glass 
          ? 'glass shadow-glass' 
          : 'bg-white border-navy-100/60 shadow-card dark:bg-navy-900/80 dark:border-navy-700/50'
      } ${
        hoverable 
          ? 'hover:-translate-y-0.5 hover:shadow-premium dark:hover:border-primary-500/20 hover:border-primary-200/40' 
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`p-6 pb-4 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold tracking-tight text-navy-900 dark:text-white ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-navy-400 dark:text-navy-300 mt-1 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`p-6 pt-0 border-t border-navy-100 dark:border-navy-800/50 mt-4 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

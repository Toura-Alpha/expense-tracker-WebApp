import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', children, ...props }, ref) => {
    const baseStyle =
      'inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants = {
      primary: 'bg-forest text-white hover:bg-forest/90',
      secondary: 'bg-surface text-ink border border-line hover:bg-paper',
      outline: 'border border-line text-ink hover:bg-surface',
      danger: 'bg-rust text-white hover:bg-rust/90',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyle} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

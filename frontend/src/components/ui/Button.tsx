import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'subtle' | 'danger';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 active:translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 disabled:opacity-50 disabled:cursor-not-allowed';

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-pro-btn text-white border border-white/12 hover:bg-pro-btn-hover active:bg-pro-btn-active shadow-[0_10px_26px_-14px_rgba(0,0,0,0.9)]',
  secondary: 'bg-white/10 text-white border border-white/15 hover:bg-white/14',
  ghost: 'bg-transparent text-white/60 hover:text-white hover:bg-white/5 border border-transparent',
  outline: 'bg-transparent text-white/80 border border-white/15 hover:bg-white/6',
  subtle: 'bg-white/[0.04] text-white/80 border border-white/10 hover:bg-white/[0.08]',
  danger: 'bg-red-500/15 text-red-100 border border-red-500/30 hover:bg-red-500/25',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'text-[11px] px-2.5 py-1.5',
  sm: 'text-[13px] px-3 py-2',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-5 py-3',
  icon: 'h-9 w-9 p-0',
};

const cn = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  pill = false,
  fullWidth = false,
  className = '',
  ...props
}) => {
  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        pill && 'rounded-full',
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'secondary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "flex justify-center items-center px-5 py-2 rounded-lg text-[13px] font-semibold transition-all duration-300 active:scale-[0.98] outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-background hover:bg-primary-hover shadow-[0_0_15px_-3px_rgba(212,175,55,0.3)]",
    secondary: "bg-surface-card hover:bg-white/10 text-text-main border border-white/10 backdrop-blur-sm",
    ghost: "bg-transparent text-text-muted hover:text-text-main hover:bg-white/5",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

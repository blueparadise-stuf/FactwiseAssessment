import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'navy';
  size?: 'sm' | 'md';
  withDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  withDot = true,
  className = '',
}) => {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/80',
    info: 'bg-blue-50 text-blue-800 border-blue-200/80',
    neutral: 'bg-slate-100 text-slate-800 border-slate-200/80',
    purple: 'bg-purple-50 text-purple-800 border-purple-200/80',
    navy: 'bg-slate-900 text-white border-slate-800',
  };

  const dotStyles = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-blue-500',
    neutral: 'bg-slate-400',
    purple: 'bg-purple-500',
    navy: 'bg-emerald-400',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-semibold gap-1.5',
    md: 'text-xs px-2.5 py-1 font-bold gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center border rounded-full tracking-tight shadow-2xs ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {withDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[variant]}`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};

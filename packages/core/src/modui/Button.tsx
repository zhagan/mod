import React from 'react';
import './Button.css';

export interface ButtonProps {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger' | 'success' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  title?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  icon,
  active = false,
  onClick,
  disabled = false,
  variant = 'default',
  size = 'medium',
  title,
  className = '',
  type = 'button',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    onClick?.();
    e.stopPropagation();
  };

  const classes = [
    'modui-button',
    `modui-button-${variant}`,
    `modui-button-${size}`,
    active && 'modui-button-active',
    disabled && 'modui-button-disabled',
    icon && !children && 'modui-button-icon-only',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      onClick={handleClick}
      disabled={disabled}
      title={title}
      type={type}
      aria-pressed={active}
    >
      {icon && <span className="modui-button-icon">{icon}</span>}
      {children && <span className="modui-button-text">{children}</span>}
    </button>
  );
};

Button.displayName = 'Button';

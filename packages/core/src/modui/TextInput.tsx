import React from 'react';
import './TextInput.css';

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  type?: 'text' | 'url' | 'email' | 'password' | 'search';
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  placeholder = '',
  label,
  disabled = false,
  type = 'text',
  className = '',
  inputClassName = '',
  labelClassName = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const containerClasses = [
    'modui-text-input',
    className,
  ].filter(Boolean).join(' ');

  const labelClasses = [
    'modui-text-input-label',
    labelClassName,
  ].filter(Boolean).join(' ');

  const inputClasses = [
    'modui-text-input-field',
    disabled && 'modui-text-input-disabled',
    inputClassName,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && <label className={labelClasses}>{label}</label>}
      <input
        type={type}
        className={inputClasses}
        value={value}
        onChange={handleChange}
        onMouseDown={handleMouseDown}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
};

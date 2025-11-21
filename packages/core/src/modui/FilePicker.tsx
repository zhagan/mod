import React, { useRef } from 'react';
import './FilePicker.css';

export interface FilePickerProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
}

export const FilePicker: React.FC<FilePickerProps> = ({
  onFileSelect,
  accept = '*/*',
  label = 'Choose File',
  icon,
  disabled = false,
  className = '',
  buttonClassName = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    inputRef.current?.click();
    e.stopPropagation();
  };

  const containerClasses = [
    'modui-file-picker',
    className,
  ].filter(Boolean).join(' ');

  const buttonClasses = [
    'modui-file-picker-button',
    disabled && 'modui-file-picker-disabled',
    buttonClassName,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="modui-file-picker-input"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={handleClick}
        className={buttonClasses}
        disabled={disabled}
      >
        {icon && <span className="modui-file-picker-icon">{icon}</span>}
        <span className="modui-file-picker-label">{label}</span>
      </button>
    </div>
  );
};

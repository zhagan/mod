import React, { useState, useRef, useEffect } from 'react';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  const handleToggle = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsOpen(!isOpen);
    e.stopPropagation();
  };

  const handleSelect = (optionValue: string, e: React.MouseEvent) => {
    onChange(optionValue);
    setIsOpen(false);
    e.stopPropagation();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const classes = [
    'modui-select',
    isOpen && 'modui-select-open',
    disabled && 'modui-select-disabled',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div ref={selectRef} className={classes}>
      <button
        type="button"
        className="modui-select-trigger"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="modui-select-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="modui-select-arrow">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="modui-select-dropdown">
          <ul className="modui-select-list" role="listbox">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  className={`modui-select-option ${isSelected ? 'modui-select-option-selected' : ''}`}
                  onClick={(e) => handleSelect(option.value, e)}
                  role="option"
                  aria-selected={isSelected}
                >
                  {isSelected && (
                    <span className="modui-select-checkmark">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                  <span className="modui-select-option-label">{option.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

Select.displayName = 'Select';

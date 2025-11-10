'use client';
import React from 'react';
import styles from './Checkbox.module.css';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
  error
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <label className={`${styles.checkboxLabel} ${className} ${disabled ? styles.disabled : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className={styles.hiddenInput}
      />
      <span className={`${styles.customCheckbox} ${error ? styles.error : ''} ${checked ? styles.checked : ''}`}>
        {checked && (
          <svg 
            className={styles.checkIcon} 
            viewBox="0 0 12 10" 
            fill="none"
          >
            <path
              d="M1 5L4 8L11 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {label && <span className={styles.labelText}>{label}</span>}
    </label>
  );
};

export default Checkbox;
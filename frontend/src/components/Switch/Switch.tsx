'use client';
import React, { useState, useMemo } from 'react';
import styles from './Switch.module.css';

interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  ariaLabel?: string;
  testId?: string;
  scale?: number;
  activeColor?: string;
  inactiveColor?: string;
  thumbColor?: string;
  className?: string
}


export const Switch: React.FC<SwitchProps> = ({
  checked = false,
  onChange,
  ariaLabel = 'Переключатель',
  testId,
  scale = 1,
  activeColor,
  inactiveColor,
  thumbColor,
  className
}) => {
  const [isChecked, setIsChecked] = useState(checked);

  const handleToggle = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    onChange?.(newValue);
  };

  const computedStyles = useMemo(() => {
  const baseWidth = 51;
  const baseHeight = 31;
  const baseThumbSize = 27;
  const baseThumbPosition = 2;
  const baseTranslateX = 20;

  return {
    '--toggle-width': `${baseWidth * scale}px`,
    '--toggle-height': `${baseHeight * scale}px`,
    '--thumb-size': `${baseThumbSize * scale}px`,
    '--thumb-position': `${baseThumbPosition * scale}px`,
    '--thumb-translate': `${baseTranslateX * scale}px`,
    ...(activeColor && { '--custom-active-color': activeColor }),
    ...(inactiveColor && { '--custom-inactive-color': inactiveColor }),
    ...(thumbColor && { '--custom-thumb-color': thumbColor }),
  } as React.CSSProperties;
}, [scale, activeColor, inactiveColor, thumbColor]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      aria-label={ariaLabel}
      className={styles.toggleSwitch}
      onClick={handleToggle}
      data-testid={testId}
      data-checked={isChecked}
      style={computedStyles}
    >
      <span className={`${styles.toggleTrack} ${className}`}>
        <span className={styles.toggleThumb} />
      </span>
    </button>
  );
};
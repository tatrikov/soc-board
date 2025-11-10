'use client';
import { useState, useRef, useEffect } from "react";
import styles from "./Select.module.css";
import { ChevronDown } from "lucide-react";

interface Option {
  id: string | number;
  title: string;
}

interface SelectProps {
  options: Option[];
  value?: string | number | null; // теперь это id
  onChange?: (id: string | number) => void;
  placeholder?: string;
  fontSize?: string;
  padding?: string;
  weight?: number;
}

export const Select = ({
  options,
  fontSize,
  padding,
  weight,
  value,
  onChange,
  placeholder,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: string | number) => {
    onChange?.(id);
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.id === value);

  return (
    <div className={styles.selectWrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.selectButton}
        style={{
          fontSize: fontSize,
          padding: padding,
          fontWeight: weight,
        }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {selectedOption?.title || placeholder || "Выберите..."}
        <ChevronDown className={styles.arrowIcon} size={20} />
      </button>
      <div className={`${styles.options} ${isOpen ? styles.optionsOpen : ""}`}>
        {options.map((option) => (
          <div
            key={option.id}
            className={`${styles.option} ${option.id === value ? styles.optionSelected : ""}`}
            onClick={() => handleSelect(option.id)}
          >
            {option.title}
          </div>
        ))}
      </div>
    </div>
  );
};

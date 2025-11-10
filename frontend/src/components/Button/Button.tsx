'use client';
import React, { useEffect, useState } from "react";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ElementType;
  loading?: boolean;
  variant?: ButtonVariant;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  icon: Icon,
  loading = false,
  disabled = false,
  variant = "primary",
  className = "",
  ...props
}) => {
  const isDisabled = disabled || loading;

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Пока компонент не смонтировался, ничего не рендерим
    return null;
  }

  return (
    <button
      className={`${styles.button} ${styles[variant]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {!loading ? (
        <span className={styles.content}>
          {Icon && <Icon className={styles.icon} size={18} />}
          {children}
        </span>
      ) : (
        <span className={styles.loader}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      )}
    </button>
  );
};

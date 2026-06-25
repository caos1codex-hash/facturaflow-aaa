import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: {
    base: 'bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-700)] active:bg-[var(--color-brand-800)]',
    focusRing: 'focus-visible:ring-[var(--color-brand-300)]',
  },
  secondary: {
    base: 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--border-default)] active:bg-[var(--border-strong)]',
    focusRing: 'focus-visible:ring-[var(--border-default)]',
  },
  danger: {
    base: 'bg-[var(--color-error)] text-white hover:bg-[#dc2626] active:bg-[#b91c1c]',
    focusRing: 'focus-visible:ring-[#fca5a5]',
  },
  ghost: {
    base: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] active:bg-[var(--border-default)]',
    focusRing: 'focus-visible:ring-[var(--border-default)]',
  },
  outline: {
    base: 'bg-transparent border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-strong)] active:bg-[var(--border-default)]',
    focusRing: 'focus-visible:ring-[var(--border-default)]',
  },
};

const sizes = {
  sm: { padding: 'px-3 py-1.5', text: 'text-sm', gap: 'gap-1.5', iconSize: 14 },
  md: { padding: 'px-4 py-2', text: 'text-sm', gap: 'gap-2', iconSize: 16 },
  lg: { padding: 'px-5 py-2.5', text: 'text-base', gap: 'gap-2.5', iconSize: 18 },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: IconLeft,
  iconRight: IconRight,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const style = variants[variant] || variants.primary;
  const sizeStyle = sizes[size] || sizes.md;

  const Icon = iconPosition === 'right' ? IconRight || IconLeft : IconLeft;
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileHover={isDisabled ? {} : { scale: 1.01 }}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`
        inline-flex items-center justify-center gap-${sizeStyle.gap.split('gap-')[1]}
        ${sizeStyle.padding}
        ${sizeStyle.text}
        font-medium rounded-[var(--radius-lg)]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
        ${style.focusRing}
        ${style.base}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
        transition-colors duration-[var(--transition-fast)]
        select-none
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2
          size={sizeStyle.iconSize}
          className="animate-spin"
        />
      ) : Icon ? (
        <Icon size={sizeStyle.iconSize} className="shrink-0" />
      ) : null}

      {children && <span>{children}</span>}

      {IconRight && iconPosition !== 'right' && !loading && (
        <IconRight size={sizeStyle.iconSize} className="shrink-0" />
      )}
    </motion.button>
  );
}

import { motion } from 'framer-motion';

const variantClasses = {
  borrador: 'badge-borrador',
  emitida: 'badge-emitida',
  pendiente: 'badge-pendiente',
  pagada: 'badge-pagada',
  vencida: 'badge-vencida',
  cancelada: 'badge-cancelada',
  default: 'badge-borrador',
  info: 'badge-emitida',
  success: 'badge-pagada',
  warning: 'badge-pendiente',
  danger: 'badge-vencida',
};

const dotColors = {
  borrador: 'bg-[#475569]',
  emitida: 'bg-[#1d4ed8]',
  pendiente: 'bg-[#92400e]',
  pagada: 'bg-[#065f46]',
  vencida: 'bg-[#991b1b]',
  cancelada: 'bg-[#6b7280]',
  default: 'bg-[#475569]',
  info: 'bg-[#1d4ed8]',
  success: 'bg-[#065f46]',
  warning: 'bg-[#92400e]',
  danger: 'bg-[#991b1b]',
};

const sizeClasses = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1',
};

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  className = '',
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-[var(--radius-full)] whitespace-nowrap
        ${variantClasses[variant] || variantClasses.default}
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || dotColors.default}`}
        />
      )}
      {children}
    </motion.span>
  );
}

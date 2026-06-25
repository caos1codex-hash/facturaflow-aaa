import { motion } from 'framer-motion';

export function EmptyState({
  icon: Icon,
  title = 'No hay datos',
  description = 'Aún no hay información para mostrar.',
  action,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className={`
        flex flex-col items-center justify-center text-center py-12 px-6
        ${className}
      `}
    >
      {Icon && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] mb-5"
        >
          <Icon size={28} strokeWidth={1.5} />
        </motion.div>
      )}

      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1.5">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}

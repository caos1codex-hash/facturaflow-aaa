import { motion } from 'framer-motion';

export function Card({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = '',
  padding = 'p-6',
  hoverable = false,
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={`
        card-base
        ${hoverable ? 'card-interactive cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {(title || Icon || action) && (
        <div className={`flex items-center justify-between ${padding} ${children ? 'border-b border-[var(--border-default)]' : ''}`}>
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] shrink-0">
                <Icon size={18} />
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0 ml-3">{action}</div>}
        </div>
      )}

      {children && (
        <div className={padding}>
          {children}
        </div>
      )}
    </motion.div>
  );
}

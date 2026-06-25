import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col gap-3 ${className}`}
    >
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-xs">
          <Link
            to="/"
            className="flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Home size={13} />
          </Link>

          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span key={index} className="flex items-center gap-1.5">
                <ChevronRight size={12} className="text-[var(--text-tertiary)]" />
                {isLast ? (
                  <span className="font-medium text-[var(--text-primary)]">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
      )}

      {/* Title row */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
}

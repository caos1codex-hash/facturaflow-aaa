import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const colorConfig = {
  blue: {
    bg: 'bg-[#eff6ff] dark:bg-[#1e3a5f]',
    icon: 'text-[var(--color-brand-600)]',
  },
  green: {
    bg: 'bg-[#d1fae5] dark:bg-[#064e3b]',
    icon: 'text-[var(--color-success)]',
  },
  purple: {
    bg: 'bg-[#ede9fe] dark:bg-[#2e1065]',
    icon: 'text-[#7c3aed]',
  },
  orange: {
    bg: 'bg-[#ffedd5] dark:bg-[#431407]',
    icon: 'text-[var(--color-warning)]',
  },
  red: {
    bg: 'bg-[#fee2e2] dark:bg-[#450a0a]',
    icon: 'text-[var(--color-error)]',
  },
};

const changeIcons = {
  increase: TrendingUp,
  decrease: TrendingDown,
  neutral: Minus,
};

const changeColors = {
  increase: 'text-[var(--color-success)]',
  decrease: 'text-[var(--color-error)]',
  neutral: 'text-[var(--text-tertiary)]',
};

const changeBgColors = {
  increase: 'bg-[#d1fae5] dark:bg-[#064e3b]',
  decrease: 'bg-[#fee2e2] dark:bg-[#450a0a]',
  neutral: 'bg-[var(--bg-tertiary)]',
};

export function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  color = 'blue',
  className = '',
}) {
  const colors = colorConfig[color] || colorConfig.blue;
  const ChangeIcon = changeIcons[changeType] || changeIcons.neutral;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`card-base p-5 flex items-start justify-between gap-4 ${className}`}
    >
      <div className="flex flex-col gap-1.5 min-w-0">
        <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          {title}
        </span>
        <span className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          {value}
        </span>
        {change !== undefined && (
          <div className="flex items-center gap-1.5">
            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-[var(--radius-full)] text-[10px] font-semibold ${changeBgColors[changeType]} ${changeColors[changeType]}`}>
              <ChangeIcon size={12} />
              <span>{Math.abs(change)}%</span>
            </div>
            <span className="text-xs text-[var(--text-tertiary)]">
              {changeType === 'increase' ? 'vs. periodo anterior' : changeType === 'decrease' ? 'vs. periodo anterior' : 'sin cambios'}
            </span>
          </div>
        )}
      </div>

      {Icon && (
        <div className={`flex items-center justify-center w-11 h-11 rounded-[var(--radius-lg)] shrink-0 ${colors.bg}`}>
          <Icon size={20} className={colors.icon} />
        </div>
      )}
    </motion.div>
  );
}

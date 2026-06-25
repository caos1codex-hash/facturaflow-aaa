import { motion } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

function SkeletonRow({ columns }) {
  return (
    <tr>
      {columns.map((col, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded-[var(--radius-sm)] animate-shimmer w-[80%]" />
        </td>
      ))}
    </tr>
  );
}

function SortIcon({ column, sortConfig }) {
  if (!column.sortable) return null;

  if (sortConfig?.key === column.key) {
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={14} className="text-[var(--color-brand-600)]" />
    ) : (
      <ArrowDown size={14} className="text-[var(--color-brand-600)]" />
    );
  }

  return <ArrowUpDown size={14} className="text-[var(--text-tertiary)]" />;
}

export function Table({
  columns = [],
  data = [],
  onRowClick,
  emptyMessage = 'No hay datos disponibles',
  loading = false,
  onSort,
  sortConfig,
  className = '',
}) {
  const handleSort = (column) => {
    if (!column.sortable || !onSort) return;
    onSort(column.key);
  };

  return (
    <div className={`w-full overflow-x-auto rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-card)] ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`
                  px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide
                  ${col.sortable ? 'cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors' : ''}
                `}
                style={col.width ? { width: col.width } : undefined}
                onClick={() => handleSort(col)}
              >
                <div className="flex items-center gap-1.5">
                  {col.label}
                  <SortIcon column={col} sortConfig={sortConfig} />
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} columns={columns} />
              ))}
            </>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm text-[var(--text-tertiary)]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <motion.tr
                key={row.id ?? rowIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: rowIndex * 0.03 }}
                className={`
                  border-b border-[var(--border-default)] last:border-b-0
                  ${rowIndex % 2 === 0 ? 'bg-[var(--bg-card)]' : 'bg-[var(--bg-secondary)]'}
                  ${onRowClick ? 'cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors' : ''}
                `}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-[var(--text-primary)]">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </motion.tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = forwardRef(function Select(
  {
    label,
    options = [],
    error,
    icon: Icon,
    placeholder = 'Seleccionar...',
    required = false,
    disabled = false,
    className = '',
    id,
    ...props
  },
  ref
) {
  const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-1"
        >
          {label}
          {required && <span className="text-[var(--color-error)]">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none z-10">
            <Icon size={16} />
          </div>
        )}

        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          className={`
            input-base w-full text-sm px-3 py-2.5 appearance-none cursor-pointer
            ${Icon ? 'pl-10' : ''}
            pr-10
            ${error ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--bg-tertiary)]' : ''}
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none">
          <ChevronDown size={16} />
        </div>
      </div>

      {error && (
        <p id={`${selectId}-error`} className="text-xs text-[var(--color-error)]">
          {error}
        </p>
      )}
    </div>
  );
});

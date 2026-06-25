import { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    icon: Icon,
    type = 'text',
    required = false,
    disabled = false,
    className = '',
    id,
    ...props
  },
  ref
) {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`;
  const isTextarea = type === 'textarea';

  const baseClasses = `
    input-base w-full text-sm px-3 py-2.5
    ${Icon ? 'pl-10' : ''}
    ${error ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--bg-tertiary)]' : ''}
    ${className}
  `;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-1"
        >
          {label}
          {required && <span className="text-[var(--color-error)]">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none">
            <Icon size={16} />
          </div>
        )}

        {isTextarea ? (
          <textarea
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            className={`${baseClasses} min-h-[80px] resize-y`}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        ) : (
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            required={required}
            className={baseClasses}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="text-xs text-[var(--color-error)] flex items-center gap-1">
          {error}
        </p>
      )}

      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-xs text-[var(--text-tertiary)]">
          {hint}
        </p>
      )}
    </div>
  );
});

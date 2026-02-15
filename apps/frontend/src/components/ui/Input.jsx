import { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      error,
      className = '',
      type = 'text',
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="label">{label}</label>
        )}
        <input
          ref={ref}
          type={type}
          className={`input ${error ? 'input-error' : ''} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-danger-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const Textarea = forwardRef(
  (
    {
      label,
      error,
      className = '',
      rows = 4,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="label">{label}</label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={`input resize-none ${error ? 'input-error' : ''} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-danger-400">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export const Select = forwardRef(
  (
    {
      label,
      error,
      options = [],
      placeholder = 'Pilih...',
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="label">{label}</label>
        )}
        <select
          ref={ref}
          className={`input ${error ? 'input-error' : ''} ${className}`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-surface-200 text-white">
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1.5 text-sm text-danger-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Input;

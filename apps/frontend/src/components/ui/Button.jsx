import { forwardRef } from 'react';

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      className = '',
      disabled = false,
      loading = false,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow-sm hover:shadow-glow-md hover:-translate-y-0.5',
      secondary:
        'bg-white/[0.08] text-white/85 border border-white/[0.1] hover:bg-white/[0.14] hover:border-white/[0.2]',
      outline:
        'bg-transparent text-white/85 border border-white/[0.15] hover:bg-white/[0.06] hover:border-white/[0.25]',
      danger:
        'bg-gradient-to-r from-danger-500 to-danger-600 text-white shadow-[0_4px_15px_-3px_rgba(244,63,94,0.4)] hover:shadow-[0_8px_25px_-3px_rgba(244,63,94,0.5)] hover:-translate-y-0.5',
      ghost:
        'text-white/60 hover:text-white/90 hover:bg-white/[0.06]',
      success:
        'bg-gradient-to-r from-success-500 to-success-600 text-white shadow-glow-success hover:-translate-y-0.5',
    };

    const sizes = {
      sm: 'px-3.5 py-2 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-7 py-3.5 text-base',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

/**
 * Button — primary, secondary, ghost, danger variants
 *
 * Props:
 *  variant   'primary' | 'secondary' | 'ghost' | 'danger'
 *  size      'sm' | 'md' | 'lg'
 *  fullWidth  boolean
 *  loading    boolean
 *  icon       ReactNode  (left icon)
 */
import { FiLoader } from 'react-icons/fi';

const variantClasses = {
  primary:   'btn-primary',
  secondary: 'surface text-main hover:opacity-80 transition-opacity',
  ghost:     'text-main hover:bg-[var(--color-surface-2)] transition-colors',
  danger:    'bg-red-600 hover:bg-red-700 text-white transition-colors',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-sm rounded-xl',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon = null,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <FiLoader className="animate-spin" size={14} />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
};

export default Button;
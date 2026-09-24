/**
 * Input — text input with optional label, left icon, right element, error message
 *
 * Props:
 *  label      string
 *  error      string
 *  icon       ReactNode  (left icon)
 *  rightEl    ReactNode  (right slot — e.g. show/hide password button)
 */
const Input = ({
  label,
  error,
  icon: Icon,
  rightEl,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <span
            className="absolute left-3 flex-shrink-0"
            style={{ color: 'var(--color-text-subtle)' }}
          >
            <Icon size={15} />
          </span>
        )}

        <input
          id={inputId}
          className={`
            input-field w-full rounded-lg py-2.5 text-sm
            ${Icon ? 'pl-9 pr-3' : 'px-3'}
            ${rightEl ? 'pr-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:!shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : ''}
          `}
          {...props}
        />

        {rightEl && (
          <span className="absolute right-3 flex-shrink-0">{rightEl}</span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-0.5">{error}</p>
      )}
    </div>
  );
};

export default Input;

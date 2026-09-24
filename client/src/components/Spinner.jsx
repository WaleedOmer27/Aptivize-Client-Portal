/**
 * Spinner — loading indicator
 * Props: size 'sm' | 'md' | 'lg', fullScreen boolean
 */
const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
};

const Spinner = ({ size = 'md', fullScreen = false }) => {
  const spinner = (
    <div
      className={`
        ${sizeMap[size]} rounded-full animate-spin
        border-[var(--color-border)]
        border-t-[var(--color-primary)]
      `}
    />
  );

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ background: 'var(--color-bg)' }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Spinner;

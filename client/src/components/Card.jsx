/**
 * Card — base surface card + StatCard variant
 *
 * <Card>             — generic surface card
 * <Card.Stat>        — stat card matching admin portal style
 */

const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={`surface rounded-xl p-5 ${hover ? 'card-hover cursor-pointer' : ''} ${className}`}
      style={{ boxShadow: 'var(--shadow-sm)' }}
      {...props}
    >
      {children}
    </div>
  );
};

const accentMap = {
  purple: 'var(--color-accent-purple)',
  blue:   'var(--color-accent-blue)',
  green:  'var(--color-accent-green)',
  amber:  'var(--color-accent-amber)',
  red:    'var(--color-accent-red)',
  cyan:   'var(--color-accent-cyan)',
};

const StatCard = ({ label, value, icon: Icon, accent = 'purple', className = '' }) => {
  return (
    <div
      className={`surface rounded-xl p-5 card-hover ${className}`}
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <p
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: 'var(--color-text-subtle)' }}
        >
          {label}
        </p>
        {Icon && (
          <span
            className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
            style={{ background: accentMap[accent] }}
          >
            <Icon size={15} style={{ color: `var(--color-primary)` }} />
          </span>
        )}
      </div>
      <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
        {value ?? 0}
      </p>
    </div>
  );
};

Card.Stat = StatCard;

export default Card;

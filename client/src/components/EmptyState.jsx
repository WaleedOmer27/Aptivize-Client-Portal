/**
 * components/EmptyState.jsx
 *
 * Reusable "no data" illustration component.
 *
 * Props:
 *   icon        — React icon component (e.g. FiInbox)
 *   title       — Main heading text
 *   description — Supporting subtext
 *   action      — Optional ReactNode (e.g. a <Button>)
 *   compact     — Boolean, reduces padding for inline use
 */

const EmptyState = ({ icon: Icon, title, description, action, compact = false }) => (
  <div
    className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10' : 'py-16'}`}
  >
    {/* Icon bubble */}
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
      style={{ background: 'var(--color-surface-2)' }}
    >
      {Icon && <Icon size={24} style={{ color: 'var(--color-text-subtle)' }} />}
    </div>

    {/* Text */}
    <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>
      {title}
    </p>
    {description && (
      <p
        className="text-sm max-w-xs"
        style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}
      >
        {description}
      </p>
    )}

    {/* Optional CTA */}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;

import { asset } from "../../lib/assets";

/** Honest empty state with the MAUNG illustration and an optional real action. */
export default function EmptyState({ title, message, action, art = "images/empty-state-mascot.webp", compact = false }) {
  return (
    <div className="empty" style={compact ? { padding: "var(--sp-5) var(--sp-3)" } : undefined}>
      {art && !compact && <img className="empty__art" src={asset(art)} alt="" width="150" height="190" loading="lazy" />}
      <h3 className="empty__title">{title}</h3>
      {message && <p className="empty__text">{message}</p>}
      {action}
    </div>
  );
}

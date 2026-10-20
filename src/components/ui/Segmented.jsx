import { useRef } from "react";

/**
 * Single-choice segmented control (role="radiogroup") with arrow-key support.
 * options: [{ value, label, icon?, tone? }]
 */
export default function Segmented({ label, value, onChange, options, className = "", id }) {
  const refs = useRef([]);
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  const onKeyDown = (e) => {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={label} className={`segmented ${className}`} id={id} onKeyDown={onKeyDown}>
      {options.map((o, i) => {
        const Icon = o.icon;
        const checked = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            data-tone={o.tone}
            className="segmented__option"
            onClick={() => onChange(o.value)}
          >
            {Icon && <Icon size={16} aria-hidden="true" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

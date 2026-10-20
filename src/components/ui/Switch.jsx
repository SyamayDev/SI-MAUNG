import { useId } from "react";

/** Accessible on/off switch with a visible label and description. */
export default function Switch({ checked, onChange, label, description, disabled }) {
  const id = useId();
  return (
    <div className="switch-row">
      <div className="grow">
        <p className="switch-row__label" id={`${id}-label`}>
          {label}
        </p>
        {description && (
          <p className="switch-row__desc" id={`${id}-desc`}>
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        className="switch"
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="switch__thumb" />
      </button>
    </div>
  );
}

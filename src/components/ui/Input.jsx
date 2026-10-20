import { forwardRef, useId, useState } from "react";
import { AlertCircle, Eye, EyeOff, Lightbulb } from "lucide-react";

/** Label + control + hint/review/error, all wired with ids for assistive tech. */
export function Field({ id, label, hint, error, review, children, className = "" }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const reviewId = review ? `${id}-review` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, reviewId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`field ${className}`}>
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
      )}
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {hint && !error && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {review && !error && (
        <p className="field__review" id={reviewId}>
          <Lightbulb size={14} aria-hidden="true" />
          <span>{review}</span>
        </p>
      )}
      {error && (
        <p className="field__error" id={errorId} role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

const Input = forwardRef(function Input({ id, label, hint, error, review, className = "", fieldClassName = "", ...props }, ref) {
  const auto = useId();
  const inputId = id || auto;
  return (
    <Field id={inputId} label={label} hint={hint} error={error} review={review} className={fieldClassName}>
      {(a11y) => <input ref={ref} className={`input ${review && !error ? "input--review" : ""} ${className}`} {...a11y} {...props} />}
    </Field>
  );
});

export default Input;

export const TextArea = forwardRef(function TextArea({ id, label, hint, error, className = "", ...props }, ref) {
  const auto = useId();
  const inputId = id || auto;
  return (
    <Field id={inputId} label={label} hint={hint} error={error}>
      {(a11y) => <textarea ref={ref} className={`textarea ${className}`} {...a11y} {...props} />}
    </Field>
  );
});

export const PasswordInput = forwardRef(function PasswordInput({ id, label, hint, error, ...props }, ref) {
  const auto = useId();
  const inputId = id || auto;
  const [visible, setVisible] = useState(false);
  return (
    <Field id={inputId} label={label} hint={hint} error={error}>
      {(a11y) => (
        <div className="password-field">
          <input ref={ref} className="input" type={visible ? "text" : "password"} {...a11y} {...props} />
          <button
            type="button"
            className="icon-btn password-field__toggle"
            aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
      )}
    </Field>
  );
});

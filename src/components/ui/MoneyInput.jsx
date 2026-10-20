import { forwardRef, useId } from "react";
import { Field } from "./Input";
import { formatDigits } from "../../lib/finance/format";

/**
 * Rupiah input: shows "25.000" while typing, reports a plain integer (or null).
 * inputMode="numeric" brings up the number pad on phones.
 */
const MoneyInput = forwardRef(function MoneyInput({ id, label, hint, error, review, value, onChange, ...props }, ref) {
  const auto = useId();
  const inputId = id || auto;
  return (
    <Field id={inputId} label={label} hint={hint} error={error} review={review}>
      {(a11y) => (
        <div className="money-input">
          <span className="money-input__prefix" aria-hidden="true">
            Rp
          </span>
          <input
            ref={ref}
            className={`input ${review && !error ? "input--review" : ""}`}
            inputMode="numeric"
            autoComplete="off"
            value={formatDigits(value)}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 13);
              onChange(digits ? Number(digits) : null);
            }}
            {...a11y}
            {...props}
          />
        </div>
      )}
    </Field>
  );
});

export default MoneyInput;

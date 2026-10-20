import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { Field } from "./Input";

const Select = forwardRef(function Select({ id, label, hint, error, review, options, className = "", fieldClassName = "", ...props }, ref) {
  const auto = useId();
  const selectId = id || auto;
  return (
    <Field id={selectId} label={label} hint={hint} error={error} review={review} className={fieldClassName}>
      {(a11y) => (
        <div className="select-wrap">
          <select ref={ref} className={`select ${review && !error ? "input--review" : ""} ${className}`} {...a11y} {...props}>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown size={18} className="select-wrap__chevron" aria-hidden="true" />
        </div>
      )}
    </Field>
  );
});

export default Select;

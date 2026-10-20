import { forwardRef } from "react";

/**
 * variant: primary | amber | secondary | ghost | danger — size: sm | md | lg
 * `loading` keeps the label width stable and blocks repeated clicks.
 */
const Button = forwardRef(function Button(
  { variant = "secondary", size = "md", block = false, loading = false, className = "", type = "button", disabled, children, ...props },
  ref
) {
  const classes = [
    "btn",
    variant !== "secondary" && `btn--${variant}`,
    size !== "md" && `btn--${size}`,
    block && "btn--block",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button ref={ref} type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
});

export default Button;

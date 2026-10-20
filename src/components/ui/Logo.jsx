import { asset } from "../../lib/assets";

/** MAUNG face mark + wordmark. */
export default function Logo({ size = 36, compact = false, className = "" }) {
  return (
    <span className={`logo ${className}`}>
      <img src={asset("images/logo-simang.webp")} alt="" width={size} height={Math.round(size * 0.9)} className="logo__mark" />
      {!compact && (
        <span className="logo__word">
          SI<span className="logo__accent">MAUNG</span>
        </span>
      )}
      <span className="sr-only">SI-MAUNG</span>
    </span>
  );
}

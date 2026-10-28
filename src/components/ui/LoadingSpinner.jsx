import { asset } from "../../lib/assets";

/** Full-area loading state with the MAUNG mark. */
export default function LoadingSpinner({ message = "Memuat…" }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <img className="page-loader__mark" src={asset("images/logo-simang-192.webp")} alt="" width="64" height="58" />
      <span>{message}</span>
    </div>
  );
}

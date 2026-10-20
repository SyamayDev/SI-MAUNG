import { Link } from "react-router-dom";
import EmptyState from "../components/ui/EmptyState";

export default function NotFound() {
  return (
    <div className="page" style={{ maxWidth: 560 }}>
      <EmptyState
        title="Halaman tidak ditemukan"
        message="Alamat ini tidak ada di SI-MAUNG. Mungkin tautannya salah ketik."
        action={
          <Link to="/" className="btn btn--primary">
            Kembali ke beranda
          </Link>
        }
      />
    </div>
  );
}

import { Link } from "react-router-dom";
import EmptyState from "../components/ui/EmptyState";

export default function NotFound() {
  return (
    <main className="page" id="main" style={{ maxWidth: 560 }}>
      <EmptyState
        headingLevel={1}
        title="Halaman tidak ditemukan"
        message="Alamat ini tidak ada di SI-MAUNG. Mungkin tautannya salah ketik."
        action={
          <Link to="/" className="btn btn--primary">
            Kembali ke beranda
          </Link>
        }
      />
    </main>
  );
}

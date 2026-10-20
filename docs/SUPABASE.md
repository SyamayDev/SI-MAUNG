# Supabase untuk SI-MAUNG

## Status

- Project yang dirujuk `.env.local` **tidak bisa diakses** saat pengerjaan (host tidak ditemukan di DNS; akun Supabase CLI yang login tidak memiliki project tersebut). Skema live **belum** diinspeksi dan migration **belum** diterapkan.
- Migration dan uji RLS sudah dijalankan di Postgres lokal (`supabase/postgres:17.6.1.166`) pada dua skenario: tabel lama berisi baris, dan database kosong.

## Model data yang dipakai aplikasi

| Tabel | Kolom yang dibaca/ditulis frontend |
| --- | --- |
| `profiles` | `id` (= `auth.users.id`), `full_name`, `onboarding_completed`, `created_at`, `updated_at` |
| `transactions` | `id`, `user_id`, `type` (`income`/`expense`), `amount` (rupiah, numerik), `description`, `category`, `transaction_date` (date), `notes`*, `source`* (`manual`/`voice`/`text`/`ai`), `created_at`, `updated_at` |
| `savings_goals` | `id`, `user_id`, `name`, `target_amount`, `current_amount`, `deadline`, `created_at`, `updated_at` |

\* Opsional: bila kolom belum ada, frontend mencoba ulang insert/update tanpa kolom itu (`PGRST204`), jadi aplikasi tetap jalan sebelum migration diterapkan.

Kategori yang valid: `food, transportation, shopping, bills, entertainment, health, education, family, salary, gift, other` (`src/lib/finance/categories.js`).

**Progres tabungan:** `savings_goals.current_amount` adalah satu-satunya sumber kebenaran. Setor/tarik mengubah kolom itu langsung — tidak dicatat sebagai transaksi. Pembaruan memakai *optimistic concurrency*: `UPDATE … WHERE id = ? AND user_id = ? AND current_amount = <nilai yang dibaca>`; bila 0 baris, data dibaca ulang dan dicoba lagi (maks. 3 kali).

## Menerapkan migration

File: `supabase/migrations/20261020000000_simaung_core.sql` — idempoten & non-destruktif:

- membuat tabel/kolom/indeks hanya bila belum ada (tidak ada `DROP` tabel/kolom, tidak ada perubahan baris);
- kolom baru ditambahkan tanpa default dulu (baris lama = `NULL`), lalu default dipasang untuk baris baru;
- aturan data (`CHECK`) ditambahkan `NOT VALID`: berlaku untuk baris baru/diubah, baris lama dibiarkan;
- `user_id` mendapat default `auth.uid()`;
- trigger `simaung_on_auth_user_created` membuat baris profil untuk pengguna baru (fungsi `security definer`, `search_path=''`, `EXECUTE` dicabut dari klien);
- RLS diaktifkan; policy bernama `simaung_*` (dibuat ulang hanya bila namanya sama); hak `anon` dicabut dari tiga tabel keuangan.

Cara menerapkan (pilih satu):

```bash
# Supabase CLI, setelah `supabase link --project-ref <ref>`
supabase db push

# atau tempel isi file ke SQL Editor di dashboard Supabase
```

Sesudahnya jalankan **`supabase/scripts/audit_policies.sql`** (read-only). Policy RLS digabung dengan OR: policy lama seperti `USING (true)` tetap membuka data walau policy `simaung_*` sudah benar. Hapus policy semacam itu secara manual setelah ditinjau — migration sengaja tidak menghapus policy milik orang lain.

## Menguji RLS

`supabase/tests/rls_check.sql` membuat dua pengguna sintetis dalam satu transaksi lalu `ROLLBACK`. Jalankan **hanya** di database lokal/staging:

```bash
supabase start            # stack lokal (Docker)
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/tests/rls_check.sql
```

Yang diperiksa: profil dibuat trigger · A hanya melihat datanya · A tidak bisa membuat/memindahkan baris milik B · nominal negatif, jenis tak dikenal, dan progres negatif ditolak · B tidak bisa membaca/mengubah/menghapus data A · `anon` tidak punya akses. Hasil lokal: semua `PASS` di kedua skenario.

## Auth

- Pendaftaran mengirim `emailRedirectTo = <BASE_URL>dashboard`; reset kata sandi mengirim `redirectTo = <BASE_URL>reset-password`.
- Dashboard → Authentication → URL Configuration:
  - Site URL: `https://syamaydev.github.io/SI-MAUNG/`
  - Redirect URLs: `https://syamaydev.github.io/SI-MAUNG/**`, `http://localhost:5173/**`, `http://localhost:4173/SI-MAUNG/**`
- Halaman `/reset-password` menunggu sesi pemulihan dari tautan email (event `PASSWORD_RECOVERY`) lalu memanggil `updateUser({ password })`; tautan kedaluwarsa/invalid dijelaskan ke pengguna.
- Bila konfirmasi email aktif, pendaftaran menampilkan “cek email” (tidak ada sesi sampai dikonfirmasi).

## Edge Function `parse-transaction` (opsional)

Cadangan AI untuk kalimat yang tidak terbaca parser di perangkat. Kunci model hanya ada sebagai secret function.

```bash
supabase functions deploy parse-transaction          # verifikasi JWT aktif (bawaan)
supabase secrets set OPENAI_API_KEY=<isi di terminal, jangan di-commit>
supabase secrets set OPENAI_MODEL=gpt-4o-mini        # opsional
supabase secrets set ALLOWED_ORIGINS=https://syamaydev.github.io,http://localhost:5173
```

Lalu build frontend dengan `VITE_ENABLE_AI_PARSER=true`.

Perilaku: memeriksa pengguna (`auth.getUser()`), batas body 2 KB dan kalimat 300 karakter, rate limit 20/menit per pengguna (per instance, *best effort*), timeout 10 detik, `response_format: json_object`, validasi skema ketat; isi kalimat tidak di-log. Output selalu berupa draf yang divalidasi lagi di browser dan harus dikonfirmasi pengguna. **Belum di-deploy maupun diuji** karena tidak ada akses ke project.

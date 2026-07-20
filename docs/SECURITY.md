# SECURITY.md — Security & Privacy Governance

Landasan hukum: UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
Dokumen ini adalah checklist wajib, bukan opsional.

---

## 1. Prinsip Dasar

- **Privacy by default, bukan privacy by option.** Toggle cloud sync default
  OFF. User harus aktif memilih untuk berbagi data ke server, bukan
  sebaliknya.
- **Minimal data collection.** Hanya kumpulkan data yang benar-benar
  diperlukan untuk fitur yang sedang dikerjakan. Jangan menambah field
  "siapa tahu berguna nanti".
- **Client tidak pernah trust langsung untuk data sensitif** — lihat
  `ARCHITECTURE.md` §2.

---

## 2. Data Sensitif & LLM API Pihak Ketiga

- Data yang dikirim ke LLM API (Gemini/Claude) meninggalkan infrastruktur
  sendiri. Sebelum kirim:
  - Ganti nama asli dan kontak dengan placeholder jika tidak mengurangi
    kualitas output secara signifikan
  - Isi kembali data asli di layer backend sendiri saat compose dokumen
    final (PDF/Word)
- Cek data processing agreement/retention policy provider LLM yang dipakai —
  pastikan tidak ada retensi data untuk training tanpa opt-out yang jelas.

## 3. Prompt Injection Defense

- Sanitasi input sebelum masuk ke prompt: strip pola yang menyerupai
  instruksi override sistem
- Batasi panjang input per request
- Rate limit per user (lihat `ARCHITECTURE.md` §5) untuk mencegah abuse
  volumetrik

## 4. Encryption

- **In-transit:** HTTPS/TLS wajib di semua endpoint (default di Firebase/
  Vercel, tapi verifikasi tidak ada mixed content)
- **At-rest:** Firestore encrypt at-rest secara default; untuk field sangat
  sensitif (`rawUserInput`, `extractedData` di `cv_documents`), pertimbangkan
  field-level encryption tambahan dengan key terpisah (KMS)
- **Local storage:** data di device idealnya juga terenkripsi (mis.
  `expo-secure-store` untuk native, Web Crypto API untuk web) — supaya
  device hilang/dicuri tidak otomatis mengekspos data

## 5. Access Control

- Firestore Security Rules per-UID, bukan default open — lihat
  `SCHEMA.md` untuk kerangka rules dan catatan celah yang harus ditutup
- Field sensitif (quota, purchase status) tidak boleh writable langsung
  dari client — lihat catatan di `SCHEMA.md`
- Kalau ada admin panel di masa depan, role-based access wajib, tidak
  semua anggota tim akses raw user data

## 6. Hak Subjek Data (wajib disediakan di produk)

- **Hak hapus data (right to erasure):** tombol "hapus semua data saya"
  yang benar-benar hard-delete, termasuk propagasi ke backup, bukan
  soft-delete yang masih ter-query
- **Hak menarik consent:** matikan toggle cloud sync harus memberi opsi
  eksplisit untuk juga menghapus data yang sudah tersync, bukan hanya
  stop sync ke depan
- **Transparansi:** kebijakan privasi wajib bahasa awam, mencakup: identitas
  pengendali, tujuan pemrosesan, dasar hukum, kategori penerima data,
  periode retensi, hak subjek data, mekanisme keluhan

## 7. Audit Logging

- Setiap akses ke data sensitif dicatat di `audit_logs` (lihat `SCHEMA.md`) —
  bukan untuk surveillance user, tapi untuk investigasi jika ada dugaan
  breach dan untuk kebutuhan Record of Processing Activities (RoPA)

## 8. Retention & Deletion

- Tentukan retention period eksplisit (draft awal: auto-flag untuk review
  penghapusan setelah 12 bulan tidak diakses — angka final perlu ditinjau)
- Proses hapus akun harus mem-propagasi ke semua collection terkait
  (`cv_documents`, `documents`, `cv_analysis_results`, dst), bukan hanya
  dokumen `users`

## 9. Incident Response (minimum viable)

- Siapkan runbook sederhana: kontak yang harus dihubungi jika ada dugaan
  breach, cara cepat rotate API key/disable akun yang dicurigai
  disalahgunakan, dan kewajiban notifikasi ke user/otoritas dalam waktu
  yang wajar

## 10. Rate Limiting & Abuse Prevention

- Lihat `ARCHITECTURE.md` §5 dan §6 untuk detail teknis rate limit dan
  deteksi abuse — keduanya juga berfungsi sebagai proteksi cost dan
  proteksi data (mengurangi permukaan serangan scraping/spam)

---

## Checklist Sebelum Pilot Dibuka ke Publik

- [ ] HTTPS di semua endpoint
- [ ] Firestore Security Rules sudah ditutup celahnya (bukan kerangka
      awal di `SCHEMA.md`)
- [ ] Consent flow cloud sync sudah jelas dan default OFF
- [ ] Local-first storage berjalan sebagai default
- [ ] Rate limiting dasar aktif di semua endpoint generate
- [ ] Kebijakan privasi bahasa awam sudah tersedia dan dapat diakses user
- [ ] Cost alert Google Cloud Console sudah disetel
- [ ] Tombol hapus data berfungsi hard-delete

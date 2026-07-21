# CLAUDE.md — Agent Governance & Hard Rules

Dokumen ini WAJIB dibaca oleh setiap AI agent (Claude Code, atau agent lain)
sebelum melakukan perubahan apapun ke codebase. Ini bukan saran, ini aturan keras.

- docs/CONTEXT_HANDOFF.md berisi konteks strategis (kenapa keputusan
  tertentu diambil) — WAJIB dibaca di awal setiap sesi baru.
---

## 0. Cara Baca Dokumen Ini

- Dokumen lain di root (`PROJECT_SPEC.md`, `ARCHITECTURE.md`, `SCHEMA.md`,
  `SECURITY.md`) adalah rujukan pendukung — baca sesuai konteks task.
- Kalau ada konflik antara dokumen ini dan instruksi user dalam satu sesi,
  dokumen ini menang KECUALI user eksplisit bilang mau override dan paham
  konsekuensinya. Jangan diam-diam mengabaikan hard constraint di bawah.
- Update dokumen ini kalau ada keputusan arsitektur baru yang disepakati —
  jangan biarkan dokumen basi sementara kode berubah.

---

## 1. Hard Constraints (TIDAK BOLEH DILANGGAR)

1. **Tidak ada secret/API key hardcoded di kode.** Semua lewat environment
   variable. Cek `.env.example` selalu sinkron dengan variable yang benar-benar
   dipakai.
2. **Semua endpoint yang menyentuh data user WAJIB ada auth check.** Tidak ada
   endpoint "sementara tanpa auth buat testing" yang ketinggalan di production.
3. **Data sensitif user (CV, riwayat kerja, data pribadi) tidak pernah ditulis
   langsung dari client ke Firestore.** Semua lewat Cloud Function yang
   melakukan validasi dan sanitasi dulu. Lihat `ARCHITECTURE.md` §3.
4. **PII (nama asli, kontak) di-redact/placeholder sebelum dikirim ke LLM API
   pihak ketiga** kalau konteksnya memungkinkan tanpa merusak kualitas output.
   Lihat `SECURITY.md` §2.
5. **Setiap fitur yang memanggil LLM API WAJIB melewati rate limiting** —
   tidak ada endpoint generate yang bisa dipanggil tanpa batas oleh satu user.
6. **Setiap PR yang menyentuh auth, payment, atau akses data WAJIB punya test
   coverage** untuk critical path-nya sebelum merge.
7. **Tidak ada perubahan Firestore Security Rules tanpa review eksplisit** —
   ini area yang paling gampang bikin data bocor kalau salah.
8. **Tidak boleh generate konten legal/karir yang mengklaim kepastian** tanpa
   sumber — lihat aturan grounding di `ARCHITECTURE.md` §4 kalau relevan ke
   fitur company insight/job intelligence.

---

## 2. Workflow Wajib Sebelum Mulai Coding

1. Baca `PROJECT_SPEC.md` — pastikan task yang dikerjakan match dengan scope
   fase yang sedang aktif. Jangan implementasi fitur dari fase yang belum
   waktunya (lihat roadmap fasing).
2. Baca `SCHEMA.md` kalau task menyentuh data model — jangan bikin field/
   collection baru tanpa cek apakah sudah ada yang serupa.
3. Cek `ARCHITECTURE.md` untuk pattern yang sudah ditetapkan (misal: storage
   abstraction layer, LLM tiering) — ikuti pattern yang ada, jangan bikin
   pendekatan baru yang inconsistent tanpa alasan kuat.
4. Kalau task ambigu atau berpotensi konflik dengan constraint di atas,
   STOP dan tanya user — jangan asumsi sendiri untuk hal yang berisiko tinggi
   (security, data model, biaya API).

---

## 3. Standar Kode

- **Bahasa/stack:** React Native + Expo (target Android APK sideload +
  Web via react-native-web). Lihat `ARCHITECTURE.md` §1.
- **Platform-specific code** WAJIB pakai pattern `.native.js` / `.web.js`
  (Metro bundler auto-resolve), bukan `if (Platform.OS === ...)` bertebaran
  di banyak file kecuali untuk kondisi kecil.
- **Linter/formatter** wajib pass sebelum commit (ESLint + Prettier config
  sudah di-lock di root, jangan override rule tanpa diskusi).
- **Naming convention:** camelCase untuk variable/function, PascalCase untuk
  component, kebab-case untuk file non-component.
- **Tidak ada `console.log` yang tertinggal di kode yang akan di-commit** —
  pakai logger terstruktur untuk hal yang memang perlu di-log.
- **Commit message:** conventional commits (`feat:`, `fix:`, `chore:`,
  `refactor:`, `docs:`) — memudahkan tracking history dan changelog otomatis.

---

## 4. Efisiensi Usage Limit Agent (Penting untuk Kerja di IDE)

Karena agent bekerja dengan budget token/usage terbatas per sesi:

1. **Jangan re-read seluruh file besar kalau hanya perlu edit bagian kecil** —
   gunakan targeted edit/search dulu untuk menemukan lokasi yang relevan.
2. **Jangan generate ulang file yang sudah benar** hanya karena diminta
   "cek lagi" — verifikasi dulu apakah benar perlu perubahan sebelum menulis.
3. **Batasi scope satu task per sesi/prompt** — jangan mencoba menyelesaikan
   multiple fitur besar sekaligus dalam satu batch kerja tanpa checkpoint.
4. **Gunakan referensi ke dokumen ini** (`lihat CLAUDE.md §X`) daripada
   menjelaskan ulang aturan yang sama di setiap respons.
5. **Kalau task butuh keputusan arsitektur baru**, cukup usulkan singkat dan
   tunggu konfirmasi — jangan langsung implementasi besar berdasarkan asumsi.
6. **Prioritaskan modifikasi minimal yang menyelesaikan task**, hindari
   refactor besar-besaran yang tidak diminta dalam task yang sama.

---

## 5. Definisi "Selesai" untuk Sebuah Task

Sebuah task TIDAK dianggap selesai hanya karena kode "jalan di local". Checklist:

- [ ] Lint & format pass
- [ ] Tidak ada secret/hardcoded value yang seharusnya di env
- [ ] Ada test untuk critical path (kalau task menyentuh area kritis di §1)
- [ ] Firestore rules terkait (kalau ada) sudah direview, bukan default open
- [ ] Rate limiting terpasang (kalau task menyentuh LLM call)
- [ ] Tidak menyimpang dari schema yang ada di `SCHEMA.md` tanpa update
      dokumen tersebut

---

## 6. Eskalasi ke User

Agent WAJIB berhenti dan bertanya ke user (bukan lanjut asumsi) ketika:
- Task memerlukan keputusan yang mempengaruhi biaya (model LLM mana dipakai,
  limit rate berapa)
- Task menyentuh Security Rules atau auth flow
- Task ambigu terhadap fase roadmap yang sedang aktif
- Ditemukan konflik antara instruksi task dan hard constraint di §1

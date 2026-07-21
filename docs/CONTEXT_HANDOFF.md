# CONTEXT_HANDOFF.md — Konteks Strategis Project

Dokumen ini merangkum reasoning dan keputusan strategis dari sesi perencanaan
awal yang TIDAK sepenuhnya tercakup di `PROJECT_SPEC.md`, `ARCHITECTURE.md`,
`SCHEMA.md`, `SECURITY.md`, `WORKFLOW.md`. Baca ini untuk memahami KENAPA
keputusan tertentu diambil, bukan cuma APA keputusannya.

Mulai dari sini, seluruh diskusi strategi/planning project dilakukan dengan
agent di IDE, bukan lagi di chat eksternal. Dokumen ini adalah titik transisi.

---

## 1. Bagaimana Project Ini Sampai ke Bentuk Sekarang

Project awalnya digagas sebagai **legal-tech app** (bantu orang awam hukum
dapat advice legal + generate dokumen seperti surat somasi). Setelah
red-team analysis mendalam, ide itu di-**pivot total** karena beberapa alasan
fatal:

- Risiko liability tinggi (berpotensi masuk area "unauthorized practice of
  law")
- Moat teknis tipis — gampang ditiru begitu Google/Anthropic rilis agent
  serupa dengan distribusi jauh lebih besar
- Akurasi konten legal-tech buatan solo dev berisiko LEBIH BURUK dari AI
  generic (Claude/Gemini) yang sudah battle-tested, meski diklaim "grounded"
- Distribution problem belum tervalidasi

**Pivot ke Career Copilot** dipilih karena: TAM lebih besar, liability jauh
lebih rendah, ada domain expertise pemilik project di bidang terkait
(F&B/retail ops), dan ada segmen underserved yang jelas (blue-collar/
informal worker, bukan cuma corporate white-collar).

---

## 2. Kenapa "CV Generator Doang" TIDAK CUKUP (Analisis Kompetitif)

Riset menemukan market CV builder Indonesia sudah SANGAT crowded:
Kinobi, Resuma.id, SuratPlus, KitaLulus, Cake, Rezly, RZME — semua sudah
punya AI CV builder + ATS scoring + cover letter generator.

**Model bisnis kompetitor (hasil riset):**
- Kebanyakan freemium (gratis basic, premium subscription untuk fitur advance)
- Cake: Rp730.000/tahun (subscription)
- Kickresume: ~$25/bulan (subscription, mahal, target global)
- Resuma.id: token-based, Rp10.000–15.000 per paket (bukan subscription)
- Resmume: one-time payment, lifetime, diklaim termurah dibanding kompetitor
  lain — MODEL INI SUDAH ADA DUAN, bukan ide baru sepenuhnya
- DuckResume: 100% gratis, local-first, privacy-first — MODEL INI JUGA
  SUDAH ADA, mirip prinsip privacy yang project ini pakai
- Kinobi: freemium B2C + B2B ke career center kampus (revenue model paling
  matang — B2B, bukan cuma mengandalkan individual job seeker bayar)

**Kesimpulan strategis:** "AI generate CV" adalah commodity, BUKAN
diferensiasi. Diferensiasi harus datang dari:
1. Orchestration — mengumpulkan banyak step manual (yang biasanya butuh
   5-10 prompt manual ke ChatGPT/Gemini) jadi satu alur cepat
2. Segmen underserved (blue-collar/informal worker) yang belum dilayani
   optimal oleh kompetitor yang fokus corporate ATS
3. CV analyzer dengan actionable improvement plan, bukan skor kosong

---

## 3. Model Bisnis — Keputusan dan Alasan

**Keputusan: One-time lifetime purchase, harga rendah (kisaran Rp15.000–25.000,
BELUM FINAL), dengan rate limit generous berbasis minggu, bukan harian ketat.**

Alasan limit generous (bukan ketat harian seperti API subscription biasa):
CV generator punya usage pattern natural yang BURSTY lalu TAPERING OFF —
user aktif intens selama masa cari kerja (2-8 minggu), lalu dormant setelah
dapat kerja. Total lifetime cost per user secara alami ter-cap oleh durasi
job search mereka, TIDAK perlu rate limit seketat yang biasanya diterapkan
di app dengan usage harian konstan.

**Model donation-based DITOLAK** sebagai revenue utama — historically tidak
sustainable untuk consumer app (konversi <1%, tidak scalable seiring cost
naik). Bisa jadi tambahan opsional, bukan fondasi.

**Arah monetisasi jangka panjang yang dipertimbangkan (belum dieksekusi):**
B2B ke perusahaan/HR yang butuh talent pool terkurasi — mengikuti pola
Kinobi yang sukses dari B2B ke institusi, bukan cuma individual job seeker.

---

## 4. Anti-Abuse — Prinsip Penting yang Harus Diingat

Ada nuance penting yang HARUS dijaga saat implementasi deteksi abuse:
**"bantu teman/keluarga bikin CV sesekali" adalah perilaku SAH, bahkan
berpotensi jadi growth channel organik** (word-of-mouth). Sistem deteksi
abuse HANYA boleh menyasar pola skala komersial masif (reseller jasa CV),
BUKAN casual sharing.

Pembeda kuncinya BUKAN jumlah absolut, tapi kombinasi VOLUME + VELOCITY
(kecepatan dalam window waktu tertentu) + KONSISTENSI. Contoh: bantu 10
teman dalam 2 tahun = normal. Generate 15+ identitas berbeda dalam sebulan
= layak di-flag untuk soft intervention (bukan auto-ban).

Respons terhadap dugaan abuse harus BERTAHAP: flag → soft notice yang
ramah (dan menawarkan opsi B2B resmi, karena ini bisa jadi peluang revenue
baru, bukan cuma "masalah" yang harus ditutup) → baru eskalasi lebih jauh
dengan REVIEW MANUAL, bukan otomatis penuh.

---

## 5. Roadmap 5 Pilar dan Prinsip Fasing

Lihat `PROJECT_SPEC.md` §2-3 untuk detail. Prinsip pentingnya:
**WEDGE FIRST** — Pilar 1 (Document Generation, khususnya CV Analyzer +
ATS Scoring) harus solid dan defensible SENDIRI sebelum pilar lain
ditambahkan. Godaan untuk build "career copilot super app" dengan semua
5 pilar sekaligus dari awal SUDAH DIBAHAS dan DITOLAK secara eksplisit —
alasannya: effort maintenance naik non-linear, positioning jadi kabur,
dan superapp historically adalah hasil dari growth setelah wedge menang,
bukan starting point.

---

## 6. Platform & Distribusi — Alasan Keputusan

**Keputusan:** React Native + Expo + react-native-web (1 codebase, 2 output:
APK + web app), distribusi awal via sideload APK (GitHub Releases) +
web app paralel sebagai alternatif untuk user yang ragu install APK di
luar Play Store.

**Nuance penting:** Target akhir (blue-collar/awam tech) kemungkinan BELUM
familiar dengan konsep sideload APK — itu lebih merupakan kebiasaan
tech-savvy user. Realistisnya, fase sideload APK ini cocok untuk validasi
ke early adopter/circle developer dulu (fokus validasi teknis), BUKAN
langsung ke target audience akhir. Baru setelah confidence teknis cukup,
masuk Play Store untuk membuka ke target audience sebenarnya (di titik itu
friction install sudah hilang).

---

## 7. Status Implementasi Saat Ini (update manual setiap ada progress besar)

- [x] Repo git + struktur workspace awal
- [x] Expo project scaffold (React Native + react-native-web, terverifikasi
      jalan di web)
- [x] ESLint + Prettier strict, Husky pre-commit (lint block + secret
      scanner dengan whitelist mechanism)
- [x] GitHub Actions CI (lint, test, build-web)
- [x] Branch protection GitHub (`main`: PR + CI wajib, conversation resolution,
      admin enforcement, force-push/deletion dilarang)
- [x] Baseline unit test nyata; test suite tidak lagi lolos saat tidak ada test
- [ ] Struktur clean architecture untuk wedge (`presentation`, `application`,
      `infrastructure`) dan backend `functions/`
- [ ] Firebase project setup (dev/staging)
- [ ] Gemini API key
- [ ] Cloud Functions untuk pipeline generate (belum dimulai)
- [ ] Wedge fitur: CV Existing Analyzer + ATS Scoring (belum dimulai)

---

## 8. Keputusan yang Masih Terbuka / Belum Final

- Harga pasti one-time purchase (kisaran Rp15.000–25.000, perlu dikalibrasi
  dengan estimasi cost API real)
- Angka pasti rate limit (mingguan/bulanan) — perlu dikalibrasi dari data
  usage real setelah pilot, bukan angka final dari awal
- Apakah pakai Gemini API murni, atau kombinasi dengan Claude API untuk
  task tertentu yang butuh reasoning lebih ketat (mis. ATS scoring)
- Threshold pasti untuk anomaly detection anti-abuse (masih indikatif,
  lihat `ARCHITECTURE.md` §6)

---

## 9. Cara Pakai Dokumen Ini untuk Agent di IDE

Ketika mulai sesi baru dengan agent (Claude Code, Codex, atau lainnya):
1. Pastikan agent membaca `CLAUDE.md`, `docs/PROJECT_SPEC.md`, dan dokumen
   ini (`CONTEXT_HANDOFF.md`) di awal sesi
2. Untuk keputusan yang masuk kategori "masih terbuka" di §8, agent harus
   eskalasi ke pemilik project, TIDAK mengasumsikan sendiri
3. Update §7 (status implementasi) setiap kali ada milestone besar selesai,
   supaya dokumen ini tetap jadi sumber kebenaran yang akurat, bukan basi

# PROJECT_SPEC.md — Career Copilot App

## 1. Visi Produk

Career copilot berbasis AI yang mengorkestrasikan proses cari kerja dari awal
sampai akhir — bukan sekadar CV generator. Target: mengumpulkan banyak langkah
manual (riset perusahaan, tulis CV, tulis cover letter, kirim lamaran, follow
up, prep interview) menjadi satu alur yang jauh lebih cepat dan mudah
dibanding melakukan semuanya manual lewat AI generik (ChatGPT/Gemini/Claude).

**Target user utama:** Awam tech, termasuk segmen blue-collar/informal worker
yang kurang terlayani oleh kompetitor existing yang fokus ke corporate
white-collar ATS applicant.

**Prinsip inti produk:**
- Minimalism, fast-to-value, zero learning curve
- Orchestration value: hemat langkah dan waktu dibanding pakai AI generik
  manual — ini adalah alasan utama produk ini layak dipakai (lihat catatan
  kompetitif di §5)
- Local-first data, opt-in cloud sync
- Model bisnis: one-time lifetime purchase, harga rendah, dengan rate limit
  wajar (bukan subscription)

---

## 2. Struktur Fitur — 5 Pilar

| Pilar | Isi | Fase |
|---|---|---|
| **1. Document Generation & Optimization** | CV/cover letter generator, CV existing analyzer + ATS scoring, output PDF/Word | **Fase 1 (MVP)** |
| **2. Job Intelligence** | Job posting parser (link/screenshot/foto), gap analysis profil vs lowongan | Fase 3 |
| **3. Career Advisory** | Saran karir proaktif, skill gap insight | Fase 4 |
| **4. Outreach & Communication** | Draft email + deep link mail app, draft pesan WA + deep link | Fase 2 |
| **5. Interview & Negotiation Prep** | Mock interview, prep pertanyaan spesifik role | Fase 4/5 |

**Prinsip fasing: WEDGE FIRST.** Fase 1 harus solid dan defensible sendiri
sebelum pilar lain ditambahkan. Jangan implementasi lintas-fase secara
paralel kecuali sudah ada validasi bahwa fase sebelumnya bekerja.

---

## 3. Fase 1 — MVP Scope (Wedge)

**Wedge utama: CV Existing Analyzer + ATS Scoring.**
Alasan: paling defensible dibanding kompetitor (mereka umumnya kasih skor
tanpa improvement plan actionable yang spesifik), paling cepat divalidasi,
risiko rendah dibanding pilar lain.

**Termasuk dalam Fase 1:**
- Upload/paste CV existing → analisa + skor ATS + saran perbaikan konkret
- Generator CV dari nol (percakapan terstruktur, bukan form kaku)
- Generator cover letter
- Output PDF dan Word
- Auth: nomor HP + OTP
- Local-first storage + opt-in cloud sync
- One-time purchase (lifetime unlock) + rate limit generous berbasis usage
  pattern natural (lihat `ARCHITECTURE.md` §5 soal rate limiting)

**TIDAK termasuk Fase 1 (jangan dikerjakan agent tanpa instruksi eksplisit):**
- Job posting parser dari link/screenshot
- Company insight real-time
- Email/WA deep link generator
- Mock interview
- Career advisory proaktif
- Fitur sosial/sharing antar user

---

## 4. Platform & Distribusi

- **Stack:** React Native + Expo, dengan react-native-web untuk web app.
  1 codebase, 2 output (APK + web).
- **Distribusi awal:** APK sideload (GitHub Releases) + web app paralel
  sebagai alternatif untuk user yang ragu install APK di luar Play Store.
- **Rencana lanjutan:** submit ke Play Store setelah traksi awal positif.
  iOS menyusul dari codebase yang sama (minim rewrite karena RN cross-platform
  dari awal).
- Lihat `ARCHITECTURE.md` §1 untuk detail struktur project dan pattern
  platform-specific code.

---

## 5. Catatan Kompetitif (untuk konteks keputusan produk)

Market CV builder Indonesia sudah crowded (Kinobi, Resuma, SuratPlus, Cake,
Rezly, RZME) — semua freemium, semua fokus corporate white-collar ATS.
Diferensiasi produk ini BUKAN "AI yang lebih pintar" (itu commodity), tapi:

1. Orchestration — mengumpulkan banyak step manual jadi satu alur cepat
2. Segmen underserved — blue-collar/informal worker yang tidak dilayani
   optimal oleh kompetitor existing
3. CV analyzer dengan improvement plan actionable, bukan skor tanpa arah
4. Model bisnis lebih jujur (one-time, bukan subscription yang tetap
   kepotong walau user sudah dapat kerja)

**Reminder untuk agent:** Jangan implementasi fitur "karena kompetitor punya"
tanpa mengecek apakah itu align dengan fase aktif dan wedge di atas.

---

## 6. Model Bisnis Singkat (untuk konteks limit/quota)

- Free tier: quota terbatas, cukup untuk mencoba, tidak cukup untuk
  proses lamar kerja serius
- Lifetime (one-time payment, harga rendah): quota generous berbasis
  minggu/bulan, bukan harian ketat — karena usage pattern natural CV
  generator adalah bursty lalu tapering off (lihat `ARCHITECTURE.md` §5)
- Deteksi abuse (reseller jasa CV masif) berbasis velocity + jumlah
  identitas berbeda dalam window waktu, BUKAN block otomatis langsung —
  soft-intervention dulu (lihat `ARCHITECTURE.md` §6)

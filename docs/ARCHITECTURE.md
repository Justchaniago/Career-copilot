# ARCHITECTURE.md — Arsitektur Teknis

## 1. Platform & Struktur Project

```
Stack: React Native + Expo + react-native-web
Backend: Firebase (Auth, Firestore, Cloud Functions, Storage)
LLM: Gemini API (primary), Claude API (opsi/backup untuk task reasoning berat)
```

**Catatan versi:** Project ini menggunakan Expo SDK 57. Expo SDK sering
berubah signifikan antar versi (API, konfigurasi, package yang direkomendasikan).
Sebelum menulis kode yang menyentuh Expo API, cek dokumentasi versi yang sesuai
di `https://docs.expo.dev/versions/v57.0.0/` — jangan asumsikan behavior dari
versi SDK lain atau dari training data yang mungkin merujuk versi lebih lama.

Struktur folder yang wajib diikuti:
```
/app
  /src
    /domain             # entity/value object + repository contract murni
    /application        # use case; bergantung pada domain contract
    /infrastructure     # implementasi repository/API/storage/provider
    /presentation       # screen/component/hook; tidak akses Firebase langsung
    /components         # shared UI, jalan di web & native
    /screens             # shared screens
    /services
      /storage
        storage.web.js       # implementasi khusus web (IndexedDB)
        storage.native.js    # implementasi khusus native (SQLite/AsyncStorage)
        index.js              # entry point, Metro auto-resolve per platform
      /api                 # HTTP call ke Cloud Functions, shared
    /hooks
    /utils
functions/                 # Cloud Functions (backend logic)
  /src
    /llm                    # LLM call orchestration, model tiering
    /generation              # CV/cover letter generation logic
    /rateLimit                # quota check & enforcement
    /abuse                     # anomaly detection logic
app.json
eas.json                   # config build APK
```

Dependency direction wajib mengarah ke dalam:

```
presentation → application → domain
infrastructure ────────────→ domain
```

Application menerima repository melalui dependency injection. Pemilihan adapter
HTTP/Firebase/provider dilakukan di composition root, bukan di use case atau UI.

**Aturan platform-specific code:** gunakan ekstensi `.web.js` / `.native.js`
untuk implementasi berbeda per platform. Jangan menyebarkan
`if (Platform.OS === 'web')` di banyak file kecuali untuk percabangan kecil
yang tidak layak dipisah file.

---

## 2. Prinsip Data Flow — Client Tidak Pernah Trust Langsung ke Firestore untuk Data Sensitif

```
Client (RN app / web)
   → HANYA kirim raw input ke Cloud Function
   → TIDAK PERNAH menulis langsung ke collection yang berisi data hasil
     generate/analisa CV, atau collection quota/payment status
Cloud Function
   → validasi, sanitasi, rate limit check
   → panggil LLM
   → tulis hasil ke Firestore
   → return hasil ke client
```

Alasan: satu titik kontrol untuk validasi, sanitasi, dan logging sebelum
data sensitif masuk database — mencegah client yang dimodifikasi (misal lewat
proxy/reverse engineering APK) langsung menulis data sembarangan.

---

## 3. Pipeline Generate CV/Cover Letter/Analisa

```
1. Input sanitization
   - Strip pola yang menyerupai prompt injection
     ("ignore previous instructions", dsb)
   - Validasi panjang input

2. Rate limit check (lihat §5)
   - Cek quota user, reject dengan pesan jelas kalau exceeded

3. Cache check
   - Kalau input mirip request sebelumnya dari user yang sama, kembalikan
     cache, JANGAN panggil LLM ulang

4. Model tiering (lihat §4)
   - Extract data terstruktur: model kecil/murah
   - Generate konten final: model medium (kualitas bahasa penting di sini)
   - Validasi output: model kecil

5. PII handling sebelum ke LLM API pihak ketiga
   - Ganti nama asli/kontak dengan placeholder jika tidak mengurangi
     kualitas output secara signifikan
   - Isi kembali data asli di layer sendiri saat generate PDF final

6. Increment quota usage, log ke generation_logs

7. Return hasil ke client
```

---

## 4. Model Tiering — Efisiensi Biaya LLM

| Task | Tier Model | Alasan |
|---|---|---|
| Extract data dari input bebas (structuring) | Kecil/murah (mis. Gemini Flash) | Tugas ekstraksi, tidak butuh reasoning berat |
| Generate isi CV/cover letter final | Medium (mis. Gemini Pro) | Kualitas bahasa yang dirasakan user langsung |
| Validasi/QC output sebelum dikirim | Kecil/murah | Cek konsistensi, bukan generate baru |
| ATS scoring/analisa CV existing | Medium | Perlu reasoning untuk assessment kualitas |

**Aturan untuk agent:** jangan gunakan model tier tertinggi untuk semua step
secara default. Setiap penambahan LLM call baru harus eksplisit menentukan
tier mana yang dipakai dan kenapa.

**Prompt caching:** bagian system prompt yang statis (instruksi, format
template) harus memanfaatkan fitur prompt caching provider jika tersedia,
supaya hanya bagian dinamis (data user) yang recompute tiap request.

---

## 5. Rate Limiting & Quota

**Prinsip:** limit generous berbasis pattern usage natural (bursty saat aktif
cari kerja, lalu tapering off), BUKAN limit harian ketat gaya subscription
API. Detail limit final harus dikalibrasi dari data real setelah pilot,
bukan angka final di awal.

Struktur data quota — lihat `SCHEMA.md` §`users` dan §`usage_quota_config`.

**Wajib ada dari hari pertama:**
- Reject request yang exceed quota dengan pesan jelas ke user, bukan silent
  fail atau error generic
- Limit dikonfigurasi dari Firestore config collection, BUKAN hardcoded di
  kode — supaya bisa diadjust cepat tanpa deploy ulang kalau cost real
  berbeda dari estimasi

---

## 6. Anti-Abuse (Deteksi Reseller/Jasa Masif)

**Prinsip:** default percaya user. Sistem ini hanya untuk menangkap outlier
ekstrem (skala komersial masif), BUKAN untuk membatasi user yang sesekali
bantu teman/keluarga bikin CV — itu perilaku sah dan bahkan berpotensi jadi
growth channel organik.

```
Sinyal yang dipantau:
- distinctIdentityCount dalam window waktu (bukan lifetime total)
- Velocity: jumlah identitas berbeda per 30 hari
- Pattern waktu tidak wajar (generate beruntun interval sangat pendek,
  berkali-kali per hari berturut-turut)

Threshold indikatif (WAJIB dikalibrasi ulang dengan data real, ini bukan
angka final):
- 1-5 identitas berbeda dalam 30 hari → normal, tidak ada aksi
- 6-15 dalam 30 hari → soft flag, monitor saja, tidak ada notice ke user
- >15 dalam 30 hari → soft intervention (notice ramah, tawarkan opsi B2B/
  reseller resmi), BUKAN auto-block

Eskalasi HANYA setelah warning diabaikan dan pattern berlanjut, dan proses
final (restrict/terminate) harus melalui review manual, bukan otomatis
penuh.
```

Lihat `SCHEMA.md` §`users` untuk field terkait (`flaggedForReview`,
`reviewStatus`, dst).

---

## 7. Storage Strategy (Local-First + Opt-in Sync)

```
Local (default, semua user):
  - Web: IndexedDB
  - Native: SQLite / AsyncStorage (idealnya terenkripsi, mis.
    expo-secure-store untuk data sensitif)

Cloud Sync (opt-in, toggle default OFF):
  - Firestore, field-level encryption untuk field sensitif
  - Sync berjalan background setelah toggle diaktifkan
  - Matikan toggle = stop sync ke depan + opsi hapus data yang sudah
    tersync (bukan cuma stop sync, harus ada opsi hapus eksplisit)
```

Abstraksi storage HARUS lewat `services/storage` (lihat §1) supaya logic
bisnis di layer atas tidak perlu tahu implementasi platform di bawahnya.

---

## 8. Handling Traffic Spike

- Gunakan queue (Cloud Tasks) untuk request yang tidak butuh respons
  instan, hindari semua request langsung hit LLM API secara paralel tak
  terbatas
- Circuit breaker: kalau LLM API provider down/lambat, beri pesan jelas
  ke user, jangan biarkan request menggantung
- Cost alert di Google Cloud Console pada threshold tertentu (50%, 80%,
  100% budget bulanan) — WAJIB disetel sebelum pilot dibuka ke publik

---

## 9. PDF/Word Generation

- Template harus disiapkan sebagai struktur yang sebagian besar sudah
  fixed (bukan AI generate freeform layout tiap kali) — konsistensi hasil
  adalah bagian dari value produk
- LLM mengisi konten ke dalam template yang sudah divalidasi format
  ATS-friendly-nya, bukan menentukan layout dari nol setiap generate

# WORKFLOW.md — Development Workflow & CI/CD

## 1. Setup Wajib di Awal Project (sebelum fitur apapun dikerjakan)

1. Init repo dengan struktur sesuai `ARCHITECTURE.md` §1
2. Setup linter + formatter (ESLint + Prettier), rule strict bukan default
   longgar
3. Setup pre-commit hook (Husky):
   - Block commit kalau lint gagal
   - Block commit kalau terdeteksi ada secret/API key di diff
4. Setup GitHub Actions:
   - Job `lint` — jalan di setiap PR
   - Job `test` — jalan di setiap PR (boleh kosong di awal, tapi harus ada
     kerangkanya dari hari pertama)
   - Job `build` — verifikasi build tidak rusak (web build minimal, APK
     build bisa menyusul)
5. Branch protection di GitHub:
   - Tidak bisa push langsung ke `main`
   - PR wajib lulus CI sebelum merge

**Agent tidak boleh mulai mengerjakan fitur dari `PROJECT_SPEC.md` sebelum
5 poin di atas selesai**, kecuali user eksplisit minta skip untuk keperluan
eksplorasi cepat/prototype yang memang tidak akan lanjut ke production.

---

## 2. Branching & Commit

- `main` — selalu deployable
- `feature/*` — kerja fitur, merge via PR
- `fix/*` — perbaikan bug
- Commit message ikuti conventional commits (`feat:`, `fix:`, `chore:`,
  `refactor:`, `docs:`, `test:`)

## 3. Definisi Selesai Per PR

Lihat `CLAUDE.md` §5 untuk checklist detail. Ringkas:
- Lint pass, tidak ada secret ter-expose
- Test untuk critical path (auth, payment, akses data, LLM call dengan
  rate limit)
- Firestore rules terkait sudah direview kalau PR menyentuhnya
- Schema di `SCHEMA.md` diupdate kalau ada perubahan data model

## 4. Testing Strategy

- **Unit test:** logic murni (rate limit calculation, quota reset, data
  extraction/parsing) — prioritas tinggi karena murah dan cepat
- **Integration test:** flow Cloud Function end-to-end untuk critical path
  (generate CV, auth, quota enforcement)
- **Testing output LLM:** karena non-deterministic, fokus test ke
  structural correctness (apakah output punya field yang diharapkan, apakah
  ada citation/source kalau relevan) — BUKAN exact string matching pada isi
  yang digenerate

## 5. Environment

- `development` — untuk kerja lokal, boleh pakai Firebase emulator
- `staging` — untuk testing sebelum rilis, data terpisah dari production
- `production` — data user riil, akses terbatas

Jangan pernah testing fitur baru langsung di `production` project Firebase.

## 6. Release Process (APK sideload, lihat `PROJECT_SPEC.md` §4)

1. Build via `eas build --platform android`
2. Sign APK dengan keystore konsisten (jangan generate ulang keystore
   setiap release — akan merusak trust/update path)
3. Upload ke GitHub Releases dengan changelog jelas
4. Update endpoint version-check (untuk in-app update notice) supaya user
   existing tahu ada versi baru
5. Untuk perubahan yang tidak menyentuh native module: pertimbangkan Expo
   OTA update supaya user tidak perlu download ulang APK

## 7. Monitoring Pasca Rilis

- Error tracking (Sentry atau setara) wajib terpasang sebelum pilot
  dibuka ke publik
- Cost dashboard: pantau `generation_logs` secara berkala untuk melihat
  pola usage riil vs estimasi di `ARCHITECTURE.md` §5
- Review `flaggedForReview` users secara berkala (lihat `ARCHITECTURE.md`
  §6) — jangan biarkan menumpuk tanpa ditinjau

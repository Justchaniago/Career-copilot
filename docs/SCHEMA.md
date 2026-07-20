# SCHEMA.md — Firestore Data Model

Semua penambahan field/collection baru WAJIB diupdate di dokumen ini oleh
agent yang membuatnya. Jangan biarkan schema di kode dan dokumen ini
tidak sinkron.

---

## Collection: `users`

```
users/{uid}
  - phoneNumber: string
  - createdAt: timestamp
  - lastActiveAt: timestamp

  # Storage preference
  - cloudSyncEnabled: boolean            # default: false

  # Purchase & quota
  - purchaseStatus: "free" | "lifetime"
  - purchasedAt: timestamp | null
  - dailyGenerateCount: number
  - weeklyGenerateCount: number
  - lastGenerateAt: timestamp
  - lastResetDaily: timestamp
  - lastResetWeekly: timestamp
  - totalLifetimeGenerateCount: number

  # Anti-abuse
  - distinctIdentityCount: number
  - distinctIdentityTimestamps: array<timestamp>
  - flaggedForReview: boolean
  - flagReason: string | null
  - warningIssuedAt: timestamp | null
  - reviewStatus: "none" | "warned" | "restricted" | "terminated"
```

## Collection: `cv_documents` (data hasil generate, sensitif)

```
cv_documents/{docId}
  - userId: string
  - type: "cv" | "cover_letter" | "cv_analysis"
  - status: "draft" | "generated" | "finalized"
  - createdAt: timestamp
  - updatedAt: timestamp
  - storageLocation: "local" | "cloud"    # audit trail consent

  - rawUserInput: string                    # encrypted field-level jika
                                             # memungkinkan
  - extractedIdentityHash: string           # untuk deteksi identitas beda
                                             # (lihat ARCHITECTURE.md §6)
  - extractedData: map {
      nama, riwayatKerja, pendidikan, skill, dst
    }
  - generatedContent: string | map
  - promptVersion: string                   # untuk traceability jika
                                             # system prompt berubah
```

## Collection: `cv_analysis_results` (khusus fitur ATS scoring, Fase 1 wedge)

```
cv_analysis_results/{resultId}
  - userId: string
  - sourceDocId: string                     # ref ke cv_documents jika ada
  - atsScore: number
  - scoreBreakdown: map {
      formatting: number,
      keywordMatch: number,
      structureClarity: number,
      dst
    }
  - improvementSuggestions: array<{
      category: string,
      issue: string,
      suggestion: string,
      priority: "high" | "medium" | "low"
    }>
  - createdAt: timestamp
```

## Collection: `documents` (metadata file PDF/Word hasil generate)

```
documents/{documentId}
  - cvDocId: string
  - userId: string
  - format: "pdf" | "docx"
  - templateType: string
  - generatedAt: timestamp
  - storagePath: string                     # Firebase Storage path
```

## Collection: `generation_logs` (untuk cost monitoring & abuse detection)

```
generation_logs/{logId}
  - userId: string
  - type: "cv" | "cover_letter" | "cv_analysis"
  - modelUsed: string
  - tokensIn: number
  - tokensOut: number
  - estimatedCost: number
  - cacheHit: boolean
  - createdAt: timestamp
```

## Collection: `usage_quota_config` (config terpusat, bukan hardcode)

```
usage_quota_config/{tier}          # "free" | "lifetime"
  - dailyLimit: number | null
  - weeklyLimit: number
  - allowedFeatures: array<string>
```

## Collection: `audit_logs` (compliance UU PDP)

```
audit_logs/{logId}
  - userId: string
  - action: string   # "document_generated" | "data_synced" |
                      # "data_deleted" | "account_flagged" dst
  - timestamp: timestamp
  - metadata: map     # context tambahan, TANPA data sensitif mentah
```

---

## Firestore Security Rules — Kerangka

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, update: if request.auth != null
                           && request.auth.uid == userId
                           // TODO: batasi field yang boleh diupdate client
                           // (quota/purchaseStatus TIDAK boleh diupdate
                           // langsung dari client)
      allow create: if request.auth != null;
      allow delete: if false; // hapus akun via Cloud Function khusus
    }

    match /cv_documents/{docId} {
      allow read: if request.auth != null
                  && resource.data.userId == request.auth.uid;
      allow write: if false; // HANYA via Cloud Function
    }

    match /cv_analysis_results/{resultId} {
      allow read: if request.auth != null
                  && resource.data.userId == request.auth.uid;
      allow write: if false;
    }

    match /documents/{documentId} {
      allow read: if request.auth != null
                  && resource.data.userId == request.auth.uid;
      allow write: if false;
    }

    match /generation_logs/{logId} {
      allow read, write: if false; // admin/backend only
    }

    match /usage_quota_config/{tier} {
      allow read: if true;  // perlu dibaca client untuk tampilkan UI quota
      allow write: if false; // hanya diubah manual via console/admin tool
    }

    match /audit_logs/{logId} {
      allow read, write: if false;
    }
  }
}
```

**Catatan untuk agent:** field quota (`dailyGenerateCount`, `purchaseStatus`,
dst) di dalam `users/{uid}` TIDAK boleh bisa diupdate langsung oleh client
meskipun rule di atas mengizinkan `update` pada dokumen sendiri secara umum.
Perlu ditambahkan field-level restriction (misal via Cloud Function trigger
validasi, atau pisahkan field sensitif ke subcollection terpisah yang
write-nya `false` untuk client). Jangan deploy rules ini apa adanya tanpa
menutup celah ini — ini masih kerangka, bukan final.

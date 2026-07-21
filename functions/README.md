# Cloud Functions Backend

Folder ini adalah boundary backend Career Copilot. Pipeline CV Analyzer akan
ditempatkan di `functions/src` dengan pemisahan application, domain, dan
infrastructure yang sama seperti client.

Backend bertanggung jawab atas auth check, validasi dan sanitasi input, PII
redaction, rate limiting, pemanggilan provider LLM, validasi output, persistence,
dan audit logging. Client tidak boleh menggantikan tanggung jawab tersebut.

Milestone ini belum memilih provider LLM, membuat Firebase project, mengubah
Security Rules, atau menetapkan quota.

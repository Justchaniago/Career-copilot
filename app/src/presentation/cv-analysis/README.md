# CV Analysis Presentation Boundary

Layer ini hanya boleh berisi screen, component, hook, dan state tampilan CV
Analyzer. Presentation memanggil `AnalyzeCvUseCase`; presentation tidak boleh
mengakses Firebase, provider LLM, atau database secara langsung.

Implementasi UI belum dibuat pada milestone struktur ini agar flow produk tidak
dikunci sebelum kontrak output analyzer disepakati dan diuji.

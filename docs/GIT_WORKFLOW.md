# Git Workflow

## Model Branching
Trunk-based sederhana — cocok untuk proyek solo/portofolio tapi tetap rapi kalau ada kolaborator:

```
main            → selalu deployable
feature/*       → fitur baru
fix/*           → bug fix
chore/*         → maintenance, config, dependency bump
docs/*          → perubahan dokumentasi saja
```

Contoh: `feature/attendance-geolocation`, `fix/payroll-rounding-error`

## Alur Standar
```bash
git checkout main && git pull
git checkout -b feature/nama-fitur
# ... kerja ...
npm run lint && npm run test && npm run build   # wajib hijau sebelum push
git add .
git commit -m "feat(attendance): tambah validasi radius kantor"
git push origin feature/nama-fitur
# buka PR ke main
```

## Aturan Merge
- Squash merge ke `main` agar history bersih (1 fitur = 1 commit di main)
- PR wajib lolos CI (`lint`, `test`, `build`) sebelum bisa merge
- Untuk proyek portofolio solo, tetap disiplin pakai PR (bukan direct push ke `main`) — ini juga jadi bukti workflow profesional untuk reviewer/recruiter yang cek repo

## Tagging Rilis (opsional untuk demo)
```bash
git tag -a v0.1.0 -m "Initial HRIS demo release"
git push origin v0.1.0
```

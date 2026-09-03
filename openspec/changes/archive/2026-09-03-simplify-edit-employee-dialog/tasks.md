## 1. Bersihkan dialog edit dari field pribadi

- [x] 1.1 Hapus section "Data Pribadi" dari JSX — hapus blok `{isEdit && (<> ... </>)}` (baris 322-423 di `employee-dialog.tsx`) yang berisi header "Data Pribadi" dan field NIK, telepon, alamat, no. rekening, nama rekening
- [x] 1.2 Hapus field pribadi dari interface `FormValues` — hapus properti `status`, `nik`, `address`, `bank_account_number`, `bank_account_name`, `phone`
- [x] 1.3 Hapus field pribadi dari array `editableFields` — sisakan hanya `["full_name", "department_id", "position", "base_salary", "join_date"]`
- [x] 1.4 Hapus inisialisasi field pribadi dari initial state `useState<FormValues>` — hapus baris `status`, `nik`, `address`, `bank_account_number`, `bank_account_name`, `phone`
- [x] 1.5 Hapus spread field pribadi dari `doSubmit` edit mode — hapus baris `...(parsed.data.status ? ...)` sampai `...(parsed.data.phone ? ...)` (baris 118-127)

## 2. Verifikasi

- [x] 2.1 Jalankan `npm run lint --prefix client` — pastikan tidak ada error
- [x] 2.2 Jalankan `npm run typecheck --prefix client` — pastikan tidak ada type error

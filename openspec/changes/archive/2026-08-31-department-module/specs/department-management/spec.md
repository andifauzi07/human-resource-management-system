# Department Management

Delta spec untuk kapabilitas `department-management` pada change `department-module`.

## MODIFIED Requirements

### Requirement: Validasi manager department

Manager department boleh karyawan mana pun yang terdaftar, tidak harus menjadi anggota department yang sama. `manager_id` tetap opsional (boleh kosong dan boleh di-set/diubah kapan saja, termasuk saat create). Apabila `manager_id` diisi, sistem MUST menolak request bila: (a) karyawan dengan ID tersebut tidak ada, atau (b) status karyawan bukan `ACTIVE`. Penolakan mengembalikan 400 dengan pesan yang menjelaskan alasannya.

> **Catatan**: Perilaku lama pada main spec ("Manager ID optional (bisa di-set nanti)") diganti oleh requirement ini.

#### Scenario: Create dengan manager valid

- **WHEN** HRD membuat department dengan `manager_id` mengarah ke karyawan yang ada dan berstatus `ACTIVE`
- **THEN** department dibuat dan respons menyertakan `manager_id` serta `manager_name` hasil join

#### Scenario: Create dengan manager tidak ada

- **WHEN** HRD membuat department dengan `manager_id` yang tidak ditemukan di tabel employees
- **THEN** request ditolak 400 dan department tidak dibuat

#### Scenario: Update dengan manager nonaktif

- **WHEN** HRD mengubah `manager_id` department ke karyawan berstatus `INACTIVE`
- **THEN** request ditolak 400 dan `manager_id` department tidak berubah

#### Scenario: Manager dihapus dengan cara dikosongkan

- **WHEN** HRD mengosongkan `manager_id` (null/undefined) pada update
- **THEN** department tetap bisa di-update dan manager dianggap tidak ada

### Requirement: Respons department menyertakan nama manager

Seluruh respons yang mengandung data department (`POST /departments`, `GET /departments`, `GET /departments/:id`, `PATCH /departments/:id`) MUST menyertakan field `manager_name` di samping `manager_id`. `manager_name` adalah `full_name` dari karyawan yang menjadi manager (join ke tabel `employees`); bila tidak ada manager, `manager_name` bernilai `null`. Ketentuan ini berlaku untuk semua role termasuk STAFF.

#### Scenario: Memiliki manager

- **WHEN** klien memanggil `GET /departments` dan sebuah department memiliki manager
- **THEN** baris department berisi `manager_id` (UUID) dan `manager_name` (nama asli, bukan UUID)

#### Scenario: Tanpa manager

- **WHEN** department tidak memiliki manager
- **THEN** `manager_id` dan `manager_name` bernilai `null`

#### Scenario: Manager sebagai identitas, bukan UUID untuk STAFF

- **WHEN** STAFF memanggil `GET /departments/:id`
- **THEN** respons menampilkan nama manager yang bisa dipahami manusia, bukan UUID mentah
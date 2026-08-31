# Employee Management

Delta spec untuk kapabilitas `employee-management` pada change `department-module`.

## MODIFIED Requirements

### Requirement: Deaktivasi karyawan membersihkan referensi manager department

Saat HRD menonaktifkan karyawan (`DELETE /employees/:id`, soft delete status `ACTIVE` → `INACTIVE`), sistem MUST mengosongkan `departments.manager_id` di seluruh department yang masih menunjuk karyawan tersebut. Hal ini menjaga aturan "manager wajib berstatus ACTIVE". Data karyawan sendiri TIDAK BOLEH terpengaruh selain perubahan status.

> **Catatan**: Requirement ini menambah perilaku pada soft delete yang sudah ada di main spec.

#### Scenario: Manager nonaktif dibersihkan dari department

- **WHEN** karyawan yang menjadi manager sebuah department dinonaktifkan
- **THEN** `manager_id` department tersebut menjadi `null` (tidak lagi merujuk karyawan nonaktif)

#### Scenario: Karyawan non-manager tidak berdampak

- **WHEN** karyawan yang bukan manager department mana pun dinonaktifkan
- **THEN** tidak ada department yang berubah `manager_id`-nya

#### Scenario: Karyawan manager multiple department

- **WHEN** karyawan yang menjadi manager di lebih dari satu department dinonaktifkan
- **THEN** seluruh department yang merujuk karyawan itu `manager_id`-nya menjadi `null`
-- ============================================================
-- Seeder: Categories
-- User ID: 5b3498c8-be18-4d6c-ac77-874faad0f90c
-- ============================================================

INSERT INTO categories (id, user_id, name, type, created_at)
VALUES

  -- ── INCOME ──────────────────────────────────────────────
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Gaji',                  'income',     NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Bonus',                 'income',     NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Freelance',             'income',     NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Dividen',               'income',     NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Bunga Tabungan',        'income',     NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Pendapatan Lain-lain',  'income',     NOW()),

  -- ── EXPENSE ─────────────────────────────────────────────
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Makan & Minum',         'expense',    NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Transportasi',          'expense',    NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Belanja',               'expense',    NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Tagihan & Utilitas',    'expense',    NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Kesehatan',             'expense',    NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Pendidikan',            'expense',    NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Hiburan',               'expense',    NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Komunikasi',            'expense',    NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Sewa / Kos',            'expense',    NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Asuransi',              'expense',    NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Donasi & Sedekah',      'expense',    NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Perawatan Diri',        'expense',    NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Pengeluaran Lain-lain', 'expense',    NOW()),

  -- ── INVESTMENT ──────────────────────────────────────────
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Reksa Dana',            'investment', NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Saham',                 'investment', NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Kripto',                'investment', NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Emas',                  'investment', NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Deposito',              'investment', NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Obligasi',              'investment', NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Properti',              'investment', NOW()),
  (gen_random_uuid(), '5b3498c8-be18-4d6c-ac77-874faad0f90c', 'Investasi Lain-lain',   'investment', NOW())

ON CONFLICT DO NOTHING;

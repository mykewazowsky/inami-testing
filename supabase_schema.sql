-- ================================================================
-- INAMI Dashboard — Supabase Schema
-- Jalankan di Supabase Dashboard > SQL Editor
-- ================================================================

-- Tabel profiles (extend Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id        UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role      TEXT DEFAULT 'public' CHECK (role IN ('public', 'premium', 'mitra', 'admin')),
  wilayah   TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- User hanya bisa lihat & edit profilnya sendiri
CREATE POLICY "User read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "User update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Service role (backend) bisa akses semua
CREATE POLICY "Service role full access profiles"
  ON profiles FOR ALL USING (auth.role() = 'service_role');


-- Tabel payment_submissions
CREATE TABLE IF NOT EXISTS payment_submissions (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_name        TEXT,
  buyer_whatsapp    TEXT,
  buyer_email       TEXT,
  delivery_email    TEXT,
  sender_bank       TEXT,
  buyer_institution TEXT DEFAULT '',
  buyer_purpose     TEXT DEFAULT '',
  buyer_notes       TEXT DEFAULT '',
  location_name     TEXT,
  product_names     TEXT,
  total_items       INT DEFAULT 0,
  admin_fee         NUMERIC DEFAULT 0,
  total_payment     NUMERIC DEFAULT 0,
  verification_type TEXT DEFAULT 'bukti-transfer',
  uploaded_file_name TEXT,
  uploaded_file_path TEXT,
  status            TEXT DEFAULT 'pending_verification',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_submissions ENABLE ROW LEVEL SECURITY;

-- Hanya service role (backend) yang bisa insert/baca
CREATE POLICY "Service role full access payment_submissions"
  ON payment_submissions FOR ALL USING (auth.role() = 'service_role');

-- Admin bisa baca semua (via anon key + JWT check di frontend)
CREATE POLICY "Admin read payment_submissions"
  ON payment_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );


-- Tabel download_logs
CREATE TABLE IF NOT EXISTS download_logs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name    TEXT,
  user_email   TEXT,
  role         TEXT,
  wilayah      TEXT,
  location_name TEXT,
  dataset_type TEXT,
  ip_address   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access download_logs"
  ON download_logs FOR ALL USING (auth.role() = 'service_role');


-- Trigger: otomatis buat profile saat user baru signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, wilayah)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'public',
    ''
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

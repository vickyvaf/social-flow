# Panduan Setup Supabase untuk Social Flow

## Langkah 1: Setup Project Supabase

### A. Buat Project Baru (Jika Belum)

1. Buka https://supabase.com/dashboard
2. Klik "New Project"
3. Isi:
   - Project Name: `social-flow` (atau nama lain)
   - Database Password: Buat password yang kuat (SIMPAN!)
   - Region: Pilih yang terdekat (Singapore untuk Indonesia)
4. Klik "Create new project"
5. Tunggu ~2 menit project selesai dibuat

### B. Dapatkan API Keys

1. Di dashboard project, klik "Settings" (icon gear) di sidebar kiri bawah
2. Klik "API" di menu Settings
3. Copy 2 values ini:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### C. Update .env.local

Buat/update file `.env.local` di root project:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx...

# Gemini API (untuk AI generation)
GEMINI_API_KEY=your_gemini_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Server Wallet (untuk payment)
NEXT_PUBLIC_SERVER_WALLET_ADDRESS=your_wallet_address

# Optional: Viral Content APIs (bisa diisi nanti)
APIFY_API_TOKEN=
PHANTOMBUSTER_API_KEY=
PHANTOMBUSTER_INSTAGRAM_AGENT_ID=
PHANTOMBUSTER_LINKEDIN_AGENT_ID=
```

---

## Langkah 2: Jalankan Database Migrations

### A. Buka SQL Editor di Supabase

1. Di dashboard Supabase, klik "SQL Editor" di sidebar kiri
2. Klik "New query" atau gunakan editor yang ada

### B. Run Migration Files (URUTAN PENTING!)

#### 1️⃣ Extensions (jika belum ada)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

#### 2️⃣ Profiles Table

Copy dan run SQL dari: `supabase/migrations/20240122000002_profiles.sql`

Atau jalankan ini:

```sql
-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  wallet_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### 3️⃣ User Preferences Table (PENTING UNTUK FIX 401!)

Copy dan run SQL dari: `supabase/migrations/20260127000001_user_preferences.sql`

```sql
-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- User Profile & Brand Identity
  brand_name TEXT,
  niche TEXT,
  target_audience TEXT,
  brand_voice TEXT,
  tone TEXT,

  -- Content Preferences
  content_style TEXT,
  preferred_hashtags TEXT[],
  avoid_topics TEXT[],
  keywords TEXT[],

  -- Platform-Specific Settings
  platform_preferences JSONB DEFAULT '{}'::jsonb,

  -- Viral Content Settings
  fetch_viral_content BOOLEAN DEFAULT true,
  viral_content_sources TEXT[] DEFAULT ARRAY['twitter', 'instagram', 'linkedin'],
  viral_content_relevance INTEGER DEFAULT 7,

  -- AI Generation Settings
  creativity_level INTEGER DEFAULT 7,
  post_length TEXT DEFAULT 'medium',
  emoji_usage TEXT DEFAULT 'moderate',
  call_to_action_preference TEXT DEFAULT 'moderate',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Create index
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies (INI YANG PENTING UNTUK FIX 401!)
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_timestamp
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();
```

Klik "Run" untuk execute SQL tersebut.

---

## Langkah 3: Setup Authentication

### A. Enable Email Authentication

1. Di Supabase dashboard, klik "Authentication" di sidebar
2. Klik "Providers"
3. Pastikan "Email" provider sudah enabled (default enabled)

### B. Test Authentication di App

Sebelum test preferences, pastikan user sudah login:

**Opsi 1: Wallet Authentication**

- Connect wallet menggunakan Coinbase Wallet
- Sistem akan otomatis create profile di Supabase

**Opsi 2: Email Authentication (jika ada)**

- Login dengan email
- Sistem akan otomatis create session

---

## Langkah 4: Verifikasi Database

### A. Cek Tables Sudah Dibuat

1. Di Supabase dashboard, klik "Table Editor"
2. Pastikan tables ini ada:
   - ✅ `profiles`
   - ✅ `user_preferences`

### B. Cek RLS Policies

1. Klik table `user_preferences`
2. Klik tab "Policies"
3. Pastikan ada 4 policies:
   - ✅ Users can view own preferences (SELECT)
   - ✅ Users can insert own preferences (INSERT)
   - ✅ Users can update own preferences (UPDATE)
   - ✅ Users can delete own preferences (DELETE)

---

## Langkah 5: Test di Aplikasi

### A. Restart Development Server

```bash
# Stop server (Ctrl+C)
# Start lagi
npm run dev
```

### B. Test Flow

1. Buka http://localhost:3000
2. Connect wallet atau login
3. Modal onboarding akan muncul otomatis
4. Isi semua 4 langkah
5. Klik "Complete Setup"
6. Seharusnya berhasil (tidak ada error 401)

---

## 🚨 Troubleshooting Error 401

### Penyebab Umum:

1. **User belum authenticated** → Connect wallet dulu
2. **Migration belum dijalankan** → Run SQL migrations di atas
3. **RLS policies salah** → Cek policies di Table Editor
4. **Environment variables salah** → Cek `.env.local`

### Debug Steps:

#### 1. Cek Authentication Status

Buka Browser Console (F12), jalankan:

```javascript
console.log("User:", await supabase.auth.getUser());
```

Jika `user: null`, berarti belum login → connect wallet dulu.

#### 2. Cek Supabase Connection

```javascript
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
```

Jika `undefined`, environment variables belum loaded → restart server.

#### 3. Test Manual Insert

Di Supabase SQL Editor:

```sql
-- Lihat current authenticated user
SELECT auth.uid();

-- Test insert manual
INSERT INTO user_preferences (user_id, brand_name, niche)
VALUES (auth.uid(), 'Test Brand', 'Technology');
```

Jika error "permission denied", RLS policies belum jalan.

---

## 🔑 Solusi Quick untuk Error 401

Jika masih error 401, **sementara disable RLS** untuk testing:

```sql
-- HANYA UNTUK TESTING! JANGAN DI PRODUCTION!
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
```

Setelah berhasil, enable lagi:

```sql
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
```

---

## 📝 Checklist Final

- [ ] Project Supabase sudah dibuat
- [ ] API keys sudah di `.env.local`
- [ ] Migration `profiles` sudah dijalankan
- [ ] Migration `user_preferences` sudah dijalankan
- [ ] RLS policies sudah dibuat
- [ ] Development server sudah direstart
- [ ] User sudah connect wallet / login
- [ ] Onboarding modal muncul
- [ ] Preferences tersimpan tanpa error 401

---

## 🆘 Butuh Bantuan?

Jika masih ada masalah:

1. Screenshot error di browser console
2. Cek Supabase logs: Dashboard → Logs → API Logs
3. Share error message lengkap

**Common Issues:**

- "row level security policy violation" → RLS policies bermasalah
- "relation does not exist" → Migration belum dijalankan
- "authentication required" → User belum login
- "Invalid API key" → Environment variables salah

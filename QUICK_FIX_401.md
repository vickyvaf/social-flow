# 🚀 Quick Start - Fix Error 401

## Step 1: Setup Environment Variables (2 menit)

### Dapatkan Supabase Keys

1. Buka https://supabase.com/dashboard
2. Pilih/buat project Anda
3. Klik **Settings** (⚙️ icon di sidebar kiri bawah)
4. Klik **API**
5. Copy **3 values** ini:

```bash
# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# anon public (di bawah "Project API keys")
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...

# service_role (KLIK "Reveal" dulu, di bawah anon key)
# ⚠️ INI PENTING UNTUK FIX 401!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```

### Update .env.local

Buat file `.env.local` di root project (sejajar dengan package.json):

```bash
# Supabase (WAJIB!)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Gemini AI
GEMINI_API_KEY=your_gemini_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Wallet Address (untuk payment)
NEXT_PUBLIC_SERVER_WALLET_ADDRESS=0x...

# Optional: Apify for viral content (bisa diisi nanti)
APIFY_API_TOKEN=
```

---

## Step 2: Run Database Migration (3 menit)

### Di Supabase Dashboard:

1. Klik **SQL Editor** di sidebar kiri
2. Klik **New query**
3. **Copy-paste SQL ini dan RUN:**

```sql
-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  wallet_address TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 3. User Preferences Table (INI YANG PENTING!)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  brand_name TEXT,
  niche TEXT,
  target_audience TEXT,
  brand_voice TEXT DEFAULT 'Professional',
  tone TEXT DEFAULT 'Friendly',
  content_style TEXT DEFAULT 'Engaging',

  preferred_hashtags TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  avoid_topics TEXT[] DEFAULT '{}',

  platform_preferences JSONB DEFAULT '{}'::jsonb,

  fetch_viral_content BOOLEAN DEFAULT true,
  viral_content_sources TEXT[] DEFAULT ARRAY['twitter', 'instagram', 'linkedin'],
  viral_content_relevance INTEGER DEFAULT 7,

  creativity_level INTEGER DEFAULT 7,
  post_length TEXT DEFAULT 'medium',
  emoji_usage TEXT DEFAULT 'moderate',
  call_to_action_preference TEXT DEFAULT 'moderate',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own preferences" ON user_preferences FOR DELETE USING (auth.uid() = user_id);

-- Auto-update timestamp
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

4. Klik **RUN** (atau Ctrl+Enter)
5. Pastikan ada "Success" message

---

## Step 3: Restart Dev Server (1 menit)

```bash
# Stop server (Ctrl+C di terminal)

# Start lagi
npm run dev
```

---

## Step 4: Test (1 menit)

1. Buka http://localhost:3000
2. **Connect Wallet** (klik tombol Connect)
3. Modal onboarding akan muncul
4. Isi semua 4 langkah
5. Klik **Complete Setup**
6. ✅ Seharusnya **TIDAK ADA ERROR 401** lagi!

---

## ✅ Verifikasi Berhasil

### Cek di Supabase Dashboard:

1. Klik **Table Editor**
2. Klik table `user_preferences`
3. Seharusnya ada 1 row dengan data yang Anda isi

### Jika Masih Error 401:

#### Quick Debug:

1. Buka Browser Console (F12)
2. Cek error message lengkapnya
3. Apakah ada pesan:
   - "User authentication required" → Wallet belum connect
   - "Failed to save preferences" → Cek Supabase logs
   - "Invalid API key" → Cek .env.local

#### Cek Environment Variables Loaded:

Di browser console, run:

```javascript
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
```

Jika `undefined` → restart server belum dilakukan

#### Cek Supabase Logs:

1. Di Supabase Dashboard, klik **Logs**
2. Pilih **API** logs
3. Lihat error messages

---

## 🆘 Masih Bermasalah?

### Temporary Fix (untuk testing saja):

Jika masih 401, coba disable RLS sementara:

```sql
-- Di Supabase SQL Editor
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
```

Setelah berhasil test, enable lagi:

```sql
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
```

### Check Service Role Key:

Pastikan `SUPABASE_SERVICE_ROLE_KEY` di `.env.local` adalah **service_role** key (bukan anon key).

Service role key biasanya lebih panjang dan ada di Supabase Dashboard > Settings > API > service_role (klik "Reveal").

---

## 📝 Common Mistakes

❌ Menggunakan `anon` key untuk `SUPABASE_SERVICE_ROLE_KEY`
✅ Harus menggunakan `service_role` key yang secret

❌ Lupa restart server setelah update .env.local
✅ Selalu restart dengan Ctrl+C lalu `npm run dev`

❌ Migration tidak dijalankan
✅ Jalankan SQL di Supabase SQL Editor

❌ Wallet belum di-connect
✅ Klik tombol "Connect Wallet" dulu

---

Sekarang coba lagi! Error 401 seharusnya sudah hilang 🎉

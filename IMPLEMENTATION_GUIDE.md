# Social Flow - User Preferences & Viral Content Integration

## Fitur Baru yang Ditambahkan

### 1. **User Preferences & Onboarding**

Setiap user sekarang dapat menyimpan preferensi konten mereka di Supabase untuk personalisasi yang lebih baik.

#### Database Schema

- Tabel baru: `user_preferences`
- Migration: `supabase/migrations/20260127000001_user_preferences.sql`
- Menyimpan: brand identity, tone, keywords, hashtags, dll.

#### Onboarding Flow

- **Komponen**: `components/OnboardingModal.tsx`
- **4 Langkah**:
  1. Brand Identity (nama, niche, target audience)
  2. Voice & Tone (brand voice, tone, content style)
  3. Keywords & Topics (hashtags, keywords, topik yang dihindari)
  4. Generation Settings (creativity, emoji usage, CTA strength)

- **Trigger**: Otomatis muncul saat user pertama kali login dan belum punya preferences

### 2. **User Preferences Modal**

- **Komponen**: `components/UserPreferencesModal.tsx`
- User dapat mengubah preferensi kapan saja
- Akses melalui tombol "Preferences" di Header
- Tab-based UI untuk navigasi mudah

### 3. **Viral Content Integration**

#### API Routes

**`/api/viral-content`** - Fetch viral content dari Apify & PhantomBuster

- Mendukung multiple platforms: Twitter, Instagram, LinkedIn
- Returns: content, engagement metrics, author info

**`/api/user/config`** - Manage user preferences

- GET: Retrieve user preferences
- POST: Save/update preferences

#### Integrasi dengan LLM Generation

**`/api/generate`** - Enhanced dengan:

- Fetch user preferences dari Supabase
- Fetch viral content jika diaktifkan user
- Inject ke context LLM untuk hasil lebih personal dan viral

### 4. **Environment Variables Baru**

Tambahkan ke `.env.local`:

```bash
# Apify (untuk Twitter viral content)
APIFY_API_TOKEN=your_apify_token

# PhantomBuster (untuk Instagram, LinkedIn)
PHANTOMBUSTER_API_KEY=your_phantombuster_key
PHANTOMBUSTER_INSTAGRAM_AGENT_ID=agent_id
PHANTOMBUSTER_LINKEDIN_AGENT_ID=agent_id
```

## Setup Instructions

### 1. Run Migration

```bash
# Di Supabase Dashboard > SQL Editor
# Jalankan file: supabase/migrations/20260127000001_user_preferences.sql
```

### 2. Setup Apify (Optional tapi Recommended)

1. Buat akun di https://apify.com
2. Get API token dari https://console.apify.com/account/integrations
3. Tambahkan ke `.env.local`

### 3. Setup PhantomBuster (Optional)

1. Buat akun di https://phantombuster.com
2. Buat agent untuk Instagram & LinkedIn scraping
3. Get API key & agent IDs
4. Tambahkan ke `.env.local`

## Cara Kerja

### Flow untuk New User:

1. User login pertama kali
2. Sistem cek `user_preferences` table
3. Jika tidak ada → **Onboarding Modal** muncul
4. User isi 4 langkah onboarding
5. Preferences disimpan ke Supabase
6. Siap generate konten!

### Flow Generate Content:

1. User input prompt
2. **Sistem fetch**:
   - User preferences dari Supabase
   - Viral content (jika enabled) dari Apify/PhantomBuster
3. **LLM Context** diperkaya dengan:
   - Brand voice & tone user
   - Target audience
   - Keywords yang harus ditekankan
   - Contoh viral content sebagai inspirasi
4. Generate konten yang lebih personal & viral-worthy

### Update Preferences:

1. Klik tombol "Preferences" di Header
2. **UserPreferencesModal** terbuka
3. Edit di 4 tab berbeda
4. Save → otomatis update di Supabase

## Files Modified/Created

### New Files:

- `supabase/migrations/20260127000001_user_preferences.sql`
- `app/api/user/config/route.ts`
- `app/api/viral-content/route.ts`
- `components/OnboardingModal.tsx`
- `components/UserPreferencesModal.tsx`
- `.env.example`
- `IMPLEMENTATION_GUIDE.md`

### Modified Files:

- `app/api/generate/route.ts` - Added viral content & preferences integration
- `app/page.tsx` - Added onboarding & preferences modal
- `components/layout/Header.tsx` - Added preferences button

## Features Breakdown

### User Preferences Fields:

- **Brand Identity**: brand_name, niche, target_audience
- **Voice & Tone**: brand_voice, tone, content_style
- **Keywords**: preferred_hashtags, keywords, avoid_topics
- **Viral Content**: fetch_viral_content (toggle), viral_content_sources
- **Generation Settings**: creativity_level, post_length, emoji_usage, call_to_action_preference

### Viral Content Sources:

- **Apify**: Twitter/X trending tweets
- **PhantomBuster**: Instagram & LinkedIn viral posts
- Sorted by engagement (likes + shares + comments)

## Next Steps

### Untuk Production:

1. ✅ Run Supabase migration
2. ⚠️ Setup Apify & PhantomBuster accounts (optional tapi recommended)
3. ⚠️ Add API keys ke production environment
4. ✅ Test onboarding flow
5. ✅ Test viral content fetching
6. ⚠️ Monitor API costs (Apify & PhantomBuster ada free tier)

### Potential Improvements:

- [ ] Cache viral content untuk mengurangi API calls
- [ ] Background job untuk fetch viral content secara periodic
- [ ] Analytics untuk track preferences yang paling efektif
- [ ] A/B testing untuk viral content impact
- [ ] More viral content sources (TikTok, Reddit, etc.)

## Troubleshooting

### Onboarding tidak muncul:

- Check Supabase migration sudah dijalankan
- Check `user_preferences` table exists
- Check RLS policies di Supabase

### Viral content tidak fetch:

- Check API keys di `.env.local`
- Check user preferences `fetch_viral_content` = true
- Check Apify/PhantomBuster agent IDs valid

### Generation lambat:

- Viral content fetch bisa memakan waktu (10-15 detik)
- Consider implementing background jobs atau caching

## Support

Jika ada issue atau pertanyaan, check:

1. Supabase logs untuk database errors
2. Browser console untuk frontend errors
3. API route logs untuk backend errors

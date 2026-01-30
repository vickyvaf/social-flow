# Migration dari Credit System ke IDRX Payment System

## Overview

Sistem pembayaran telah diubah dari credit-based menjadi direct payment menggunakan IDRX stablecoin mock token di Base Sepolia.

## Perubahan Utama

### 1. Smart Contract Integration

- **Token**: IDRX Mock Stablecoin
- **Contract Address**: `0x2a575733e45f7b65dda6f1e8e501bcad125456d7`
- **Network**: Base Sepolia
- **Explorer**: https://sepolia.basescan.org/address/0x2a575733e45f7b65dda6f1e8e501bcad125456d7

### 2. File Baru

#### `/lib/contracts/idrx.ts`

- Konfigurasi contract IDRX
- ERC20 ABI untuk interact dengan token
- Pricing config (10 IDRX per generate)

#### `/hooks/useIDRX.ts`

- `useIDRXBalance()` - Read IDRX balance dengan tanstack-query caching
- `useIDRXAllowance()` - Read allowance untuk server wallet
- `useCanAffordGeneration()` - Helper untuk cek apakah user bisa afford generate

#### `/components/PaymentModal.tsx`

- Modal baru untuk payment flow
- Handle approve + transfer dalam 2 step
- Auto-record transaction ke database

#### `/components/FaucetModal.tsx`

- Modal untuk claim free IDRX (100 IDRX per claim)
- 24-hour cooldown period
- Testnet only untuk testing purposes

#### `/app/api/faucet/claim/route.ts`

- API endpoint untuk handle faucet claims
- Transfer IDRX from treasury wallet
- Record claims untuk enforce cooldown

#### `/supabase/migrations/20260127000000_remove_credits_system.sql`

- Drop credit-related RPC functions
- Update transactions table schema
- Mark credit tables sebagai deprecated

#### `/supabase/migrations/20260127000001_faucet_claims.sql`

- Create faucet_claims table
- Track claims dengan cooldown period
- Prevent abuse dengan rate limiting

### 3. File yang Diupdate

#### API Routes

- [app/api/post/route.ts](app/api/post/route.ts#L72-L87) - Removed credit check & deduction
- [app/api/user/profile/route.ts](app/api/user/profile/route.ts#L38-L60) - Removed credit fetching
- [app/api/generate/route.ts](app/api/generate/route.ts) - Already no credit logic

#### Components

- [components/user-auth-profile.tsx](components/user-auth-profile.tsx) - Show IDRX balance instead of credits
- [components/PaymentModal.tsx](components/PaymentModal.tsx) - NEW: Handle IDRX payments
- [app/page.tsx](app/page.tsx) - Trigger PaymentModal before generation
- [components/transactions/StatsCards.tsx](components/transactions/StatsCards.tsx) - Use IDRX balance & transactions
- [components/transactions/TransactionTable.tsx](components/transactions/TransactionTable.tsx) - Query from transactions table

### 4. Payment Flow

#### Before (Credit System):

1. User top-up ETH → get credits
2. Generate content → deduct 1 credit
3. Post content → deduct 1 credit

#### After (IDRX System):

1. User click "Generate"
2. System check IDRX balance & allowance
3. If insufficient allowance → approve IDRX spending
4. Transfer 10 IDRX to server wallet
5. Record transaction in database
6. Proceed with generation

### 5. Database Changes

#### Transactions Table

- Removed: `credits_granted` column
- Added: `description` column untuk purpose tracking
- Status: `success` | `pending` | `failed`

#### Deprecated Tables (kept for historical data)

- `user_credits`
- `credit_usage_logs`

### 6. Tanstack Query Integration

Semua contract reads menggunakan `useReadContract` dari wagmi yang sudah terintegrasi dengan tanstack-query:

- Auto caching
- Auto refetch setiap 10 detik
- Optimistic updates

## Testing Checklist

- [ ] Connect wallet di app
- [ ] Check IDRX balance tampil di header
- [ ] Click "FAUCET" button untuk claim free IDRX
- [ ] Faucet modal muncul dengan balance info
- [ ] Claim 100 IDRX successfully
- [ ] Balance updated after claim
- [ ] Try claim again → should show cooldown error (24 hours)
- [ ] Click generate content
- [ ] Payment modal muncul
- [ ] Approve IDRX (first time)
- [ ] Transfer IDRX payment
- [ ] Transaction recorded di database
- [ ] Content generated successfully
- [ ] Transaction tampil di /transactions page
- [ ] Stats cards show correct IDRX amounts

## Environment Variables Required

```env
NEXT_PUBLIC_SERVER_WALLET_ADDRESS=0x... # Wallet address untuk receive payments
NEXT_PUBLIC_ONCHAINKIT_API_KEY=... # Coinbase OnchainKit API key
TREASURY_PRIVATE_KEY=0x... # Private key dari wallet yang hold IDRX untuk faucet
```

## Migration Steps

1. Backup database (especially transactions table)
2. Run migrations in order:
   - `20260127000000_remove_credits_system.sql`
   - `20260127000001_faucet_claims.sql`
3. Fund treasury wallet dengan IDRX tokens
4. Set environment variable `TREASURY_PRIVATE_KEY`
5. Deploy updated code
6. Test faucet claim flow
7. Test payment flow end-to-end
8. Monitor transactions table for successful records

## Known Issues & TODOs

- [ ] Add proper error handling untuk insufficient IDRX balance
- [ ] Add notification jika user perlu top-up IDRX
- [x] ✅ IDRX faucet implemented dengan 24h cooldown
- [ ] Add transaction status polling untuk better UX
- [ ] Consider batch approvals untuk multiple operations

## IDRX Faucet

### Features

- **Amount**: 100 IDRX per claim
- **Cooldown**: 24 hours between claims
- **Network**: Base Sepolia only (testnet)
- **Access**: Click "FAUCET" button di header

### How It Works

1. User clicks FAUCET button
2. Modal shows current balance dan amount after claim
3. Click "Claim 100 IDRX"
4. Backend transfers from treasury wallet
5. Transaction recorded di faucet_claims table
6. Balance updates automatically

### Setup Treasury Wallet

1. Create atau use existing wallet untuk faucet
2. Fund wallet dengan IDRX tokens (recommended: 10,000+ IDRX)
3. Export private key
4. Add ke `.env.local`:
   ```
   TREASURY_PRIVATE_KEY=0xyour_private_key_here
   ```
5. **⚠️ SECURITY**: Never commit private key! Add to `.gitignore`

### Rate Limiting

- Database tracks claims per wallet address
- 24-hour cooldown enforced
- Prevents abuse dan excessive draining

## Support

Untuk mendapatkan IDRX token di Base Sepolia:

1. **✅ Faucet (Recommended)** - Click FAUCET button di app
2. **Manual Transfer** - Request dari treasury wallet owner
3. **Contract Interaction** - Jika contract memiliki public mint function

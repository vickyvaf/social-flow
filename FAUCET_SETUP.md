# IDRX Faucet Setup Guide

## Overview

Faucet untuk distribute free IDRX tokens kepada users untuk testing di Base Sepolia testnet.

## Features

- 🎁 **100 IDRX per claim**
- ⏱️ **24-hour cooldown** period
- 🔒 **Rate limiting** via database
- 🌐 **Base Sepolia only**

## Quick Setup

### 1. Create Treasury Wallet

```bash
# Option A: Use existing wallet
# Export private key dari Metamask/wallet lainnya

# Option B: Create new wallet using cast (Foundry)
cast wallet new

# Save the private key securely!
```

### 2. Fund Treasury Wallet

```bash
# You need IDRX tokens in the treasury wallet
# Recommended: 10,000+ IDRX untuk support multiple claims

# If you have mint permission on IDRX contract:
cast send 0x2a575733e45f7b65dda6f1e8e501bcad125456d7 \
  "mint(address,uint256)" \
  YOUR_TREASURY_ADDRESS \
  10000000000000000000000 \
  --rpc-url https://sepolia.base.org \
  --private-key YOUR_PRIVATE_KEY
```

### 3. Configure Environment Variables

```bash
# Add to .env.local
TREASURY_PRIVATE_KEY=0xyour_private_key_here

# Make sure it's in .gitignore!
echo ".env.local" >> .gitignore
```

### 4. Run Database Migration

```sql
-- Apply migration
psql your_database < supabase/migrations/20260127000001_faucet_claims.sql

-- Or via Supabase dashboard:
-- Copy-paste contents dari migration file
```

### 5. Test Faucet

1. Connect wallet ke app
2. Click "FAUCET" button di header
3. Modal muncul showing balance
4. Click "Claim 100 IDRX"
5. Wait for transaction
6. Balance updated!

## API Endpoint

### POST `/api/faucet/claim`

**Request:**

```json
{
  "address": "0x..."
}
```

**Success Response:**

```json
{
  "success": true,
  "txHash": "0x...",
  "amount": "100",
  "message": "Successfully claimed 100 IDRX!"
}
```

**Error Response (Cooldown):**

```json
{
  "error": "Please wait 12 hours before claiming again",
  "cooldownRemaining": 12
}
```

## Database Schema

### `faucet_claims` Table

```sql
- id: uuid (primary key)
- wallet_address: text
- amount: text
- token_symbol: text (default: 'IDRX')
- tx_hash: text
- claimed_at: timestamp
- created_at: timestamp
```

### Indexes

- `wallet_address` - For fast lookups
- `claimed_at DESC` - For cooldown checks

## Security Considerations

### ✅ DO

- Store private key in `.env.local` only
- Add `.env.local` to `.gitignore`
- Use separate wallet for faucet (not production wallet)
- Monitor treasury balance regularly
- Set reasonable cooldown period (24 hours)

### ❌ DON'T

- Never commit private key to git
- Never use production/mainnet wallet
- Never disable cooldown in production
- Never expose private key in client-side code

## Monitoring

### Check Treasury Balance

```bash
cast balance YOUR_TREASURY_ADDRESS \
  --rpc-url https://sepolia.base.org \
  --erc20 0x2a575733e45f7b65dda6f1e8e501bcad125456d7
```

### Check Recent Claims

```sql
SELECT
  wallet_address,
  amount,
  claimed_at,
  tx_hash
FROM faucet_claims
ORDER BY claimed_at DESC
LIMIT 10;
```

### Monitor Daily Usage

```sql
SELECT
  DATE(claimed_at) as claim_date,
  COUNT(*) as total_claims,
  SUM(amount::numeric) as total_distributed
FROM faucet_claims
GROUP BY DATE(claimed_at)
ORDER BY claim_date DESC;
```

## Troubleshooting

### Error: "failed to estimate gas" or "execution reverted"

**Penyebab Umum:**

1. **Cooldown Period Active** - User sudah claim dalam 24 jam terakhir
   - ✅ UI akan show countdown timer
   - ✅ Button disabled saat cooldown active
   - ✅ Wait hingga cooldown selesai

2. **Contract Cap Reached** - Total supply melebihi cap
   - ✅ Check `totalSupply()` vs `cap()` di contract
   - ✅ Owner perlu increase cap jika perlu

3. **Wrong Network** - User tidak di Base Sepolia
   - ✅ Pastikan wallet connected ke Base Sepolia testnet

### Error: "Faucet temporarily unavailable"

- ✅ Check `TREASURY_PRIVATE_KEY` is set in `.env.local`
- ✅ Restart Next.js dev server

### Error: "Insufficient funds"

- ✅ Check treasury wallet balance
- ✅ Fund wallet dengan more IDRX

### Error: "Please wait X hours before claiming again"

- ✅ This is normal - cooldown period active
- ✅ Wait for cooldown to expire

### Transaction pending forever

- ✅ Check Base Sepolia network status
- ✅ Increase gas limit jika perlu
- ✅ Check transaction on BaseScan

## Refilling Treasury

When treasury runs low (< 1000 IDRX):

```bash
# Option 1: Transfer from another wallet
cast send 0x2a575733e45f7b65dda6f1e8e501bcad125456d7 \
  "transfer(address,uint256)" \
  YOUR_TREASURY_ADDRESS \
  5000000000000000000000 \
  --rpc-url https://sepolia.base.org \
  --private-key YOUR_SOURCE_WALLET_KEY

# Option 2: Mint directly (if you have permission)
# See step 2 above
```

## Cost Analysis

### Per Claim Cost

- **Gas**: ~50,000 gas units
- **Gas Price**: ~0.001 gwei on Base Sepolia (free testnet)
- **IDRX Cost**: 100 IDRX (testnet, no real value)

### Monthly Estimates

- 100 users × 1 claim = 10,000 IDRX
- Recommended treasury: 20,000+ IDRX untuk 1 month

## Support

Questions or issues?

1. Check [MIGRATION_IDRX.md](MIGRATION_IDRX.md) for complete guide
2. Review error messages in console
3. Check BaseScan for transaction status
4. Verify treasury wallet balance

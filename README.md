# Social Flow

Social Flow is an AI-powered platform designed to streamline social media content generation and automated posting. It integrates on-chain payment mechanisms for premium features and content management.

## Preview

<img width="1440" height="787" alt="Screenshot 2026-01-22 at 15 03 45" src="https://github.com/user-attachments/assets/bee2625b-3612-43bf-b5ad-6b6cdcf8c493" />

## Key Features

- **🤖 AI Content Generation**: Leverage Google Gemini to create engaging, personalized posts
- **🎯 User Preferences System**: Customize brand voice, tone, keywords, and generation parameters
- **🎨 Enhanced Prompting**: Sophisticated prompt engineering with contextual guidance
- **📱 Multi-platform Support**: Currently supports Twitter and Threads
- **📊 Post Management**: Manage your drafts, scheduled, and published posts in one dashboard
- **🔗 Wallet Integration**: Connect with Coinbase Wallet for user authentication
- **💾 Supabase Backend**: Robust database with Row Level Security (RLS) policies

## ✨ New: Enhanced Prompting System

Social Flow now features an advanced AI prompting system that personalizes content based on your preferences:

### Brand Identity & Voice

- Define your brand name, niche, and target audience
- Choose from 6 brand voices (Professional, Casual, Humorous, Authoritative, Empathetic, Inspirational)
- Select tone (Friendly, Formal, Playful, Serious, Optimistic, Urgent)
- Pick content style (Engaging, Educational, Promotional, Storytelling, Conversational, Minimalist)

### Smart Generation Parameters

- **Creativity Level (1-10)**: From conservative to maximum creativity
- **Post Length**: Short (1-2 sentences), Medium (2-4), Long (4+)
- **Emoji Usage**: None, Minimal, Moderate, Heavy
- **CTA Style**: None, Soft, Moderate, Strong

### Strategic Content Controls

- Add keywords for natural integration
- Set preferred hashtags
- Define topics to avoid

For detailed documentation, see [ENHANCED_PROMPTING.md](ENHANCED_PROMPTING.md)

## Getting Started

First, install the dependencies:

```bash
bun install
```

Then, run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org)
- **Web3 Integration**: [Thirdweb SDK](https://thirdweb.com)
- **Styling**: Tailwind CSS
- **Runtime**: [Bun](https://bun.sh)

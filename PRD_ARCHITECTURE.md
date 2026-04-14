# Agentic AI Workflows for Solopreneurs - PRD & Architecture

## 1. Product Overview

**Product Name:** Agents Directory — Ready-to-Run Agentic AI Workflows for Solopreneurs
**Domain:** agents.wangdadi.xyz
**Tagline:** Discover, Compare & Copy Multi-Agent Systems Built for One-Person Businesses

**Target Users:** Solopreneurs, indie hackers, content creators in US/UK/AU (English-first)

**Core Value Proposition:** A curated directory of agentic AI workflows specifically designed for one-person businesses, with semantic search capabilities and easy-to-implement templates.

## 2. Core Features

### 2.1 User Features
- **Homepage:** Hero section, semantic search bar, featured tools, category grid
- **Directory Browse:** Filter by Category, No-Code/Code, Free/Paid, Tags
- **Tool Detail Pages:** JTBD use cases, prompt templates, "Tested by Real Solos" badges
- **Semantic Search:** Powered by Google Gemini Embedding (free tier) and pgvector
- **pSEO Dynamic Routes:** /best-agentic-ai-for-[slug] with rich metadata
- **Dark/Light Mode:** Mobile-first responsive design

### 2.2 Admin Features
- **Admin Dashboard:** Supabase Auth protected
- **CRUD Tools:** Create, read, update, delete tool listings
- **Submissions Moderation:** Review and approve user submissions
- **Auto-Embedding:** Generate embeddings on tool save using Google Gemini

### 2.3 Monetization Features
- **Featured Listings:** $49–$199 one-time payment
- **Premium Templates Pack:** $29–$99 one-time payment
- **PayPal Integration:** Smart Buttons for one-time payments
- **Order Management:** Store orders in Supabase
- **Webhook Verification:** Update "is_featured" status or grant access

## 3. Technical Architecture

### 3.1 Tech Stack
- **Frontend:** Next.js 15+ App Router (TypeScript, Tailwind CSS + shadcn/ui)
- **Backend:** Supabase (Auth, PostgreSQL with pgvector, RLS)
- **Deployment:** Vercel

### 3.2 Embedding Strategy
**Primary Free Embedding Provider:**
- **Google Gemini Embedding** (via Google AI Studio free tier, OpenAI-compatible)
- **Configuration:** `AI_EMBEDDING_PROVIDER="gemini"`
- **API Key:** `GEMINI_API_KEY` (from Google AI Studio)

**Fallback Options:**
1. **Cloudflare Workers AI** (@cf/baai/bge-m3)
2. **Hugging Face Inference** free tier

**Embedding Process:**
1. On tool save, generate embedding using Google Gemini
2. Store embedding in Supabase pgvector column
3. Use cosine similarity for semantic search

### 3.3 PayPal Integration
- **SDK:** @paypal/react-paypal-js
- **Environment:** Sandbox (development) and Production
- **Configuration:**
  - `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
  - `PAYPAL_SECRET` (for webhook verification)
- **Webhook:** `/api/paypal/webhook` for payment verification

### 3.4 Database Schema

#### `tools` Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `slug` | `text` | URL-friendly identifier |
| `name` | `text` | Tool name |
| `description` | `text` | Tool description |
| `category` | `text` | Tool category |
| `tags` | `text[]` | Array of tags |
| `pricing` | `text` | Pricing model |
| `features` | `jsonb` | Tool features |
| `prompt_templates` | `jsonb` | Prompt templates |
| `embedding` | `vector(768)` | Semantic embedding |
| `is_featured` | `boolean` | Featured status |
| `created_at` | `timestamp` | Creation time |
| `updated_at` | `timestamp` | Last update time |

#### `payments` Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `paypal_order_id` | `text` | PayPal order ID |
| `status` | `text` | Payment status |
| `item_type` | `text` | Type of item (featured_listing, premium_template) |
| `user_id` | `uuid` | User ID |
| `tool_id` | `uuid` | Tool ID (for featured listings) |
| `amount` | `numeric` | Payment amount |
| `created_at` | `timestamp` | Creation time |
| `updated_at` | `timestamp` | Last update time |

#### `categories` Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `name` | `text` | Category name |
| `slug` | `text` | URL-friendly identifier |
| `created_at` | `timestamp` | Creation time |

#### `submissions` Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `name` | `text` | Submitted tool name |
| `description` | `text` | Submitted tool description |
| `category` | `text` | Submitted category |
| `tags` | `text[]` | Submitted tags |
| `status` | `text` | Submission status (pending, approved, rejected) |
| `user_id` | `uuid` | Submitter user ID |
| `created_at` | `timestamp` | Creation time |
| `updated_at` | `timestamp` | Last update time |

### 3.5 API Routes
- `/api/auth/*` - Supabase Auth endpoints
- `/api/paypal/webhook` - PayPal webhook verification
- `/api/tools/*` - Tool management endpoints
- `/api/search` - Semantic search endpoint

### 3.6 pSEO Routes
- `/best-agentic-ai-for-[slug]` - Dynamic routes for category-specific pages

## 4. PayPal Integration Flow

1. **User selects a product** (Featured Listing or Premium Template Pack)
2. **PayPal Smart Buttons** rendered on product page
3. **User completes payment** via PayPal
4. **PayPal sends webhook** to `/api/paypal/webhook`
5. **Webhook verifies payment** and updates database
   - For Featured Listings: Set `is_featured` to `true` for the tool
   - For Premium Templates: Grant access to premium content
6. **User receives confirmation** and product access

## 5. Subdomain Handling

- **Main domain:** wangdadi.xyz
- **Application subdomain:** agents.wangdadi.xyz
- **Vercel configuration:** Set up custom domain with agents subdomain
- **DNS configuration:** Create A/CNAME records for agents.wangdadi.xyz

## 6. Security Considerations

- **Row Level Security (RLS):** Implement on all Supabase tables
- **Authentication:** Use Supabase Auth for admin access
- **HTTPS:** Enforce HTTPS for all requests
- **Input Validation:** Validate all user inputs
- **Rate Limiting:** Implement rate limiting on API endpoints
- **CORS:** Configure proper CORS settings
- **API Keys:** Store all API keys in environment variables, never hardcode

## 7. Performance Optimizations

- **Static Generation:** Generate static pages for frequently accessed content
- **Incremental Static Regeneration:** Update pages without full rebuild
- **Image Optimization:** Use Next.js Image component
- **Caching:** Implement client-side and server-side caching
- **Bundle Optimization:** Tree-shaking and code splitting

## 8. Development Plan

1. **Project Setup:** Initialize Next.js project with TypeScript and Tailwind CSS
2. **Supabase Configuration:** Set up project, database schema, and pgvector
3. **Authentication:** Implement Supabase Auth for admin access
4. **Admin Dashboard:** Build CRUD functionality for tools
5. **Public UI:** Develop homepage, directory browse, and tool detail pages
6. **Semantic Search:** Implement Google Gemini embedding generation and search functionality
7. **PayPal Integration:** Set up payment processing and webhooks
8. **pSEO Routes:** Create dynamic routes for SEO optimization
9. **Seed Data:** Add 50 tool listings with embeddings
10. **Testing and Deployment:** Test functionality and deploy to Vercel

## 9. Seed Data Categories

1. **Content Creation**
2. **Sales & Support**
3. **Research & Ops**
4. **Marketing**
5. **Frameworks**
6. **Niche Tools**

## 10. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Embedding
AI_EMBEDDING_PROVIDER=gemini
GEMINI_API_KEY=

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
PAYPAL_SECRET=
PAYPAL_WEBHOOK_ID=

# Vercel
NEXT_PUBLIC_APP_URL=https://agents.wangdadi.xyz
```

## 11. Vercel Deployment Configuration

- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Environment Variables:** Set all variables from .env.example
- **Custom Domain:** agents.wangdadi.xyz

## 12. DNS Configuration

1. **Create A record** for agents.wangdadi.xyz pointing to Vercel's IP addresses
2. **Create CNAME record** for www.agents.wangdadi.xyz pointing to agents.wangdadi.xyz
3. **Verify domain** in Vercel dashboard

## 13. Conclusion

This PRD and architecture document provides a comprehensive plan for building the Agentic AI Workflows for Solopreneurs directory. By following this plan, we can create a production-ready SaaS website that meets the needs of solopreneurs while staying within budget constraints through the use of Google Gemini's free tier and Supabase's free tier.
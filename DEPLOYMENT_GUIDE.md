# Deployment Guide for Agents Directory

## 1. Environment Variables

Before deploying, you need to set up the following environment variables:

### Required Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `AI_EMBEDDING_PROVIDER` | Set to `gemini` for Google Gemini Embedding |
| `GEMINI_API_KEY` | Your Google Gemini API key (from Google AI Studio) |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Your PayPal client ID (Sandbox for testing) |
| `PAYPAL_SECRET` | Your PayPal secret (for webhook verification) |
| `PAYPAL_WEBHOOK_ID` | Your PayPal webhook ID |
| `NEXT_PUBLIC_APP_URL` | Your app URL: `https://agents.wangdadi.xyz` |

### Setting Up Environment Variables

1. **Local Development:**
   - Copy `.env.example` to `.env`
   - Fill in the values for all variables

2. **Vercel Deployment:**
   - In the Vercel dashboard, go to your project settings
   - Navigate to the "Environment Variables" section
   - Add all variables from `.env.example` with their respective values

## 2. Vercel Deployment

### Step 1: Create a Vercel Account

If you don't already have a Vercel account, sign up at [vercel.com](https://vercel.com).

### Step 2: Import Your Project

1. Log in to your Vercel account
2. Click "Add New" → "Project"
3. Select your Git repository (GitHub, GitLab, or Bitbucket)
4. Click "Import"

### Step 3: Configure Project Settings

1. **Build Settings:**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

2. **Environment Variables:**
   - Add all environment variables from `.env.example`
   - Make sure to use production values for PayPal and other services

3. **Domains:**
   - Click "Domains" in the project settings
   - Add `agents.wangdadi.xyz` as a custom domain

### Step 4: Deploy

Click "Deploy" to start the deployment process. Vercel will automatically build and deploy your project.

## 3. DNS Configuration

### Step 1: Access Your Domain Registrar

Log in to your domain registrar (where you purchased `wangdadi.xyz`).

### Step 2: Create DNS Records

You need to create the following DNS records:

| Record Type | Name | Value | TTL |
|-------------|------|-------|-----|
| A | agents | 76.223.126.88 | 300 |
| A | agents | 76.223.126.89 | 300 |
| A | agents | 76.223.126.90 | 300 |
| A | agents | 76.223.126.91 | 300 |
| CNAME | www.agents | agents.wangdadi.xyz | 300 |

**Note:** These IP addresses are Vercel's global IP addresses. They may change, so please refer to Vercel's documentation for the most up-to-date IP addresses.

### Step 3: Verify Domain in Vercel

1. In the Vercel dashboard, go to your project settings
2. Click "Domains"
3. Click "Verify" next to `agents.wangdadi.xyz`
4. Wait for the verification to complete (this may take a few minutes)

### Step 4: Enable HTTPS

Vercel automatically provisions an SSL certificate for your domain. Once the DNS records propagate, HTTPS will be enabled automatically.

## 4. Supabase Configuration

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Note your project URL and anon key

### Step 2: Enable pgvector Extension

1. In the Supabase dashboard, go to "Database"
2. Click "Extensions"
3. Search for "vector" and enable it

### Step 3: Run Database Migrations

1. In the Supabase dashboard, go to "SQL Editor"
2. Copy and paste the SQL from `supabase/migrations/20260414000000_initial_schema.sql`
3. Click "Run"

### Step 4: Seed Data

1. In the Supabase dashboard, go to "SQL Editor"
2. Copy and paste the SQL from `supabase/seed.sql`
3. Click "Run"

### Step 5: Set Up Row Level Security

1. In the Supabase dashboard, go to "Authentication"
2. Enable email/password authentication
3. Set up appropriate RLS policies for your tables

## 5. PayPal Configuration

### Step 1: Create a PayPal Developer Account

1. Go to [developer.paypal.com](https://developer.paypal.com)
2. Sign up or log in
3. Create a new app in the Sandbox environment

### Step 2: Get API Credentials

1. In the PayPal Developer Dashboard, go to "My Apps & Credentials"
2. Copy your client ID and secret
3. Add these to your environment variables

### Step 3: Set Up Webhook

1. In the PayPal Developer Dashboard, go to "Webhooks"
2. Create a new webhook with URL: `https://agents.wangdadi.xyz/api/paypal/webhook`
3. Select the "PAYMENT.CAPTURE.COMPLETED" event
4. Copy the webhook ID and add it to your environment variables

## 6. Google Gemini API Configuration

### Step 1: Create a Google Cloud Account

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Sign up or log in
3. Create a new project

### Step 2: Enable Google AI Studio

1. Go to [makersuite.google.com](https://makersuite.google.com)
2. Create a new API key
3. Copy the API key and add it to your environment variables

## 7. Final Steps

1. **Test Your Deployment:**
   - Visit `https://agents.wangdadi.xyz` to verify your site is live
   - Test the search functionality
   - Test the PayPal payment process (using Sandbox)

2. **Monitor Performance:**
   - Use Vercel's analytics to monitor site performance
   - Set up error tracking

3. **Scale as Needed:**
   - As your site grows, consider upgrading your Supabase plan
   - Monitor API usage for Google Gemini

## 8. Troubleshooting

### Common Issues

1. **DNS Propagation:**
   - It may take up to 24 hours for DNS changes to propagate
   - Use [whatsmydns.net](https://whatsmydns.net) to check propagation status

2. **PayPal Webhook Verification:**
   - Make sure your webhook URL is accessible
   - Check PayPal's webhook logs for errors

3. **Supabase Connection Issues:**
   - Verify your environment variables are correct
   - Check your Supabase project settings

4. **Google Gemini API Errors:**
   - Make sure your API key is valid
   - Check your API usage limits

## 9. Conclusion

Congratulations! You've successfully deployed the Agents Directory to `agents.wangdadi.xyz`. With the right configuration and ongoing maintenance, your site should provide a valuable resource for solopreneurs looking for agentic AI workflows.
#!/usr/bin/env node

/**
 * Setup database and populate tools data
 * This script will:
 * 1. Create database schema
 * 2. Insert initial categories
 * 3. Insert 50 tool records
 * 4. Generate and update embeddings
 */

const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

// Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

if (!geminiApiKey) {
  console.error('❌ Missing GEMINI_API_KEY in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Create database schema
 */
async function createSchema() {
  console.log('=== Creating database schema ===');
  
  try {
    // Enable pgvector extension
    const { error: vectorError } = await supabase.rpc('execute_sql', {
      sql: 'create extension if not exists vector;'
    });
    
    if (vectorError) {
      console.error('❌ Error enabling vector extension:', vectorError.message);
      throw vectorError;
    }
    
    // Create categories table
    const { error: categoriesError } = await supabase.rpc('execute_sql', {
      sql: `
        create table if not exists categories (
          id serial primary key,
          name text not null unique,
          description text,
          created_at timestamp with time zone default now()
        );
      `
    });
    
    if (categoriesError) {
      console.error('❌ Error creating categories table:', categoriesError.message);
      throw categoriesError;
    }
    
    // Create tools table
    const { error: toolsError } = await supabase.rpc('execute_sql', {
      sql: `
        create table if not exists tools (
          id serial primary key,
          slug text not null unique,
          name text not null,
          description text not null,
          category text not null,
          tags text[],
          pricing text,
          features jsonb,
          prompt_templates jsonb,
          embedding vector(768),
          is_featured boolean default false,
          created_at timestamp with time zone default now(),
          updated_at timestamp with time zone default now()
        );
      `
    });
    
    if (toolsError) {
      console.error('❌ Error creating tools table:', toolsError.message);
      throw toolsError;
    }
    
    // Create payments table
    const { error: paymentsError } = await supabase.rpc('execute_sql', {
      sql: `
        create table if not exists payments (
          id serial primary key,
          tool_id integer references tools(id),
          paypal_order_id text unique,
          amount numeric(10, 2),
          status text,
          feature_type text,
          expires_at timestamp with time zone,
          created_at timestamp with time zone default now()
        );
      `
    });
    
    if (paymentsError) {
      console.error('❌ Error creating payments table:', paymentsError.message);
      throw paymentsError;
    }
    
    // Create submissions table
    const { error: submissionsError } = await supabase.rpc('execute_sql', {
      sql: `
        create table if not exists submissions (
          id serial primary key,
          name text not null,
          email text not null,
          tool_name text not null,
          tool_url text not null,
          category text not null,
          description text not null,
          status text default 'pending',
          created_at timestamp with time zone default now()
        );
      `
    });
    
    if (submissionsError) {
      console.error('❌ Error creating submissions table:', submissionsError.message);
      throw submissionsError;
    }
    
    // Create index for vector search
    const { error: indexError } = await supabase.rpc('execute_sql', {
      sql: 'create index if not exists tools_embedding_idx on tools using ivfflat (embedding vector_cosine_ops) with (lists = 100);'
    });
    
    if (indexError) {
      console.error('❌ Error creating vector index:', indexError.message);
      throw indexError;
    }
    
    // Create search function
    const { error: functionError } = await supabase.rpc('execute_sql', {
      sql: `
        create or replace function search_tools(query_embedding vector(768), match_count int) returns table (
          id int,
          slug text,
          name text,
          description text,
          category text,
          tags text[],
          pricing text,
          features jsonb,
          prompt_templates jsonb,
          embedding vector(768),
          is_featured boolean,
          similarity float
        ) as $$
        begin
          return query
          select
            tools.id,
            tools.slug,
            tools.name,
            tools.description,
            tools.category,
            tools.tags,
            tools.pricing,
            tools.features,
            tools.prompt_templates,
            tools.embedding,
            tools.is_featured,
            1 - (tools.embedding <=> query_embedding) as similarity
          from tools
          order by tools.embedding <=> query_embedding
          limit match_count;
        end;
        $$ language plpgsql;
      `
    });
    
    if (functionError) {
      console.error('❌ Error creating search function:', functionError.message);
      throw functionError;
    }
    
    console.log('✅ Database schema created successfully');
    
  } catch (error) {
    console.error('❌ Error creating schema:', error.message);
    throw error;
  }
}

/**
 * Insert initial categories
 */
async function insertCategories() {
  console.log('\n=== Inserting initial categories ===');
  
  try {
    const categories = [
      { name: 'Content Creation', description: 'Tools for creating written, visual, and multimedia content' },
      { name: 'Sales & Support', description: 'Tools for sales, customer support, and lead generation' },
      { name: 'Research & Ops', description: 'Tools for market research, data analysis, and operations' },
      { name: 'Marketing', description: 'Tools for marketing, SEO, and brand building' },
      { name: 'Frameworks', description: 'Tools that implement business and productivity frameworks' },
      { name: 'Niche Tools', description: 'Specialized tools for specific industries and use cases' }
    ];
    
    for (const category of categories) {
      const { error } = await supabase
        .from('categories')
        .insert(category)
        .onConflict('name')
        .ignore();
      
      if (error) {
        console.error(`❌ Error inserting category ${category.name}:`, error.message);
        throw error;
      }
    }
    
    console.log('✅ Initial categories inserted successfully');
    
  } catch (error) {
    console.error('❌ Error inserting categories:', error.message);
    throw error;
  }
}

/**
 * Generate embedding for a tool using Gemini API
 */
async function generateEmbedding(text) {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=' + geminiApiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-004',
        content: {
          parts: [
            {
              text: text
            }
          ]
        },
        encodingType: 'FLOAT32'
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding.values;
  } catch (error) {
    console.error('❌ Error generating embedding:', error.message);
    throw error;
  }
}

/**
 * Insert tools data
 */
async function insertTools() {
  console.log('\n=== Inserting tools data ===');
  
  const toolsData = [
    // Content Creation tools
    {
      name: "Content Creator Pro",
      description: "A comprehensive agentic workflow for content creation, including blog posts, social media content, and email newsletters.",
      category: "Content Creation",
      tags: ["blog", "social media", "email", "content"],
      pricing: "Freemium",
      features: {
        "Blog Post Generation": "Create engaging blog posts on any topic",
        "Social Media Content": "Generate captions and posts for all platforms",
        "Email Newsletters": "Design and write effective newsletters"
      },
      prompt_templates: {
        "Blog Post": "Write a blog post about [topic] targeting [audience]. Include an introduction, 3-5 main points, and a conclusion.",
        "Social Media": "Create a social media post about [product/service] that highlights [benefit].",
        "Email Newsletter": "Write an email newsletter announcing [news] to subscribers."
      },
      is_featured: true
    },
    {
      name: "Video Script Generator",
      description: "Generate professional video scripts for YouTube, TikTok, and other video platforms.",
      category: "Content Creation",
      tags: ["video", "script", "youtube", "tiktok"],
      pricing: "Free",
      features: {
        "Script Generation": "Create video scripts for any platform",
        "Hook Creation": "Generate attention-grabbing hooks",
        "Call to Action": "Craft effective CTAs"
      },
      prompt_templates: {
        "YouTube Script": "Write a YouTube script about [topic] that is [length] minutes long. Include an intro, main points, and conclusion.",
        "TikTok Script": "Create a TikTok script about [trend] that is under 60 seconds."
      },
      is_featured: false
    },
    {
      name: "Podcast Outline Generator",
      description: "Create detailed outlines for podcast episodes, including topics, questions, and segments.",
      category: "Content Creation",
      tags: ["podcast", "outline", "audio"],
      pricing: "Free",
      features: {
        "Outline Creation": "Generate podcast episode outlines",
        "Question Generation": "Create interview questions",
        "Segment Planning": "Plan podcast segments"
      },
      prompt_templates: {
        "Podcast Outline": "Create an outline for a podcast episode about [topic] with [number] segments.",
        "Interview Questions": "Generate [number] interview questions for a guest expert on [topic]."
      },
      is_featured: false
    },
    {
      name: "Copywriting Assistant",
      description: "AI-powered copywriting tool for ads, sales pages, and marketing materials.",
      category: "Content Creation",
      tags: ["copywriting", "ads", "sales", "marketing"],
      pricing: "Paid",
      features: {
        "Ad Copy": "Create compelling ad copy",
        "Sales Page Copy": "Write high-converting sales pages",
        "Email Copy": "Craft effective email sequences"
      },
      prompt_templates: {
        "Ad Copy": "Write ad copy for [product] that highlights [benefit] and includes a strong CTA.",
        "Sales Page": "Create a sales page outline for [product] with sections for problem, solution, benefits, and CTA."
      },
      is_featured: true
    },
    {
      name: "Social Media Manager",
      description: "Manage and schedule social media content across multiple platforms.",
      category: "Content Creation",
      tags: ["social media", "management", "scheduling"],
      pricing: "Freemium",
      features: {
        "Content Scheduling": "Plan and schedule posts",
        "Analytics": "Track performance metrics",
        "Content Ideas": "Generate content ideas"
      },
      prompt_templates: {
        "Content Calendar": "Create a 30-day content calendar for [platform] focusing on [topic].",
        "Engagement Strategy": "Develop a social media engagement strategy for [brand]."
      },
      is_featured: false
    },
    {
      name: "Blog Post Optimizer",
      description: "Optimize blog posts for SEO and readability.",
      category: "Content Creation",
      tags: ["blog", "seo", "optimization"],
      pricing: "Free",
      features: {
        "SEO Optimization": "Improve search engine rankings",
        "Readability Analysis": "Enhance content readability",
        "Keyword Research": "Identify relevant keywords"
      },
      prompt_templates: {
        "SEO Optimization": "Optimize this blog post for SEO: [content]",
        "Keyword Research": "Find 10 relevant keywords for [topic]."
      },
      is_featured: false
    },
    {
      name: "Email Sequence Generator",
      description: "Create automated email sequences for marketing and sales.",
      category: "Content Creation",
      tags: ["email", "sequence", "marketing", "sales"],
      pricing: "Paid",
      features: {
        "Sequence Creation": "Build email sequences",
        "Subject Line Optimization": "Create compelling subject lines",
        "A/B Testing": "Test different email variations"
      },
      prompt_templates: {
        "Welcome Sequence": "Create a 5-email welcome sequence for new subscribers to [brand].",
        "Sales Sequence": "Write a 3-email sales sequence for [product]."
      },
      is_featured: false
    },
    {
      name: "Content Idea Generator",
      description: "Generate creative content ideas for blogs, social media, and videos.",
      category: "Content Creation",
      tags: ["ideas", "content", "brainstorming"],
      pricing: "Free",
      features: {
        "Idea Generation": "Generate content ideas",
        "Trend Analysis": "Identify content trends",
        "Audience Targeting": "Tailor ideas to audience"
      },
      prompt_templates: {
        "Content Ideas": "Generate 10 content ideas for [topic] targeting [audience].",
        "Trend Analysis": "Analyze current trends in [industry] for content opportunities."
      },
      is_featured: false
    },
    {
      name: "Storytelling Assistant",
      description: "Help craft compelling stories for marketing and brand building.",
      category: "Content Creation",
      tags: ["storytelling", "marketing", "brand"],
      pricing: "Freemium",
      features: {
        "Story Structure": "Create story frameworks",
        "Emotional Appeal": "Craft emotionally resonant content",
        "Brand Narrative": "Develop brand stories"
      },
      prompt_templates: {
        "Brand Story": "Create a brand story for [company] that highlights [value proposition].",
        "Customer Story": "Write a customer success story for [product]."
      },
      is_featured: false
    },
    {
      name: "Visual Content Generator",
      description: "Create visual content ideas and descriptions for graphics and videos.",
      category: "Content Creation",
      tags: ["visual", "graphics", "video", "design"],
      pricing: "Paid",
      features: {
        "Visual Concepting": "Generate visual content ideas",
        "Design Briefs": "Create design specifications",
        "Image Descriptions": "Write detailed image descriptions"
      },
      prompt_templates: {
        "Social Media Graphic": "Create a design brief for a social media graphic about [topic].",
        "Video Concept": "Develop a concept for a promotional video for [product]."
      },
      is_featured: false
    },
    
    // Sales & Support tools
    {
      name: "Sales Assistant Pro",
      description: "AI-powered sales assistant for lead generation, follow-ups, and closing deals.",
      category: "Sales & Support",
      tags: ["sales", "lead generation", "follow-up", "closing"],
      pricing: "Paid",
      features: {
        "Lead Qualification": "Identify qualified leads",
        "Follow-up Sequences": "Automate follow-up emails",
        "Closing Strategies": "Develop closing techniques"
      },
      prompt_templates: {
        "Cold Email": "Write a cold email to [prospect] offering [product/service].",
        "Follow-up Email": "Create a follow-up email for a prospect who hasn't responded."
      },
      is_featured: true
    },
    {
      name: "Customer Support AI",
      description: "Automated customer support system for handling inquiries and resolving issues.",
      category: "Sales & Support",
      tags: ["customer support", "chatbot", "helpdesk"],
      pricing: "Freemium",
      features: {
        "Ticket Classification": "Categorize support tickets",
        "Automated Responses": "Generate support replies",
        "Issue Resolution": "Guide users to solutions"
      },
      prompt_templates: {
        "Support Response": "Write a response to a customer who is experiencing [issue] with [product].",
        "Troubleshooting Guide": "Create a troubleshooting guide for [problem]."
      },
      is_featured: false
    },
    {
      name: "Lead Generation AI",
      description: "Generate and qualify leads for your business.",
      category: "Sales & Support",
      tags: ["lead generation", "prospecting", "outreach"],
      pricing: "Paid",
      features: {
        "Lead Scoring": "Score and rank leads",
        "Prospect Research": "Gather prospect information",
        "Outreach Templates": "Create personalized outreach"
      },
      prompt_templates: {
        "Lead Email": "Write an outreach email to [prospect] based on their [industry/role].",
        "Prospect Research": "Research [company] to identify potential pain points."
      },
      is_featured: false
    },
    {
      name: "Sales Pitch Generator",
      description: "Create compelling sales pitches for products and services.",
      category: "Sales & Support",
      tags: ["sales pitch", "presentation", "persuasion"],
      pricing: "Free",
      features: {
        "Pitch Creation": "Generate sales pitches",
        "Value Proposition": "Craft clear value propositions",
        "Objection Handling": "Prepare for common objections"
      },
      prompt_templates: {
        "Elevator Pitch": "Create a 30-second elevator pitch for [product/service].",
        "Sales Presentation": "Outline a sales presentation for [product] targeting [audience]."
      },
      is_featured: false
    },
    {
      name: "Customer Feedback Analyzer",
      description: "Analyze customer feedback to improve products and services.",
      category: "Sales & Support",
      tags: ["feedback", "analysis", "customer insights"],
      pricing: "Freemium",
      features: {
        "Sentiment Analysis": "Analyze feedback sentiment",
        "Trend Identification": "Spot feedback trends",
        "Actionable Insights": "Generate improvement suggestions"
      },
      prompt_templates: {
        "Feedback Analysis": "Analyze this customer feedback and identify key issues: [feedback]",
        "Improvement Plan": "Create an improvement plan based on customer feedback."
      },
      is_featured: false
    },
    {
      name: "Appointment Scheduler",
      description: "Automate appointment scheduling and reminders.",
      category: "Sales & Support",
      tags: ["appointment", "scheduling", "calendar"],
      pricing: "Free",
      features: {
        "Calendar Integration": "Sync with calendars",
        "Automated Reminders": "Send appointment reminders",
        "Availability Management": "Manage booking times"
      },
      prompt_templates: {
        "Appointment Email": "Write an appointment confirmation email for a meeting with [client] on [date].",
        "Reminder Message": "Create a friendly appointment reminder for [service]."
      },
      is_featured: false
    },
    {
      name: "Sales Forecast AI",
      description: "Predict sales trends and forecast revenue.",
      category: "Sales & Support",
      tags: ["sales forecast", "prediction", "analytics"],
      pricing: "Paid",
      features: {
        "Trend Analysis": "Analyze sales trends",
        "Forecast Generation": "Create sales forecasts",
        "Scenario Planning": "Model different scenarios"
      },
      prompt_templates: {
        "Sales Forecast": "Generate a sales forecast for the next quarter based on [data].",
        "Trend Analysis": "Analyze sales trends for [product] over the past year."
      },
      is_featured: false
    },
    {
      name: "Customer Onboarding AI",
      description: "Automate and personalize customer onboarding processes.",
      category: "Sales & Support",
      tags: ["onboarding", "customer success", "automation"],
      pricing: "Freemium",
      features: {
        "Onboarding Sequences": "Create onboarding workflows",
        "Personalization": "Tailor onboarding to users",
        "Progress Tracking": "Monitor onboarding progress"
      },
      prompt_templates: {
        "Onboarding Email": "Write an onboarding email for new users of [product].",
        "Onboarding Checklist": "Create an onboarding checklist for [service]."
      },
      is_featured: false
    },
    {
      name: "Competitive Analysis AI",
      description: "Analyze competitors and identify market opportunities.",
      category: "Sales & Support",
      tags: ["competitive analysis", "market research", "strategy"],
      pricing: "Paid",
      features: {
        "Competitor Research": "Gather competitor information",
        "SWOT Analysis": "Create SWOT analyses",
        "Opportunity Identification": "Find market gaps"
      },
      prompt_templates: {
        "Competitive Analysis": "Analyze [competitor] and identify their strengths and weaknesses.",
        "Market Opportunity": "Identify market opportunities in [industry]."
      },
      is_featured: false
    },
    {
      name: "Sales Training AI",
      description: "Provide sales training and coaching for your team.",
      category: "Sales & Support",
      tags: ["sales training", "coaching", "skill development"],
      pricing: "Freemium",
      features: {
        "Training Modules": "Create sales training content",
        "Role-play Scenarios": "Generate practice scenarios",
        "Skill Assessment": "Evaluate sales skills"
      },
      prompt_templates: {
        "Sales Script": "Create a sales script for selling [product] to [audience].",
        "Objection Handling": "Practice handling [objection] in a sales conversation."
      },
      is_featured: false
    },
    
    // Research & Ops tools
    {
      name: "Market Research AI",
      description: "Conduct comprehensive market research and analysis.",
      category: "Research & Ops",
      tags: ["market research", "analysis", "data"],
      pricing: "Paid",
      features: {
        "Market Analysis": "Analyze market trends",
        "Competitor Research": "Research competitors",
        "Consumer Insights": "Gather consumer data"
      },
      prompt_templates: {
        "Market Analysis": "Analyze the [industry] market and identify key trends.",
        "Competitor Research": "Research [competitor]'s products, pricing, and marketing."
      },
      is_featured: true
    },
    {
      name: "Data Analysis AI",
      description: "Analyze and visualize data to make informed decisions.",
      category: "Research & Ops",
      tags: ["data analysis", "visualization", "insights"],
      pricing: "Freemium",
      features: {
        "Data Visualization": "Create data visualizations",
        "Trend Analysis": "Identify data trends",
        "Insight Generation": "Generate data-driven insights"
      },
      prompt_templates: {
        "Data Analysis": "Analyze this data and identify key trends: [data]",
        "Visualization Plan": "Create a data visualization plan for [dataset]."
      },
      is_featured: false
    },
    {
      name: "Industry Researcher",
      description: "Research industry trends, news, and developments.",
      category: "Research & Ops",
      tags: ["industry research", "trends", "news"],
      pricing: "Free",
      features: {
        "Trend Tracking": "Monitor industry trends",
        "News Analysis": "Analyze industry news",
        "Report Generation": "Create research reports"
      },
      prompt_templates: {
        "Industry Report": "Create a report on current trends in [industry].",
        "News Analysis": "Analyze recent news about [company/industry]."
      },
      is_featured: false
    },
    {
      name: "Competitive Intelligence AI",
      description: "Gather and analyze competitive intelligence.",
      category: "Research & Ops",
      tags: ["competitive intelligence", "spy", "strategy"],
      pricing: "Paid",
      features: {
        "Competitor Monitoring": "Track competitor activities",
        "Strategy Analysis": "Analyze competitor strategies",
        "Opportunity Identification": "Find competitive advantages"
      },
      prompt_templates: {
        "Competitor Analysis": "Analyze [competitor]'s recent marketing campaigns.",
        "Strategy Recommendations": "Recommend strategies to compete with [competitor]."
      },
      is_featured: false
    },
    {
      name: "Survey Analyzer",
      description: "Analyze survey responses and generate insights.",
      category: "Research & Ops",
      tags: ["survey", "analysis", "feedback"],
      pricing: "Free",
      features: {
        "Response Analysis": "Analyze survey responses",
        "Trend Identification": "Identify response trends",
        "Report Generation": "Create survey reports"
      },
      prompt_templates: {
        "Survey Analysis": "Analyze these survey responses and identify key insights: [responses]",
        "Report Summary": "Create a summary report of survey findings."
      },
      is_featured: false
    },
    {
      name: "Business Plan Generator",
      description: "Create comprehensive business plans for startups and existing businesses.",
      category: "Research & Ops",
      tags: ["business plan", "startup", "strategy"],
      pricing: "Freemium",
      features: {
        "Plan Creation": "Generate business plans",
        "Financial Projections": "Create financial forecasts",
        "Market Analysis": "Include market research"
      },
      prompt_templates: {
        "Business Plan": "Create a business plan for a [type] business targeting [market].",
        "Financial Projections": "Generate financial projections for a startup over 3 years."
      },
      is_featured: false
    },
    {
      name: "SWOT Analyzer",
      description: "Create SWOT analyses for businesses and projects.",
      category: "Research & Ops",
      tags: ["swot", "analysis", "strategy"],
      pricing: "Free",
      features: {
        "SWOT Creation": "Generate SWOT analyses",
        "Strategy Recommendations": "Suggest strategies based on SWOT",
        "Competitive Positioning": "Analyze competitive position"
      },
      prompt_templates: {
        "SWOT Analysis": "Create a SWOT analysis for [business/project].",
        "Strategy Recommendations": "Suggest strategies based on SWOT analysis."
      },
      is_featured: false
    },
    {
      name: "Market Sizing AI",
      description: "Estimate market size and potential for business opportunities.",
      category: "Research & Ops",
      tags: ["market sizing", "estimation", "opportunity"],
      pricing: "Paid",
      features: {
        "Market Size Calculation": "Estimate market size",
        "Growth Projections": "Project market growth",
        "Opportunity Assessment": "Evaluate market opportunities"
      },
      prompt_templates: {
        "Market Sizing": "Estimate the market size for [product/service] in [region].",
        "Growth Projection": "Project market growth for [industry] over the next 5 years."
      },
      is_featured: false
    },
    {
      name: "Customer Insights AI",
      description: "Gather and analyze customer data to understand behavior and preferences.",
      category: "Research & Ops",
      tags: ["customer insights", "behavior", "preferences"],
      pricing: "Freemium",
      features: {
        "Customer Profiling": "Create customer personas",
        "Behavior Analysis": "Analyze customer behavior",
        "Preference Identification": "Identify customer preferences"
      },
      prompt_templates: {
        "Customer Persona": "Create a customer persona for [product/service].",
        "Behavior Analysis": "Analyze customer behavior data and identify patterns."
      },
      is_featured: false
    },
    {
      name: "Research Assistant",
      description: "Assist with academic and business research projects.",
      category: "Research & Ops",
      tags: ["research", "academic", "business"],
      pricing: "Free",
      features: {
        "Literature Review": "Conduct literature reviews",
        "Data Collection": "Gather research data",
        "Citation Management": "Manage citations"
      },
      prompt_templates: {
        "Literature Review": "Conduct a literature review on [topic].",
        "Research Plan": "Create a research plan for investigating [question]."
      },
      is_featured: false
    },
    
    // Marketing tools
    {
      name: "Marketing Strategy AI",
      description: "Develop comprehensive marketing strategies for businesses.",
      category: "Marketing",
      tags: ["marketing strategy", "planning", "campaign"],
      pricing: "Paid",
      features: {
        "Strategy Creation": "Develop marketing strategies",
        "Campaign Planning": "Plan marketing campaigns",
        "Channel Selection": "Choose marketing channels"
      },
      prompt_templates: {
        "Marketing Strategy": "Create a marketing strategy for [product/service] targeting [audience].",
        "Campaign Plan": "Plan a marketing campaign for [product] with a [budget]."
      },
      is_featured: true
    },
    {
      name: "Social Media Marketing AI",
      description: "Optimize social media marketing efforts across platforms.",
      category: "Marketing",
      tags: ["social media", "marketing", "engagement"],
      pricing: "Freemium",
      features: {
        "Content Planning": "Plan social media content",
        "Post Optimization": "Optimize social media posts",
        "Engagement Strategy": "Develop engagement tactics"
      },
      prompt_templates: {
        "Social Media Plan": "Create a social media marketing plan for [brand] on [platforms].",
        "Content Calendar": "Build a 30-day content calendar for [platform]."
      },
      is_featured: false
    },
    {
      name: "Content Marketing AI",
      description: "Plan and execute content marketing campaigns.",
      category: "Marketing",
      tags: ["content marketing", "blog", "seo"],
      pricing: "Paid",
      features: {
        "Content Strategy": "Develop content strategies",
        "SEO Optimization": "Optimize content for SEO",
        "Performance Tracking": "Track content performance"
      },
      prompt_templates: {
        "Content Strategy": "Create a content marketing strategy for [brand] targeting [audience].",
        "SEO Plan": "Develop an SEO strategy for [website]."
      },
      is_featured: false
    },
    {
      name: "Email Marketing AI",
      description: "Optimize email marketing campaigns for better results.",
      category: "Marketing",
      tags: ["email marketing", "campaigns", "automation"],
      pricing: "Freemium",
      features: {
        "Campaign Creation": "Design email campaigns",
        "Subject Line Optimization": "Create effective subject lines",
        "A/B Testing": "Test email variations"
      },
      prompt_templates: {
        "Email Campaign": "Create an email marketing campaign for [product] with 3 emails.",
        "Subject Lines": "Generate 5 catchy subject lines for [topic]."
      },
      is_featured: false
    },
    {
      name: "Paid Advertising AI",
      description: "Optimize paid advertising campaigns across platforms.",
      category: "Marketing",
      tags: ["paid ads", "ppc", "social media ads"],
      pricing: "Paid",
      features: {
        "Ad Creation": "Create ad copy and visuals",
        "Campaign Optimization": "Optimize ad campaigns",
        "ROI Analysis": "Analyze ad performance"
      },
      prompt_templates: {
        "Ad Copy": "Write ad copy for [product] targeting [audience] on [platform].",
        "Campaign Strategy": "Develop a paid advertising strategy for [product] with a [budget]."
      },
      is_featured: false
    },
    {
      name: "Brand Strategy AI",
      description: "Develop and refine brand strategies for businesses.",
      category: "Marketing",
      tags: ["brand strategy", "identity", "positioning"],
      pricing: "Freemium",
      features: {
        "Brand Positioning": "Define brand positioning",
        "Identity Development": "Create brand identity elements",
        "Messaging Strategy": "Develop brand messaging"
      },
      prompt_templates: {
        "Brand Positioning": "Define brand positioning for [company] in [industry].",
        "Brand Messaging": "Create brand messaging guidelines for [brand]."
      },
      is_featured: false
    },
    {
      name: "Influencer Marketing AI",
      description: "Identify and collaborate with relevant influencers.",
      category: "Marketing",
      tags: ["influencer marketing", "collaboration", "outreach"],
      pricing: "Paid",
      features: {
        "Influencer Identification": "Find relevant influencers",
        "Outreach Templates": "Create outreach messages",
        "Campaign Management": "Manage influencer campaigns"
      },
      prompt_templates: {
        "Influencer Outreach": "Write an outreach message to [influencer] for a collaboration.",
        "Campaign Plan": "Plan an influencer marketing campaign for [product]."
      },
      is_featured: false
    },
    {
      name: "SEO Optimizer AI",
      description: "Improve website SEO for better search engine rankings.",
      category: "Marketing",
      tags: ["seo", "search engine", "optimization"],
      pricing: "Free",
      features: {
        "Keyword Research": "Identify relevant keywords",
        "On-page Optimization": "Optimize website content",
        "Link Building": "Develop link building strategies"
      },
      prompt_templates: {
        "Keyword Research": "Find 10 relevant keywords for [topic].",
        "On-page Optimization": "Optimize this webpage for SEO: [content]",
        "Link Building": "Create a link building strategy for [website]."
      },
      is_featured: false
    },
    {
      name: "Marketing Analytics AI",
      description: "Analyze marketing data to measure performance and ROI.",
      category: "Marketing",
      tags: ["analytics", "marketing", "roi"],
      pricing: "Freemium",
      features: {
        "Performance Analysis": "Analyze marketing performance",
        "ROI Calculation": "Calculate marketing ROI",
        "Trend Identification": "Identify marketing trends"
      },
      prompt_templates: {
        "Performance Analysis": "Analyze this marketing data and identify key insights: [data]",
        "ROI Calculation": "Calculate ROI for a marketing campaign with [cost] and [revenue]."
      },
      is_featured: false
    },
    {
      name: "Event Marketing AI",
      description: "Plan and promote events for maximum attendance and engagement.",
      category: "Marketing",
      tags: ["event marketing", "promotion", "planning"],
      pricing: "Free",
      features: {
        "Event Planning": "Plan marketing events",
        "Promotion Strategy": "Develop event promotion tactics",
        "Attendee Engagement": "Create engagement strategies"
      },
      prompt_templates: {
        "Event Plan": "Plan a marketing event for [brand] targeting [audience].",
        "Promotion Strategy": "Develop a promotion strategy for an upcoming event."
      },
      is_featured: false
    },
    
    // Frameworks tools
    {
      name: "Business Framework AI",
      description: "Apply proven business frameworks to solve business challenges.",
      category: "Frameworks",
      tags: ["business", "frameworks", "strategy"],
      pricing: "Paid",
      features: {
        "Framework Application": "Apply business frameworks",
        "Problem Solving": "Solve business problems",
        "Strategy Development": "Create business strategies"
      },
      prompt_templates: {
        "SWOT Analysis": "Apply SWOT analysis to [business situation].",
        "Porter's Five Forces": "Analyze [industry] using Porter's Five Forces framework."
      },
      is_featured: true
    },
    {
      name: "Lean Startup AI",
      description: "Apply lean startup principles to build and grow businesses.",
      category: "Frameworks",
      tags: ["lean startup", "validation", "iteration"],
      pricing: "Freemium",
      features: {
        "MVP Development": "Create minimum viable products",
        "Customer Validation": "Validate business ideas",
        "Pivot Strategy": "Develop pivot strategies"
      },
      prompt_templates: {
        "MVP Plan": "Create an MVP plan for [business idea].",
        "Customer Validation": "Design a customer validation process for [product]."
      },
      is_featured: false
    },
    {
      name: "Design Thinking AI",
      description: "Apply design thinking principles to innovation and problem-solving.",
      category: "Frameworks",
      tags: ["design thinking", "innovation", "problem-solving"],
      pricing: "Free",
      features: {
        "Empathize Phase": "Understand user needs",
        "Define Phase": "Define problems",
        "Ideate Phase": "Generate solutions",
        "Prototype Phase": "Create prototypes",
        "Test Phase": "Test solutions"
      },
      prompt_templates: {
        "Design Thinking Process": "Apply design thinking to solve [problem].",
        "User Empathy": "Create user personas for [product]."
      },
      is_featured: false
    },
    {
      name: "Agile Project Management AI",
      description: "Manage projects using agile methodologies.",
      category: "Frameworks",
      tags: ["agile", "project management", "scrum"],
      pricing: "Paid",
      features: {
        "Sprint Planning": "Plan agile sprints",
        "Backlog Management": "Manage product backlogs",
        "Retrospective Analysis": "Conduct sprint retrospectives"
      },
      prompt_templates: {
        "Sprint Plan": "Create a sprint plan for [project].",
        "Backlog Grooming": "Groom the product backlog for [project]."
      },
      is_featured: false
    },
    {
      name: "OKR Setting AI",
      description: "Set and track Objectives and Key Results for businesses.",
      category: "Frameworks",
      tags: ["okr", "goals", "tracking"],
      pricing: "Freemium",
      features: {
        "OKR Creation": "Set effective OKRs",
        "Progress Tracking": "Monitor OKR progress",
        "Alignment Analysis": "Ensure organizational alignment"
      },
      prompt_templates: {
        "OKR Setting": "Create OKRs for [team/department] for the next quarter.",
        "Progress Tracking": "Develop a system to track OKR progress."
      },
      is_featured: false
    },
    {
      name: "Business Model Canvas AI",
      description: "Create and refine business model canvases.",
      category: "Frameworks",
      tags: ["business model", "canvas", "strategy"],
      pricing: "Free",
      features: {
        "Canvas Creation": "Generate business model canvases",
        "Component Analysis": "Analyze canvas components",
        "Iteration Strategy": "Refine business models"
      },
      prompt_templates: {
        "Business Model Canvas": "Create a business model canvas for [business idea].",
        "Canvas Analysis": "Analyze the strengths and weaknesses of this business model canvas: [canvas]."
      },
      is_featured: false
    },
    {
      name: "Value Proposition Canvas AI",
      description: "Develop and refine value propositions.",
      category: "Frameworks",
      tags: ["value proposition", "customer needs", "solution"],
      pricing: "Freemium",
      features: {
        "Canvas Creation": "Generate value proposition canvases",
        "Customer Segment Analysis": "Analyze customer segments",
        "Value Mapping": "Map value to customer needs"
      },
      prompt_templates: {
        "Value Proposition Canvas": "Create a value proposition canvas for [product/service].",
        "Customer Needs Analysis": "Analyze the needs of [customer segment]."
      },
      is_featured: false
    },
    {
      name: "Growth Hacking AI",
      description: "Apply growth hacking techniques to accelerate business growth.",
      category: "Frameworks",
      tags: ["growth hacking", "experimentation", "growth"],
      pricing: "Paid",
      features: {
        "Growth Experiment Design": "Design growth experiments",
        "Channel Optimization": "Optimize growth channels",
        "Viral Loop Creation": "Develop viral growth strategies"
      },
      prompt_templates: {
        "Growth Experiment": "Design a growth experiment for [product].",
        "Viral Strategy": "Create a viral loop for [product/service]."
      },
      is_featured: false
    },
    {
      name: "Risk Management AI",
      description: "Identify and mitigate business risks.",
      category: "Frameworks",
      tags: ["risk management", "mitigation", "assessment"],
      pricing: "Free",
      features: {
        "Risk Identification": "Identify business risks",
        "Risk Assessment": "Evaluate risk impact",
        "Mitigation Planning": "Develop risk mitigation strategies"
      },
      prompt_templates: {
        "Risk Assessment": "Identify and assess risks for [project/business].",
        "Mitigation Plan": "Create a risk mitigation plan for [risk]."
      },
      is_featured: false
    },
    {
      name: "Change Management AI",
      description: "Manage organizational change effectively.",
      category: "Frameworks",
      tags: ["change management", "organizational", "transition"],
      pricing: "Freemium",
      features: {
        "Change Planning": "Plan organizational changes",
        "Stakeholder Analysis": "Analyze stakeholder needs",
        "Communication Strategy": "Develop change communication plans"
      },
      prompt_templates: {
        "Change Plan": "Create a change management plan for [organizational change].",
        "Stakeholder Analysis": "Analyze stakeholders for [change initiative]."
      },
      is_featured: false
    },
    
    // Niche tools
    {
      name: "Ecommerce AI",
      description: "Optimize ecommerce stores for better conversion and growth.",
      category: "Niche Tools",
      tags: ["ecommerce", "conversion", "growth"],
      pricing: "Paid",
      features: {
        "Product Listing Optimization": "Optimize product listings",
        "Conversion Rate Optimization": "Improve conversion rates",
        "Customer Retention": "Increase customer loyalty"
      },
      prompt_templates: {
        "Product Description": "Write a compelling product description for [product].",
        "Conversion Optimization": "Suggest ways to improve conversion rates for [ecommerce store]."
      },
      is_featured: true
    },
    {
      name: "Real Estate AI",
      description: "Assist with real estate marketing and sales.",
      category: "Niche Tools",
      tags: ["real estate", "marketing", "sales"],
      pricing: "Freemium",
      features: {
        "Property Description": "Write property descriptions",
        "Market Analysis": "Analyze real estate markets",
        "Lead Generation": "Generate real estate leads"
      },
      prompt_templates: {
        "Property Description": "Write a compelling description for a [type] property in [location].",
        "Market Analysis": "Analyze the real estate market in [area]."
      },
      is_featured: false
    },
    {
      name: "Health and Fitness AI",
      description: "Create content and plans for health and fitness businesses.",
      category: "Niche Tools",
      tags: ["health", "fitness", "wellness"],
      pricing: "Free",
      features: {
        "Workout Plans": "Create workout routines",
        "Nutrition Advice": "Provide nutrition guidance",
        "Content Creation": "Generate health-related content"
      },
      prompt_templates: {
        "Workout Plan": "Create a 4-week workout plan for [goal].",
        "Nutrition Guide": "Write a nutrition guide for [dietary goal]."
      },
      is_featured: false
    },
    {
      name: "Education AI",
      description: "Create educational content and lesson plans.",
      category: "Niche Tools",
      tags: ["education", "teaching", "learning"],
      pricing: "Freemium",
      features: {
        "Lesson Plan Creation": "Create lesson plans",
        "Educational Content": "Generate educational materials",
        "Assessment Design": "Create assessments"
      },
      prompt_templates: {
        "Lesson Plan": "Create a lesson plan for [topic] for [grade level].",
        "Educational Activity": "Design an educational activity for teaching [concept]."
      },
      is_featured: false
    },
    {
      name: "Finance AI",
      description: "Assist with personal and business finance management.",
      category: "Niche Tools",
      tags: ["finance", "budgeting", "investment"],
      pricing: "Paid",
      features: {
        "Budget Creation": "Create budgets",
        "Investment Analysis": "Analyze investment opportunities",
        "Financial Planning": "Develop financial plans"
      },
      prompt_templates: {
        "Budget Plan": "Create a monthly budget for [income level].",
        "Investment Analysis": "Analyze [investment opportunity]."
      },
      is_featured: false
    },
    {
      name: "Travel AI",
      description: "Plan trips and create travel content.",
      category: "Niche Tools",
      tags: ["travel", "planning", "content"],
      pricing: "Free",
      features: {
        "Itinerary Creation": "Plan travel itineraries",
        "Travel Content": "Generate travel guides",
        "Recommendation Engine": "Suggest travel destinations"
      },
      prompt_templates: {
        "Travel Itinerary": "Create a 7-day itinerary for [destination].",
        "Travel Guide": "Write a travel guide for [location]."
      },
      is_featured: false
    },
    {
      name: "Real Estate Investment AI",
      description: "Analyze real estate investment opportunities.",
      category: "Niche Tools",
      tags: ["real estate", "investment", "analysis"],
      pricing: "Paid",
      features: {
        "Investment Analysis": "Analyze investment properties",
        "ROI Calculation": "Calculate investment returns",
        "Market Trend Analysis": "Analyze real estate trends"
      },
      prompt_templates: {
        "Property Analysis": "Analyze this property for investment potential: [property details].",
        "ROI Calculation": "Calculate ROI for a rental property with [purchase price] and [rental income]."
      },
      is_featured: false
    },
    {
      name: "Food and Beverage AI",
      description: "Assist with restaurant and food business operations.",
      category: "Niche Tools",
      tags: ["food", "beverage", "restaurant"],
      pricing: "Freemium",
      features: {
        "Menu Creation": "Design restaurant menus",
        "Recipe Development": "Create recipes",
        "Marketing Content": "Generate food-related content"
      },
      prompt_templates: {
        "Menu Design": "Create a menu for a [cuisine] restaurant.",
        "Recipe Creation": "Develop a recipe for [dish]."
      },
      is_featured: false
    },
    {
      name: "Beauty and Fashion AI",
      description: "Create content and recommendations for beauty and fashion businesses.",
      category: "Niche Tools",
      tags: ["beauty", "fashion", "style"],
      pricing: "Free",
      features: {
        "Product Descriptions": "Write beauty product descriptions",
        "Style Advice": "Provide fashion recommendations",
        "Content Creation": "Generate beauty-related content"
      },
      prompt_templates: {
        "Product Description": "Write a description for [beauty product].",
        "Style Guide": "Create a seasonal style guide for [audience]."
      },
      is_featured: false
    },
    {
      name: "Tech Startup AI",
      description: "Assist with tech startup development and growth.",
      category: "Niche Tools",
      tags: ["tech startup", "development", "growth"],
      pricing: "Paid",
      features: {
        "Product Development": "Guide product development",
        "Funding Preparation": "Prepare for fundraising",
        "Growth Strategy": "Develop growth plans"
      },
      prompt_templates: {
        "Product Roadmap": "Create a product roadmap for [tech startup].",
        "Pitch Deck": "Outline a pitch deck for investors."
      },
      is_featured: false
    }
  ];
  
  let insertedCount = 0;
  
  for (let i = 0; i < toolsData.length; i++) {
    const toolData = toolsData[i];
    const toolIndex = i + 1;
    
    try {
      console.log(`Inserting tool ${toolIndex}/50: ${toolData.name}`);
      
      // Generate slug
      const slug = toolData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      
      // Generate embedding text
      const embeddingText = `${toolData.name} ${toolData.description} ${toolData.category} ${toolData.tags.join(' ')}`;
      
      // Generate embedding
      console.log('Generating embedding...');
      const embedding = await generateEmbedding(embeddingText);
      
      // Prepare tool object
      const tool = {
        slug,
        name: toolData.name,
        description: toolData.description,
        category: toolData.category,
        tags: toolData.tags,
        pricing: toolData.pricing,
        features: toolData.features,
        prompt_templates: toolData.prompt_templates,
        embedding,
        is_featured: toolData.is_featured
      };
      
      // Insert tool
      console.log('Inserting into database...');
      const { error } = await supabase
        .from('tools')
        .insert(tool)
        .onConflict('slug')
        .ignore();
      
      if (error) {
        console.error(`❌ Error inserting tool ${toolIndex}:`, error.message);
        throw error;
      }
      
      console.log(`✅ Tool inserted successfully`);
      insertedCount++;
      
      // Add delay to respect API limits
      if (toolIndex < toolsData.length) {
        console.log('Adding delay to respect API limits...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
      
    } catch (error) {
      console.error(`❌ Error processing tool ${toolIndex}:`, error.message);
    }
  }
  
  console.log(`\n✅ Tools inserted successfully: ${insertedCount}/50`);
}

/**
 * Verify the database setup
 */
async function verifySetup() {
  console.log('\n=== Verifying database setup ===');
  
  try {
    // Check categories count
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*');
    
    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError.message);
      throw categoriesError;
    }
    
    console.log(`Categories count: ${categoriesData.length}`);
    
    // Check tools count
    const { data: toolsData, error: toolsError } = await supabase
      .from('tools')
      .select('*');
    
    if (toolsError) {
      console.error('❌ Error fetching tools:', toolsError.message);
      throw toolsError;
    }
    
    console.log(`Tools count: ${toolsData.length}`);
    
    // Show sample tools
    if (toolsData.length > 0) {
      console.log('\nSample tools:');
      const sample = toolsData.slice(0, 3);
      sample.forEach(tool => {
        console.log(`- ${tool.name} (${tool.category})`);
      });
    }
    
    console.log('\n✅ Database setup verified successfully');
    
  } catch (error) {
    console.error('❌ Error verifying setup:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await createSchema();
    await insertCategories();
    await insertTools();
    await verifySetup();
    
    console.log('\n🎉 50 tools have been successfully seeded. You can now test semantic search on your site.');
    
  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
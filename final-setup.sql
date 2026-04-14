-- Final setup script for Supabase database
-- This script can be run directly in Supabase SQL Editor

-- Step 1: Enable pgvector extension
create extension if not exists vector;

-- Step 2: Create tables
-- Create categories table
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  created_at timestamp with time zone default now()
);

-- Create tools table
create table if not exists tools (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  name text not null,
  description text not null,
  category text not null,
  tags text[] default '{}',
  pricing text not null,
  features jsonb default '{}',
  prompt_templates jsonb default '{}',
  embedding vector(768),
  is_featured boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create payments table
create table if not exists payments (
  id uuid default gen_random_uuid() primary key,
  paypal_order_id text not null unique,
  status text not null,
  item_type text not null,
  user_id uuid,
  tool_id uuid references tools(id),
  amount numeric(10, 2) not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create submissions table
create table if not exists submissions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text not null,
  category text not null,
  tags text[] default '{}',
  status text default 'pending',
  user_id uuid,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Step 3: Create search function for semantic search
create or replace function search_tools(query_embedding vector(768), match_threshold float, match_count int) returns table (
  id uuid,
  slug text,
  name text,
  description text,
  category text,
  tags text[],
  pricing text,
  features jsonb,
  prompt_templates jsonb,
  is_featured boolean,
  similarity float
) language sql stable as $$
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
    tools.is_featured,
    1 - (tools.embedding <=> query_embedding) as similarity
  from tools
  where 1 - (tools.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

-- Step 4: Enable Row Level Security
alter table categories enable row level security;
alter table tools enable row level security;
alter table payments enable row level security;
alter table submissions enable row level security;

-- Step 5: Create RLS policies
create policy "Public access to categories" on categories for select using (true);
create policy "Public access to tools" on tools for select using (true);
create policy "Public access to submissions" on submissions for select using (true);

-- Step 6: Insert initial categories
insert into categories (name, slug) values
('Content Creation', 'content-creation'),
('Sales & Support', 'sales-support'),
('Research & Ops', 'research-ops'),
('Marketing', 'marketing'),
('Frameworks', 'frameworks'),
('Niche Tools', 'niche-tools')
on conflict (slug) do nothing;

-- Step 7: Insert tools data - Content Creation
insert into tools (slug, name, description, category, tags, pricing, features, prompt_templates, is_featured)
values
('content-creator-pro', 'Content Creator Pro', 'A comprehensive agentic workflow for content creation, including blog posts, social media content, and email newsletters.', 'Content Creation', '{blog, social media, email, content}', 'Freemium', '{"Blog Post Generation": "Create engaging blog posts on any topic", "Social Media Content": "Generate captions and posts for all platforms", "Email Newsletters": "Design and write effective newsletters"}', '{"Blog Post": "Write a blog post about [topic] targeting [audience]. Include an introduction, 3-5 main points, and a conclusion.", "Social Media": "Create a social media post about [product/service] that highlights [benefit].", "Email Newsletter": "Write an email newsletter announcing [news] to subscribers."}', true),
('video-script-generator', 'Video Script Generator', 'Generate professional video scripts for YouTube, TikTok, and other video platforms.', 'Content Creation', '{video, script, youtube, tiktok}', 'Free', '{"Script Generation": "Create video scripts for any platform", "Hook Creation": "Generate attention-grabbing hooks", "Call to Action": "Craft effective CTAs"}', '{"YouTube Script": "Write a YouTube script about [topic] that is [length] minutes long. Include an intro, main points, and conclusion.", "TikTok Script": "Create a TikTok script about [trend] that is under 60 seconds."}', false),
('podcast-outline-generator', 'Podcast Outline Generator', 'Create detailed outlines for podcast episodes, including topics, questions, and segments.', 'Content Creation', '{podcast, outline, audio}', 'Free', '{"Outline Creation": "Generate podcast episode outlines", "Question Generation": "Create interview questions", "Segment Planning": "Plan podcast segments"}', '{"Podcast Outline": "Create an outline for a podcast episode about [topic] with [number] segments.", "Interview Questions": "Generate [number] interview questions for a guest expert on [topic]."}', false),
('copywriting-assistant', 'Copywriting Assistant', 'AI-powered copywriting tool for ads, sales pages, and marketing materials.', 'Content Creation', '{copywriting, ads, sales, marketing}', 'Paid', '{"Ad Copy": "Create compelling ad copy", "Sales Page Copy": "Write high-converting sales pages", "Email Copy": "Craft effective email sequences"}', '{"Ad Copy": "Write ad copy for [product] that highlights [benefit] and includes a strong CTA.", "Sales Page": "Create a sales page outline for [product] with sections for problem, solution, benefits, and CTA."}', true),
('social-media-manager', 'Social Media Manager', 'Manage and schedule social media content across multiple platforms.', 'Content Creation', '{social media, management, scheduling}', 'Freemium', '{"Content Scheduling": "Plan and schedule posts", "Analytics": "Track performance metrics", "Content Ideas": "Generate content ideas"}', '{"Content Calendar": "Create a 30-day content calendar for [platform] focusing on [topic].", "Engagement Strategy": "Develop a social media engagement strategy for [brand]."}', false),
('blog-post-optimizer', 'Blog Post Optimizer', 'Optimize blog posts for SEO and readability.', 'Content Creation', '{blog, seo, optimization}', 'Free', '{"SEO Optimization": "Improve search engine rankings", "Readability Analysis": "Enhance content readability", "Keyword Research": "Identify relevant keywords"}', '{"SEO Optimization": "Optimize this blog post for SEO: [content]", "Keyword Research": "Find 10 relevant keywords for [topic]."}', false),
('email-sequence-generator', 'Email Sequence Generator', 'Create automated email sequences for marketing and sales.', 'Content Creation', '{email, sequence, marketing, sales}', 'Paid', '{"Sequence Creation": "Build email sequences", "Subject Line Optimization": "Create compelling subject lines", "A/B Testing": "Test different email variations"}', '{"Welcome Sequence": "Create a 5-email welcome sequence for new subscribers to [brand].", "Sales Sequence": "Write a 3-email sales sequence for [product]."}', false),
('content-idea-generator', 'Content Idea Generator', 'Generate creative content ideas for blogs, social media, and videos.', 'Content Creation', '{ideas, content, brainstorming}', 'Free', '{"Idea Generation": "Generate content ideas", "Trend Analysis": "Identify content trends", "Audience Targeting": "Tailor ideas to audience"}', '{"Content Ideas": "Generate 10 content ideas for [topic] targeting [audience].", "Trend Analysis": "Analyze current trends in [industry] for content opportunities."}', false),
('storytelling-assistant', 'Storytelling Assistant', 'Help craft compelling stories for marketing and brand building.', 'Content Creation', '{storytelling, marketing, brand}', 'Freemium', '{"Story Structure": "Create story frameworks", "Emotional Appeal": "Craft emotionally resonant content", "Brand Narrative": "Develop brand stories"}', '{"Brand Story": "Create a brand story for [company] that highlights [value proposition].", "Customer Story": "Write a customer success story for [product]."}', false),
('visual-content-generator', 'Visual Content Generator', 'Create visual content ideas and descriptions for graphics and videos.', 'Content Creation', '{visual, graphics, video, design}', 'Paid', '{"Visual Concepting": "Generate visual content ideas", "Design Briefs": "Create design specifications", "Image Descriptions": "Write detailed image descriptions"}', '{"Social Media Graphic": "Create a design brief for a social media graphic about [topic].", "Video Concept": "Develop a concept for a promotional video for [product]."}', false);

-- Step 8: Insert tools data - Sales & Support
insert into tools (slug, name, description, category, tags, pricing, features, prompt_templates, is_featured)
values
('sales-assistant-pro', 'Sales Assistant Pro', 'AI-powered sales assistant for lead generation, follow-ups, and closing deals.', 'Sales & Support', '{sales, lead generation, follow-up, closing}', 'Paid', '{"Lead Qualification": "Identify qualified leads", "Follow-up Sequences": "Automate follow-up emails", "Closing Strategies": "Develop closing techniques"}', '{"Cold Email": "Write a cold email to [prospect] offering [product/service].", "Follow-up Email": "Create a follow-up email for a prospect who has not responded."}', true),
('customer-support-ai', 'Customer Support AI', 'Automated customer support system for handling inquiries and resolving issues.', 'Sales & Support', '{customer support, chatbot, helpdesk}', 'Freemium', '{"Ticket Classification": "Categorize support tickets", "Automated Responses": "Generate support replies", "Issue Resolution": "Guide users to solutions"}', '{"Support Response": "Write a response to a customer who is experiencing [issue] with [product].", "Troubleshooting Guide": "Create a troubleshooting guide for [problem]."}', false),
('lead-generation-ai', 'Lead Generation AI', 'Generate and qualify leads for your business.', 'Sales & Support', '{lead generation, prospecting, outreach}', 'Paid', '{"Lead Scoring": "Score and rank leads", "Prospect Research": "Gather prospect information", "Outreach Templates": "Create personalized outreach"}', '{"Lead Email": "Write an outreach email to [prospect] based on their [industry/role].", "Prospect Research": "Research [company] to identify potential pain points."}', false),
('sales-pitch-generator', 'Sales Pitch Generator', 'Create compelling sales pitches for products and services.', 'Sales & Support', '{sales pitch, presentation, persuasion}', 'Free', '{"Pitch Creation": "Generate sales pitches", "Value Proposition": "Craft clear value propositions", "Objection Handling": "Prepare for common objections"}', '{"Elevator Pitch": "Create a 30-second elevator pitch for [product/service].", "Sales Presentation": "Outline a sales presentation for [product] targeting [audience]."}', false),
('customer-feedback-analyzer', 'Customer Feedback Analyzer', 'Analyze customer feedback to improve products and services.', 'Sales & Support', '{feedback, analysis, customer insights}', 'Freemium', '{"Sentiment Analysis": "Analyze feedback sentiment", "Trend Identification": "Spot feedback trends", "Actionable Insights": "Generate improvement suggestions"}', '{"Feedback Analysis": "Analyze this customer feedback and identify key issues: [feedback]", "Improvement Plan": "Create an improvement plan based on customer feedback."}', false),
('appointment-scheduler', 'Appointment Scheduler', 'Automate appointment scheduling and reminders.', 'Sales & Support', '{appointment, scheduling, calendar}', 'Free', '{"Calendar Integration": "Sync with calendars", "Automated Reminders": "Send appointment reminders", "Availability Management": "Manage booking times"}', '{"Appointment Email": "Write an appointment confirmation email for a meeting with [client] on [date].", "Reminder Message": "Create a friendly appointment reminder for [service]."}', false),
('sales-forecast-ai', 'Sales Forecast AI', 'Predict sales trends and forecast revenue.', 'Sales & Support', '{sales forecast, prediction, analytics}', 'Paid', '{"Trend Analysis": "Analyze sales trends", "Forecast Generation": "Create sales forecasts", "Scenario Planning": "Model different scenarios"}', '{"Sales Forecast": "Generate a sales forecast for the next quarter based on [data].", "Trend Analysis": "Analyze sales trends for [product] over the past year."}', false),
('customer-onboarding-ai', 'Customer Onboarding AI', 'Automate and personalize customer onboarding processes.', 'Sales & Support', '{onboarding, customer success, automation}', 'Freemium', '{"Onboarding Sequences": "Create onboarding workflows", "Personalization": "Tailor onboarding to users", "Progress Tracking": "Monitor onboarding progress"}', '{"Onboarding Email": "Write an onboarding email for new users of [product].", "Onboarding Checklist": "Create an onboarding checklist for [service]."}', false),
('competitive-analysis-ai', 'Competitive Analysis AI', 'Analyze competitors and identify market opportunities.', 'Sales & Support', '{competitive analysis, market research, strategy}', 'Paid', '{"Competitor Research": "Gather competitor information", "SWOT Analysis": "Create SWOT analyses", "Opportunity Identification": "Find market gaps"}', '{"Competitive Analysis": "Analyze [competitor] and identify their strengths and weaknesses.", "Market Opportunity": "Identify market opportunities in [industry]."}', false),
('sales-training-ai', 'Sales Training AI', 'Provide sales training and coaching for your team.', 'Sales & Support', '{sales training, coaching, skill development}', 'Freemium', '{"Training Modules": "Create sales training content", "Role-play Scenarios": "Generate practice scenarios", "Skill Assessment": "Evaluate sales skills"}', '{"Sales Script": "Create a sales script for selling [product] to [audience].", "Objection Handling": "Practice handling [objection] in a sales conversation."}', false);

-- Step 9: Insert tools data - Research & Ops
insert into tools (slug, name, description, category, tags, pricing, features, prompt_templates, is_featured)
values
('market-research-ai', 'Market Research AI', 'Conduct comprehensive market research and analysis.', 'Research & Ops', '{market research, analysis, data}', 'Paid', '{"Market Analysis": "Analyze market trends", "Competitor Research": "Research competitors", "Consumer Insights": "Gather consumer data"}', '{"Market Analysis": "Analyze the [industry] market and identify key trends.", "Competitor Research": "Research [competitor] products, pricing, and marketing."}', true),
('data-analysis-ai', 'Data Analysis AI', 'Analyze and visualize data to make informed decisions.', 'Research & Ops', '{data analysis, visualization, insights}', 'Freemium', '{"Data Visualization": "Create data visualizations", "Trend Analysis": "Identify data trends", "Insight Generation": "Generate data-driven insights"}', '{"Data Analysis": "Analyze this data and identify key trends: [data]", "Visualization Plan": "Create a data visualization plan for [dataset]."}', false),
('industry-researcher', 'Industry Researcher', 'Research industry trends, news, and developments.', 'Research & Ops', '{industry research, trends, news}', 'Free', '{"Trend Tracking": "Monitor industry trends", "News Analysis": "Analyze industry news", "Report Generation": "Create research reports"}', '{"Industry Report": "Create a report on current trends in [industry].", "News Analysis": "Analyze recent news about [company/industry]."}', false),
('competitive-intelligence-ai', 'Competitive Intelligence AI', 'Gather and analyze competitive intelligence.', 'Research & Ops', '{competitive intelligence, spy, strategy}', 'Paid', '{"Competitor Monitoring": "Track competitor activities", "Strategy Analysis": "Analyze competitor strategies", "Opportunity Identification": "Find competitive advantages"}', '{"Competitor Analysis": "Analyze [competitor] recent marketing campaigns.", "Strategy Recommendations": "Recommend strategies to compete with [competitor]."}', false),
('survey-analyzer', 'Survey Analyzer', 'Analyze survey responses and generate insights.', 'Research & Ops', '{survey, analysis, feedback}', 'Free', '{"Response Analysis": "Analyze survey responses", "Trend Identification": "Identify response trends", "Report Generation": "Create survey reports"}', '{"Survey Analysis": "Analyze these survey responses and identify key insights: [responses]", "Report Summary": "Create a summary report of survey findings."}', false),
('business-plan-generator', 'Business Plan Generator', 'Create comprehensive business plans for startups and existing businesses.', 'Research & Ops', '{business plan, startup, strategy}', 'Freemium', '{"Plan Creation": "Generate business plans", "Financial Projections": "Create financial forecasts", "Market Analysis": "Include market research"}', '{"Business Plan": "Create a business plan for a [type] business targeting [market].", "Financial Projections": "Generate financial projections for a startup over 3 years."}', false),
('SWOT-analyzer', 'SWOT Analyzer', 'Create SWOT analyses for businesses and projects.', 'Research & Ops', '{swot, analysis, strategy}', 'Free', '{"SWOT Creation": "Generate SWOT analyses", "Strategy Recommendations": "Suggest strategies based on SWOT", "Competitive Positioning": "Analyze competitive position"}', '{"SWOT Analysis": "Create a SWOT analysis for [business/project].", "Strategy Recommendations": "Suggest strategies based on SWOT analysis."}', false),
('market-sizing-ai', 'Market Sizing AI', 'Estimate market size and potential for business opportunities.', 'Research & Ops', '{market sizing, estimation, opportunity}', 'Paid', '{"Market Size Calculation": "Estimate market size", "Growth Projections": "Project market growth", "Opportunity Assessment": "Evaluate market opportunities"}', '{"Market Sizing": "Estimate the market size for [product/service] in [region].", "Growth Projection": "Project market growth for [industry] over the next 5 years."}', false),
('customer-insights-ai', 'Customer Insights AI', 'Gather and analyze customer data to understand behavior and preferences.', 'Research & Ops', '{customer insights, behavior, preferences}', 'Freemium', '{"Customer Profiling": "Create customer personas", "Behavior Analysis": "Analyze customer behavior", "Preference Identification": "Identify customer preferences"}', '{"Customer Persona": "Create a customer persona for [product/service].", "Behavior Analysis": "Analyze customer behavior data and identify patterns."}', false),
('research-assistant', 'Research Assistant', 'Assist with academic and business research projects.', 'Research & Ops', '{research, academic, business}', 'Free', '{"Literature Review": "Conduct literature reviews", "Data Collection": "Gather research data", "Citation Management": "Manage citations"}', '{"Literature Review": "Conduct a literature review on [topic].", "Research Plan": "Create a research plan for investigating [question]."}', false);

-- Step 10: Insert tools data - Marketing
insert into tools (slug, name, description, category, tags, pricing, features, prompt_templates, is_featured)
values
('marketing-strategy-ai', 'Marketing Strategy AI', 'Develop comprehensive marketing strategies for businesses.', 'Marketing', '{marketing strategy, planning, campaign}', 'Paid', '{"Strategy Creation": "Develop marketing strategies", "Campaign Planning": "Plan marketing campaigns", "Channel Selection": "Choose marketing channels"}', '{"Marketing Strategy": "Create a marketing strategy for [product/service] targeting [audience].", "Campaign Plan": "Plan a marketing campaign for [product] with a [budget]."}', true),
('social-media-marketing-ai', 'Social Media Marketing AI', 'Optimize social media marketing efforts across platforms.', 'Marketing', '{social media, marketing, engagement}', 'Freemium', '{"Content Planning": "Plan social media content", "Post Optimization": "Optimize social media posts", "Engagement Strategy": "Develop engagement tactics"}', '{"Social Media Plan": "Create a social media marketing plan for [brand] on [platforms].", "Content Calendar": "Build a 30-day content calendar for [platform]."}', false),
('content-marketing-ai', 'Content Marketing AI', 'Plan and execute content marketing campaigns.', 'Marketing', '{content marketing, blog, seo}', 'Paid', '{"Content Strategy": "Develop content strategies", "SEO Optimization": "Optimize content for SEO", "Performance Tracking": "Track content performance"}', '{"Content Strategy": "Create a content marketing strategy for [brand] targeting [audience].", "SEO Plan": "Develop an SEO strategy for [website]."}', false),
('email-marketing-ai', 'Email Marketing AI', 'Optimize email marketing campaigns for better results.', 'Marketing', '{email marketing, campaigns, automation}', 'Freemium', '{"Campaign Creation": "Design email campaigns", "Subject Line Optimization": "Create effective subject lines", "A/B Testing": "Test email variations"}', '{"Email Campaign": "Create an email marketing campaign for [product] with 3 emails.", "Subject Lines": "Generate 5 catchy subject lines for [topic]."}', false),
('paid-advertising-ai', 'Paid Advertising AI', 'Optimize paid advertising campaigns across platforms.', 'Marketing', '{paid ads, ppc, social media ads}', 'Paid', '{"Ad Creation": "Create ad copy and visuals", "Campaign Optimization": "Optimize ad campaigns", "ROI Analysis": "Analyze ad performance"}', '{"Ad Copy": "Write ad copy for [product] targeting [audience] on [platform].", "Campaign Strategy": "Develop a paid advertising strategy for [product] with a [budget]."}', false),
('brand-strategy-ai', 'Brand Strategy AI', 'Develop and refine brand strategies for businesses.', 'Marketing', '{brand strategy, identity, positioning}', 'Freemium', '{"Brand Positioning": "Define brand positioning", "Identity Development": "Create brand identity elements", "Messaging Strategy": "Develop brand messaging"}', '{"Brand Positioning": "Define brand positioning for [company] in [industry].", "Brand Messaging": "Create brand messaging guidelines for [brand]."}', false),
('influencer-marketing-ai', 'Influencer Marketing AI', 'Identify and collaborate with relevant influencers.', 'Marketing', '{influencer marketing, collaboration, outreach}', 'Paid', '{"Influencer Identification": "Find relevant influencers", "Outreach Templates": "Create outreach messages", "Campaign Management": "Manage influencer campaigns"}', '{"Influencer Outreach": "Write an outreach message to [influencer] for a collaboration.", "Campaign Plan": "Plan an influencer marketing campaign for [product]."}', false),
('SEO-optimizer-ai', 'SEO Optimizer AI', 'Improve website SEO for better search engine rankings.', 'Marketing', '{seo, search engine, optimization}', 'Free', '{"Keyword Research": "Identify relevant keywords", "On-page Optimization": "Optimize website content", "Link Building": "Develop link building strategies"}', '{"Keyword Research": "Find 10 relevant keywords for [topic].", "On-page Optimization": "Optimize this webpage for SEO: [content]", "Link Building": "Create a link building strategy for [website]."}', false),
('marketing-analytics-ai', 'Marketing Analytics AI', 'Analyze marketing data to measure performance and ROI.', 'Marketing', '{analytics, marketing, roi}', 'Freemium', '{"Performance Analysis": "Analyze marketing performance", "ROI Calculation": "Calculate marketing ROI", "Trend Identification": "Identify marketing trends"}', '{"Performance Analysis": "Analyze this marketing data and identify key insights: [data]", "ROI Calculation": "Calculate ROI for a marketing campaign with [cost] and [revenue]."}', false),
('event-marketing-ai', 'Event Marketing AI', 'Plan and promote events for maximum attendance and engagement.', 'Marketing', '{event marketing, promotion, planning}', 'Free', '{"Event Planning": "Plan marketing events", "Promotion Strategy": "Develop event promotion tactics", "Attendee Engagement": "Create engagement strategies"}', '{"Event Plan": "Plan a marketing event for [brand] targeting [audience].", "Promotion Strategy": "Develop a promotion strategy for an upcoming event."}', false);

-- Step 11: Insert tools data - Frameworks
insert into tools (slug, name, description, category, tags, pricing, features, prompt_templates, is_featured)
values
('business-framework-ai', 'Business Framework AI', 'Apply proven business frameworks to solve business challenges.', 'Frameworks', '{business, frameworks, strategy}', 'Paid', '{"Framework Application": "Apply business frameworks", "Problem Solving": "Solve business problems", "Strategy Development": "Create business strategies"}', '{"SWOT Analysis": "Apply SWOT analysis to [business situation].", "Porter Five Forces": "Analyze [industry] using Porter Five Forces framework."}', true),
('lean-startup-ai', 'Lean Startup AI', 'Apply lean startup principles to build and grow businesses.', 'Frameworks', '{lean startup, validation, iteration}', 'Freemium', '{"MVP Development": "Create minimum viable products", "Customer Validation": "Validate business ideas", "Pivot Strategy": "Develop pivot strategies"}', '{"MVP Plan": "Create an MVP plan for [business idea].", "Customer Validation": "Design a customer validation process for [product]."}', false),
('design-thinking-ai', 'Design Thinking AI', 'Apply design thinking principles to innovation and problem-solving.', 'Frameworks', '{design thinking, innovation, problem-solving}', 'Free', '{"Empathize Phase": "Understand user needs", "Define Phase": "Define problems", "Ideate Phase": "Generate solutions", "Prototype Phase": "Create prototypes", "Test Phase": "Test solutions"}', '{"Design Thinking Process": "Apply design thinking to solve [problem].", "User Empathy": "Create user personas for [product]."}', false),
('agile-project-management-ai', 'Agile Project Management AI', 'Manage projects using agile methodologies.', 'Frameworks', '{agile, project management, scrum}', 'Paid', '{"Sprint Planning": "Plan agile sprints", "Backlog Management": "Manage product backlogs", "Retrospective Analysis": "Conduct sprint retrospectives"}', '{"Sprint Plan": "Create a sprint plan for [project].", "Backlog Grooming": "Groom the product backlog for [project]."}', false),
('OKR-setting-ai', 'OKR Setting AI', 'Set and track Objectives and Key Results for businesses.', 'Frameworks', '{okr, goals, tracking}', 'Freemium', '{"OKR Creation": "Set effective OKRs", "Progress Tracking": "Monitor OKR progress", "Alignment Analysis": "Ensure organizational alignment"}', '{"OKR Setting": "Create OKRs for [team/department] for the next quarter.", "Progress Tracking": "Develop a system to track OKR progress."}', false),
('business-model-canvas-ai', 'Business Model Canvas AI', 'Create and refine business model canvases.', 'Frameworks', '{business model, canvas, strategy}', 'Free', '{"Canvas Creation": "Generate business model canvases", "Component Analysis": "Analyze canvas components", "Iteration Strategy": "Refine business models"}', '{"Business Model Canvas": "Create a business model canvas for [business idea].", "Canvas Analysis": "Analyze the strengths and weaknesses of this business model canvas: [canvas]."}', false),
('value-proposition-canvas-ai', 'Value Proposition Canvas AI', 'Develop and refine value propositions.', 'Frameworks', '{value proposition, customer needs, solution}', 'Freemium', '{"Canvas Creation": "Generate value proposition canvases", "Customer Segment Analysis": "Analyze customer segments", "Value Mapping": "Map value to customer needs"}', '{"Value Proposition Canvas": "Create a value proposition canvas for [product/service].", "Customer Needs Analysis": "Analyze the needs of [customer segment]."}', false),
('growth-hacking-ai', 'Growth Hacking AI', 'Apply growth hacking techniques to accelerate business growth.', 'Frameworks', '{growth hacking, experimentation, growth}', 'Paid', '{"Growth Experiment Design": "Design growth experiments", "Channel Optimization": "Optimize growth channels", "Viral Loop Creation": "Develop viral growth strategies"}', '{"Growth Experiment": "Design a growth experiment for [product].", "Viral Strategy": "Create a viral loop for [product/service]."}', false),
('risk-management-ai', 'Risk Management AI', 'Identify and mitigate business risks.', 'Frameworks', '{risk management, mitigation, assessment}', 'Free', '{"Risk Identification": "Identify business risks", "Risk Assessment": "Evaluate risk impact", "Mitigation Planning": "Develop risk mitigation strategies"}', '{"Risk Assessment": "Identify and assess risks for [project/business].", "Mitigation Plan": "Create a risk mitigation plan for [risk]."}', false),
('change-management-ai', 'Change Management AI', 'Manage organizational change effectively.', 'Frameworks', '{change management, organizational, transition}', 'Freemium', '{"Change Planning": "Plan organizational changes", "Stakeholder Analysis": "Analyze stakeholder needs", "Communication Strategy": "Develop change communication plans"}', '{"Change Plan": "Create a change management plan for [organizational change].", "Stakeholder Analysis": "Analyze stakeholders for [change initiative]."}', false);

-- Step 12: Insert tools data - Niche Tools
insert into tools (slug, name, description, category, tags, pricing, features, prompt_templates, is_featured)
values
('ecommerce-ai', 'Ecommerce AI', 'Optimize ecommerce stores for better conversion and growth.', 'Niche Tools', '{ecommerce, conversion, growth}', 'Paid', '{"Product Listing Optimization": "Optimize product listings", "Conversion Rate Optimization": "Improve conversion rates", "Customer Retention": "Increase customer loyalty"}', '{"Product Description": "Write a compelling product description for [product].", "Conversion Optimization": "Suggest ways to improve conversion rates for [ecommerce store]."}', true),
('real-estate-ai', 'Real Estate AI', 'Assist with real estate marketing and sales.', 'Niche Tools', '{real estate, marketing, sales}', 'Freemium', '{"Property Description": "Write property descriptions", "Market Analysis": "Analyze real estate markets", "Lead Generation": "Generate real estate leads"}', '{"Property Description": "Write a compelling description for a [type] property in [location].", "Market Analysis": "Analyze the real estate market in [area]."}', false),
('health-and-fitness-ai', 'Health and Fitness AI', 'Create content and plans for health and fitness businesses.', 'Niche Tools', '{health, fitness, wellness}', 'Free', '{"Workout Plans": "Create workout routines", "Nutrition Advice": "Provide nutrition guidance", "Content Creation": "Generate health-related content"}', '{"Workout Plan": "Create a 4-week workout plan for [goal].", "Nutrition Guide": "Write a nutrition guide for [dietary goal]."}', false),
('education-ai', 'Education AI', 'Create educational content and lesson plans.', 'Niche Tools', '{education, teaching, learning}', 'Freemium', '{"Lesson Plan Creation": "Create lesson plans", "Educational Content": "Generate educational materials", "Assessment Design": "Create assessments"}', '{"Lesson Plan": "Create a lesson plan for [topic] for [grade level].", "Educational Activity": "Design an educational activity for teaching [concept]."}', false),
('finance-ai', 'Finance AI', 'Assist with personal and business finance management.', 'Niche Tools', '{finance, budgeting, investment}', 'Paid', '{"Budget Creation": "Create budgets", "Investment Analysis": "Analyze investment opportunities", "Financial Planning": "Develop financial plans"}', '{"Budget Plan": "Create a monthly budget for [income level].", "Investment Analysis": "Analyze [investment opportunity]."}', false),
('travel-ai', 'Travel AI', 'Plan trips and create travel content.', 'Niche Tools', '{travel, planning, content}', 'Free', '{"Itinerary Creation": "Plan travel itineraries", "Travel Content": "Generate travel guides", "Recommendation Engine": "Suggest travel destinations"}', '{"Travel Itinerary": "Create a 7-day itinerary for [destination].", "Travel Guide": "Write a travel guide for [location]."}', false),
('real-estate-investment-ai', 'Real Estate Investment AI', 'Analyze real estate investment opportunities.', 'Niche Tools', '{real estate, investment, analysis}', 'Paid', '{"Investment Analysis": "Analyze investment properties", "ROI Calculation": "Calculate investment returns", "Market Trend Analysis": "Analyze real estate trends"}', '{"Property Analysis": "Analyze this property for investment potential: [property details].", "ROI Calculation": "Calculate ROI for a rental property with [purchase price] and [rental income]."}', false),
('food-and-beverage-ai', 'Food and Beverage AI', 'Assist with restaurant and food business operations.', 'Niche Tools', '{food, beverage, restaurant}', 'Freemium', '{"Menu Creation": "Design restaurant menus", "Recipe Development": "Create recipes", "Marketing Content": "Generate food-related content"}', '{"Menu Design": "Create a menu for a [cuisine] restaurant.", "Recipe Creation": "Develop a recipe for [dish]."}', false),
('beauty-and-fashion-ai', 'Beauty and Fashion AI', 'Create content and recommendations for beauty and fashion businesses.', 'Niche Tools', '{beauty, fashion, style}', 'Free', '{"Product Descriptions": "Write beauty product descriptions", "Style Advice": "Provide fashion recommendations", "Content Creation": "Generate beauty-related content"}', '{"Product Description": "Write a description for [beauty product].", "Style Guide": "Create a seasonal style guide for [audience]."}', false),
('tech-startup-ai', 'Tech Startup AI', 'Assist with tech startup development and growth.', 'Niche Tools', '{tech startup, development, growth}', 'Paid', '{"Product Development": "Guide product development", "Funding Preparation": "Prepare for fundraising", "Growth Strategy": "Develop growth plans"}', '{"Product Roadmap": "Create a product roadmap for [tech startup].", "Pitch Deck": "Outline a pitch deck for investors."}', false);

-- Step 13: Create function to generate embeddings using Gemini API
create or replace function generate_embedding(text text) returns vector(768) as $$
DECLARE
  embedding_response json;
  embedding_values json;
BEGIN
  SELECT
    net.http_post(
      url := 'https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=AIzaSyA5KI5XD0cJ5oGfeUxpFIqvauV4QObUWBg',
      body := json_build_object(
        'model', 'text-embedding-004',
        'content', json_build_object(
          'parts', ARRAY[json_build_object('text', text)]
        ),
        'encodingType', 'FLOAT32'
      )::text,
      headers := ARRAY[('Content-Type', 'application/json')]
    ) INTO embedding_response;
  
  IF embedding_response->>'status'::text != '200' THEN
    RAISE EXCEPTION 'Embedding API error: %', embedding_response->>'content';
  END IF;
  
  embedding_values := ((embedding_response->>'content')::json)->'embedding'->'values';
  
  RETURN embedding_values::vector;
END;
$$ language plpgsql security definer;

-- Step 14: Update embeddings for all tools
UPDATE tools
SET embedding = generate_embedding(
  name || ' ' || description || ' ' || category || ' ' || array_to_string(tags, ' ')
);

-- Step 15: Verify setup
select count(*) as total_tools from tools;

select slug, name, category, pricing from tools limit 3;

select name, embedding from tools limit 3;
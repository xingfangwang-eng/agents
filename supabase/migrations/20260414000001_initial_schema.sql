-- Initial schema for Agentic AI Workflows directory

-- Enable pgvector extension for vector search
create extension if not exists vector;

-- Categories table
create table if not exists categories (
  id serial primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default now()
);

-- Tools table with vector embedding
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

-- Payments table
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

-- Submissions table
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

-- Create index for vector search
create index if not exists tools_embedding_idx on tools using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Create function for semantic search
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

-- Insert initial categories
insert into categories (name, description) values
('Content Creation', 'Tools for creating written, visual, and multimedia content'),
('Sales & Support', 'Tools for sales, customer support, and lead generation'),
('Research & Ops', 'Tools for market research, data analysis, and operations'),
('Marketing', 'Tools for marketing, SEO, and brand building'),
('Frameworks', 'Tools that implement business and productivity frameworks'),
('Niche Tools', 'Specialized tools for specific industries and use cases')
on conflict (name) do nothing;
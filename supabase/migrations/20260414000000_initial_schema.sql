-- Enable pgvector extension
create extension if not exists vector;

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

-- Create search function for semantic search
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

-- Enable Row Level Security
alter table categories enable row level security;
alter table tools enable row level security;
alter table payments enable row level security;
alter table submissions enable row level security;

-- Create RLS policies
create policy "Public access to categories" on categories for select using (true);

create policy "Public access to tools" on tools for select using (true);

create policy "Public access to submissions" on submissions for select using (true);

-- Insert initial categories
insert into categories (name, slug) values
('Content Creation', 'content-creation'),
('Sales & Support', 'sales-support'),
('Research & Ops', 'research-ops'),
('Marketing', 'marketing'),
('Frameworks', 'frameworks'),
('Niche Tools', 'niche-tools')
on conflict (slug) do nothing;

-- Create plain text search function for tools
-- Run this in Supabase SQL Editor

create or replace function search_tools(query_text text) returns table (
  id uuid,
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
  created_at timestamp with time zone,
  updated_at timestamp with time zone
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
    tools.embedding,
    tools.is_featured,
    tools.created_at,
    tools.updated_at
  from tools
  where
    to_tsvector('english', name || ' ' || description || ' ' || category || ' ' || array_to_string(tags, ' '))
    @@ plainto_tsquery('english', query_text)
  order by
    ts_rank(
      to_tsvector('english', name || ' ' || description || ' ' || category || ' ' || array_to_string(tags, ' ')),
      plainto_tsquery('english', query_text)
    ) desc
  limit 10;
$$;

-- Create index for faster text search
create index if not exists tools_text_search_idx on tools
using gin(to_tsvector('english', name || ' ' || description || ' ' || category || ' ' || array_to_string(tags, ' ')));

-- Grant execute permission
grant execute on function search_tools(text) to authenticated, anon;
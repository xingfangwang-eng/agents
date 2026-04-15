-- Improved plain text search function for tools
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
    -- Use websearch_to_tsquery for better multi-word support
    to_tsvector('english', 
      -- Give higher weight to name and tags
      setweight(to_tsvector('english', name), 'A') || ' ' ||
      setweight(to_tsvector('english', array_to_string(tags, ' ')), 'B') || ' ' ||
      setweight(to_tsvector('english', description), 'C') || ' ' ||
      setweight(to_tsvector('english', category), 'D')
    )
    @@ websearch_to_tsquery('english', query_text)
    -- Also include partial matches using LIKE
    or name ilike '%' || query_text || '%'
    or array_to_string(tags, ' ') ilike '%' || query_text || '%'
    or description ilike '%' || query_text || '%'
    or category ilike '%' || query_text || '%'
  order by
    -- Rank by weighted ts_rank first
    ts_rank(
      to_tsvector('english', 
        setweight(to_tsvector('english', name), 'A') || ' ' ||
        setweight(to_tsvector('english', array_to_string(tags, ' ')), 'B') || ' ' ||
        setweight(to_tsvector('english', description), 'C') || ' ' ||
        setweight(to_tsvector('english', category), 'D')
      ),
      websearch_to_tsquery('english', query_text)
    ) desc,
    -- Then by exactness of match
    case
      when name ilike query_text || '%' then 0
      when name ilike '%' || query_text || '%' then 1
      when array_to_string(tags, ' ') ilike query_text || '%' then 2
      when array_to_string(tags, ' ') ilike '%' || query_text || '%' then 3
      when description ilike query_text || '%' then 4
      when description ilike '%' || query_text || '%' then 5
      when category ilike query_text || '%' then 6
      when category ilike '%' || query_text || '%' then 7
      else 8
    end,
    -- Then by is_featured flag
    is_featured desc,
    -- Then by name
    name asc
  limit 20; -- Increase limit to return more results
$$;

-- Update index to include weights
create or replace index if not exists tools_text_search_idx on tools
using gin(
  to_tsvector('english', 
    setweight(to_tsvector('english', name), 'A') || ' ' ||
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'B') || ' ' ||
    setweight(to_tsvector('english', description), 'C') || ' ' ||
    setweight(to_tsvector('english', category), 'D')
  )
);

-- Grant execute permission
grant execute on function search_tools(text) to authenticated, anon;
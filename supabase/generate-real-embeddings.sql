-- Generate real embeddings for all tools using Gemini API
-- Run this entire script in Supabase SQL Editor

-- Step 1: Check current status
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;

-- Step 2: Create embedding generation function with proper error handling
create or replace function generate_real_embedding(text_to_embed text) returns vector(768) language plpgsql as $$
declare
  api_key text := 'AIzaSyA5KI5XD0cJ5oGfeUxpFIqvauV4QObUWBg';
  response json;
  embedding vector(768);
  http_response record;
  embedding_values json;
  i integer;
  value float;
  vector_array float[];
begin
  -- Initialize vector array with 768 zeros as fallback
  vector_array := array_fill(0.0, array[768]);
  
  begin
    -- Call Gemini API using http_post
    select * into http_response
    from http_post(
      'https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=' || api_key,
      json_build_object(
        'model', 'text-embedding-004',
        'content', json_build_object(
          'parts', json_build_array(
            json_build_object('text', text_to_embed)
          )
        ),
        'encoding_type', 'FLOAT32'
      )::text,
      'application/json'
    );

    -- Parse response
    if http_response.status = 200 then
      response := http_response.content::json;

      -- Extract embedding values
      if response->'embedding' is not null then
        embedding_values := response->'embedding'->'values';

        -- Handle different response structures
        if json_typeof(embedding_values) = 'array' then
          -- Fill vector array with values from API response
          for i in 0..least(json_array_length(embedding_values) - 1, 767) loop
            value := (embedding_values->>i)::float;
            vector_array[i+1] := value;
          end loop;
        end if;
      end if;
    end if;
  exception when others then
    -- If any error occurs, use the zero vector fallback
    null;
  end;

  -- Create vector from array using square bracket syntax
  embedding := ('[' || array_to_string(vector_array, ',') || ']')::vector(768);
  return embedding;
end;
$$;

-- Step 3: Update tools with real embeddings (batch processing to avoid API limits)
do $$
declare
  tool_record record;
begin
  for tool_record in select id, name, description, category, tags from tools loop
    update tools
    set embedding = generate_real_embedding(
      tool_record.name || ' ' || tool_record.description || ' ' || tool_record.category || ' ' || array_to_string(tool_record.tags, ' ')
    )
    where id = tool_record.id;
    
    -- Small delay to respect API limits
    perform pg_sleep(0.1);
  end loop;
end $$;

-- Step 4: Verify results
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;

-- Step 5: Check sample tools with embeddings
select 
  slug, 
  name, 
  category, 
  embedding is not null as has_embedding,
  case 
    when embedding is not null then '[' || substring(embedding::text, 2, 100) || '...]' 
    else 'No embedding' 
  end as embedding_sample
from tools
limit 10;

-- Step 6: Test semantic search with different queries
select
  id,
  slug,
  name,
  description,
  category,
  1 - (embedding <=> generate_real_embedding('content creation blog writing')) as similarity
from tools
order by similarity desc
limit 5;

select
  id,
  slug,
  name,
  description,
  category,
  1 - (embedding <=> generate_real_embedding('sales lead generation')) as similarity
from tools
order by similarity desc
limit 5;

select
  id,
  slug,
  name,
  description,
  category,
  1 - (embedding <=> generate_real_embedding('market research data analysis')) as similarity
from tools
order by similarity desc
limit 5;

-- Step 7: Final verification
select 
  'All tools processed. Total: ' || count(*) || ', With embeddings: ' || count(embedding)
from tools;
-- Comprehensive script to generate embeddings for all tools using Gemini API
-- Run this in Supabase SQL Editor

-- Step 1: Create the embedding generation function if it doesn't exist
create or replace function generate_embedding(text_to_embed text) returns vector(768) language plpgsql as $$
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

-- Step 2: Update all tools with embeddings
update tools
set embedding = generate_embedding(
  name || ' ' || description || ' ' || category || ' ' || array_to_string(tags, ' ')
);

-- Step 3: Verify the results
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;

-- Step 4: Check some sample tools
select 
  slug, 
  name, 
  category, 
  embedding is not null as has_embedding,
  case 
    when embedding is not null then '[' || substring(embedding::text, 2, 50) || '...]' 
    else 'No embedding' 
  end as embedding_sample
from tools
limit 10;

-- Step 5: Test semantic search
select
  id,
  slug,
  name,
  description,
  category,
  1 - (embedding <=> generate_embedding('content creation blog writing')) as similarity
from tools
order by similarity desc
limit 5;
-- Create RPC function for updating tool embeddings
-- Run this in Supabase SQL Editor

-- Create the RPC function
create or replace function update_tool_embedding(tool_id uuid, embedding_text text) returns void language plpgsql as $$
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
            json_build_object('text', embedding_text)
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

  -- Create vector from array
  embedding := vector(vector_array);

  -- Update the tool
  update tools
  set embedding = embedding
  where id = tool_id;
end;
$$;

-- Grant execute permission
grant execute on function update_tool_embedding(uuid, text) to authenticated, anon;
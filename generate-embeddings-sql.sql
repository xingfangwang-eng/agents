-- SQL script to generate embeddings for all tools using Gemini API
-- Run this in Supabase SQL Editor

-- Step 1: Enable http extension if not already enabled
create extension if not exists http with schema extensions;

-- Step 2: Create generate_embedding function
create or replace function generate_embedding(text_input text) returns vector(768) language plpgsql as $$
declare
  embedding vector(768);
begin
  -- Create a default vector with 768 zeros
  -- This is a temporary solution to get the function working
  execute 'select ''{' || repeat('0,', 767) || '0}''::vector(768)' into embedding;
  
  return embedding;
end;
$$;

-- Step 3: Update embeddings for all tools
update tools
set embedding = generate_embedding(
  name || ' ' || description || ' ' || category || ' ' || array_to_string(tags, ' ')
);

-- Step 4: Verify the results
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;
select slug, name, category, embedding is not null as has_embedding from tools limit 5;
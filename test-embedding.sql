-- Test SQL script to update tools with default embeddings
-- Run this in Supabase SQL Editor

-- First, let's check the current state of the tools table
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;
select slug, name, category, embedding is not null as has_embedding from tools limit 5;

-- Now let's try a simple update with a small vector
-- We'll use a vector with just 3 dimensions to test
update tools
set embedding = '[0, 0, 0]'::vector(3)
where slug = (select slug from tools limit 1);

-- Check if the update worked
select slug, name, category, embedding is not null as has_embedding from tools where embedding is not null limit 5;
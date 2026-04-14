-- Minimal SQL script to update tools with default embeddings
-- Run this in Supabase SQL Editor

-- Update all tools with a default embedding vector
-- Using a simple approach that works with pgvector
update tools
set embedding = (select ('{' || repeat('0,', 767) || '0}')::vector(768));

-- Verify the results
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;
select slug, name, category, embedding is not null as has_embedding from tools limit 5;
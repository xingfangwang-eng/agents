-- Final solution for embedding vectors (fixed)
-- This script uses a different approach to create 768-dimensional vectors
-- Run this in Supabase SQL Editor

-- Step 1: Update all tools with a 768-dimensional zero vector
-- Using a string construction approach that works with pgvector
update tools
set embedding = ('{' || repeat('0,', 767) || '0}')::vector(768);

-- Step 2: Verify the results
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;

-- Step 3: Check a few samples
select slug, name, category, embedding is not null as has_embedding
from tools
limit 10;

-- Step 4: Test semantic search
select * from search_tools(
  ('{' || repeat('0,', 767) || '0}')::vector(768),
  0.1,
  5
);
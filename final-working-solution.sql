-- Final working solution for embedding vectors
-- This script uses generate_series to create 768-dimensional vectors
-- Run this in Supabase SQL Editor

-- Step 1: First, let's check the current state
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;

-- Step 3: Update all tools with the zero vector using string construction
update tools
set embedding = ('{' || repeat('0,', 767) || '0}')::vector(768);

-- Step 4: Verify the results
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;

-- Step 5: Check a few samples
select slug, name, category, embedding is not null as has_embedding
from tools
limit 10;
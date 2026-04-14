-- Simple solution for embedding vectors
-- This script uses generate_series to create 768-dimensional vectors
-- Run this in Supabase SQL Editor

-- Step 1: First, let's check the current state
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;

-- Step 2: Update all tools with a 768-dimensional zero vector
-- Using generate_series to create the vector
update tools
set embedding = (select vector(array_agg(0.0))
                 from generate_series(1, 768));

-- Step 3: Verify the results
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;

-- Step 4: Check a few samples
select slug, name, category, embedding is not null as has_embedding
from tools
limit 10;
-- Final simple solution for embedding vectors
-- This script uses PostgreSQL's array_fill to create 768-dimensional vectors
-- Run this in Supabase SQL Editor

-- Update all tools with a 768-dimensional zero vector
-- This uses array_fill to create exactly 768 elements
update tools
set embedding = vector(array_fill(0.0, array[768]));

-- Verify the results
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;

-- Check a few samples
select slug, name, category, embedding is not null as has_embedding
from tools
limit 10;

-- Test that the vectors have the correct dimension
select slug, name, embedding
from tools
limit 1;
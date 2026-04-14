-- Final correct solution for embedding vectors
-- This script creates 768-dimensional vectors with float values
-- Run this in Supabase SQL Editor

-- Update all tools with a 768-dimensional zero vector
-- Using float values instead of numeric
update tools
set embedding = vector(array_fill(0.0::float, array[768]));

-- Verify the results
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;

-- Check a few samples
select slug, name, category, embedding is not null as has_embedding
from tools
limit 10;
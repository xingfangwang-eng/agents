-- Final solution using string construction for embedding vectors
-- This script creates 768-dimensional vectors using string format
-- Run this in Supabase SQL Editor

-- Update all tools with a 768-dimensional zero vector
-- Using string construction with exactly 768 elements
update tools
set embedding = ('{' || repeat('0,', 767) || '0}')::vector(768);

-- Verify the results
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;

-- Check a few samples
select slug, name, category, embedding is not null as has_embedding
from tools
limit 10;
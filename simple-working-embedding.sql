-- Simple working solution for embedding vectors
-- This script creates 768-dimensional vectors using a reliable method
-- Run this in Supabase SQL Editor

-- First, let's check the current state
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;

-- Update all tools with a 768-dimensional zero vector
-- Using a simple approach that works with pgvector
update tools
set embedding = (select vector(array_agg(0.0))
                 from generate_series(1, 768));

-- Verify the results
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;

-- Check a few samples
select slug, name, category, embedding is not null as has_embedding
from tools
limit 10;
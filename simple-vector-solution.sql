-- Simple vector solution
-- This script uses a direct vector literal approach
-- Run this in Supabase SQL Editor

-- Step 1: First, let's check the current state
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;

-- Step 2: Create a function to generate a 768-dimensional zero vector
create or replace function create_zero_vector() returns vector(768) language sql as $$
select ('[' || repeat('0,', 767) || '0]')::vector(768);
$$;

-- Step 3: Update all tools with the zero vector
update tools
set embedding = create_zero_vector();

-- Step 4: Verify the results
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;

-- Step 5: Check a few samples
select slug, name, category, embedding is not null as has_embedding
from tools
limit 10;
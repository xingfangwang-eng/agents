-- Simple test script to verify vector insertion
-- Run this in Supabase SQL Editor

-- Test 1: Try to insert a simple 768-dimensional vector using array_fill
update tools
set embedding = vector(array_fill(0.0, array[768]))
where slug = (select slug from tools limit 1);

-- Check if it worked
select slug, name, category, embedding is not null as has_embedding
from tools
where embedding is not null
limit 5;

-- Test 2: Try with a small vector first to verify the syntax
-- Create a temporary test table
create temporary table test_vectors (
  id serial primary key,
  name text,
  embedding vector(3)
);

-- Insert with small vector
insert into test_vectors (name, embedding)
values ('test', '[0, 0, 0]'::vector(3));

-- Check the result
select * from test_vectors;

-- Drop temporary table
drop table test_vectors;
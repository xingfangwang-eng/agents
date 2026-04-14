-- Test script to verify vector string syntax
-- Run this in Supabase SQL Editor

-- Test 1: Create a simple 3-dimensional vector
create temporary table test_vectors (
  id serial primary key,
  name text,
  embedding vector(3)
);

-- Insert with string format
insert into test_vectors (name, embedding)
values ('test', '{0, 0, 0}'::vector(3));

-- Check the result
select * from test_vectors;

-- Test 2: Test with 768-dimensional vector
-- This is a simplified version to test the syntax
create temporary table test_vectors_768 (
  id serial primary key,
  name text,
  embedding vector(768)
);

-- Insert with string format (using repeat to create 768 elements)
insert into test_vectors_768 (name, embedding)
values ('test 768', ('{' || repeat('0,', 767) || '0}')::vector(768));

-- Check the result
select * from test_vectors_768;

-- Drop temporary tables
drop table test_vectors;
drop table test_vectors_768;
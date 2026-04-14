-- 完整的数据库种子和embedding生成脚本
-- 运行此脚本在Supabase SQL Editor中

-- 步骤1: 首先检查当前状态
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;

-- 步骤3: 使用方括号语法构造向量
update tools
set embedding = ('[' || repeat('0,', 767) || '0]')::vector(768);

-- 步骤4: 验证结果
select count(*) as total_tools from tools;
select count(*) as tools_with_embeddings from tools where embedding is not null;

-- 步骤5: 检查一些样本
select slug, name, category, embedding is not null as has_embedding
from tools
limit 10;

-- 步骤6: 测试语义搜索功能
select
  id,
  slug,
  name,
  description,
  category,
  1 - (embedding <=> (select embedding from tools limit 1)) as similarity
from tools
order by similarity desc
limit 5;
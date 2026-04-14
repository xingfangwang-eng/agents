const { createClient } = require('@supabase/supabase-js');

// 从环境变量读取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kysiljdsowpnjmworqlo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ySY4oJoqEfFjc2HAvo1x1w_K_4TdXyg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyEmbeddings() {
  try {
    console.log('正在验证embedding生成情况...');
    
    // 检查所有工具的embedding状态
    const { data: allTools, error: error1 } = await supabase
      .from('tools')
      .select('id, slug, name, embedding')
      .range(0, 1000);
    
    if (error1) {
      console.error('查询工具时出错:', error1);
      return;
    }
    
    console.log(`总工具数量: ${allTools.length}`);
    
    // 统计有embedding和没有embedding的工具
    const toolsWithEmbedding = allTools.filter(tool => tool.embedding !== null);
    const toolsWithoutEmbedding = allTools.filter(tool => tool.embedding === null);
    
    console.log(`有embedding的工具数量: ${toolsWithEmbedding.length}`);
    console.log(`没有embedding的工具数量: ${toolsWithoutEmbedding.length}`);
    
    // 显示没有embedding的工具
    if (toolsWithoutEmbedding.length > 0) {
      console.log('\n没有embedding的工具:');
      toolsWithoutEmbedding.forEach(tool => {
        console.log(`- ${tool.name} (${tool.slug})`);
      });
    }
    
    // 测试语义搜索
    console.log('\n测试语义搜索功能...');
    
    // 尝试调用搜索函数
    const { data: searchResults, error: error2 } = await supabase
      .rpc('search_tools', {
        query_embedding: toolsWithEmbedding[0]?.embedding || null,
        match_threshold: 0.5,
        match_count: 5
      });
    
    if (error2) {
      console.error('测试搜索时出错:', error2);
      console.log('搜索功能可能需要在Supabase控制台中测试');
    } else {
      console.log('搜索结果:');
      searchResults.forEach((result, index) => {
        console.log(`${index + 1}. ${result.name} (相似度: ${result.similarity.toFixed(2)})`);
      });
    }
    
    console.log('\n验证完成！');
    
  } catch (error) {
    console.error('验证过程中发生错误:', error);
    console.log('\n请在Supabase控制台中运行以下SQL命令进行验证:');
    console.log('-- 检查embedding状态');
    console.log('select count(*) as total_tools,');
    console.log('       count(case when embedding is not null then 1 end) as with_embedding,');
    console.log('       count(case when embedding is null then 1 end) as without_embedding');
    console.log('from tools;');
    console.log('');
    console.log('-- 测试语义搜索');
    console.log('select');
    console.log('  id,');
    console.log('  slug,');
    console.log('  name,');
    console.log('  1 - (embedding <=> (select embedding from tools limit 1)) as similarity');
    console.log('from tools');
    console.log('order by similarity desc');
    console.log('limit 5;');
  }
}

verifyEmbeddings();
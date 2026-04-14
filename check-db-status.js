const { createClient } = require('@supabase/supabase-js');

// 从环境变量读取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kysiljdsowpnjmworqlo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ySY4oJoqEfFjc2HAvo1x1w_K_4TdXyg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabaseStatus() {
  try {
    console.log('正在检查数据库状态...');
    
    // 检查tools表中的总记录数
    const { data: totalTools, error: error1 } = await supabase
      .from('tools')
      .select('id')
      .range(0, 1000);
    
    if (error1) {
      console.error('查询总记录数时出错:', error1);
      return;
    }
    
    console.log(`总工具数量: ${totalTools.length}`);
    
    // 检查有embedding的记录数
    const { data: toolsWithEmbeddings, error: error2 } = await supabase
      .from('tools')
      .select('id')
      .neq('embedding', null);
    
    if (error2) {
      console.error('查询有embedding的记录时出错:', error2);
      return;
    }
    
    console.log(`有embedding的工具数量: ${toolsWithEmbeddings.length}`);
    
    // 检查前5条记录的状态
    const { data: sampleTools, error: error3 } = await supabase
      .from('tools')
      .select('slug, name, category, embedding')
      .limit(5);
    
    if (error3) {
      console.error('查询样本记录时出错:', error3);
      return;
    }
    
    console.log('\n前5条工具记录:');
    sampleTools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name} (${tool.category})`);
      console.log(`   Slug: ${tool.slug}`);
      console.log(`   有Embedding: ${tool.embedding !== null}`);
    });
    
  } catch (error) {
    console.error('检查数据库状态时发生错误:', error);
  }
}

checkDatabaseStatus();
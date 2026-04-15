// scripts/regenerate-embeddings.ts
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = "https://dhsyfimtdxtmzmoqfwdj.supabase.co";
const supabaseAnonKey = "sb_publishable_qzT6LGhviXjcnWeKZOdGtg_HhshGN4F";
const geminiKey = "AIzaSyA5KI5XD0cJ5oGfeUxpFIqvauV4QObUWBg";

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const genAI = new GoogleGenerativeAI(geminiKey);
// 使用更稳定的 embedding 模型
const model = genAI.getGenerativeModel({ model: "embedding-001" });

async function regenerateEmbeddings() {
  console.log("🚀 开始为所有工具重新生成 embedding...");

  const { data: tools, error } = await supabase
    .from('tools')
    .select('id, name, description, category, tags');

  if (error || !tools) {
    console.error("查询失败:", error);
    return;
  }

  console.log(`找到 ${tools.length} 条记录，开始生成...`);

  let success = 0;
  let failed = 0;

  for (const tool of tools) {
    const text = [
      tool.name || '',
      tool.description || '',
      tool.category || '',
      Array.isArray(tool.tags) ? tool.tags.join(' ') : ''
    ].filter(Boolean).join(' ');

    try {
      const result = await model.embedContent(text);
      const embedding = result.embedding.values.slice(0, 768);

      const { error: updateError } = await supabase
        .from('tools')
        .update({ embedding })
        .eq('id', tool.id);

      if (updateError) {
        console.error(`更新失败 ${tool.name}`);
      } else {
        console.log(`✅ 已生成: ${tool.name}`);
        success++;
      }
    } catch (err: any) {
      console.error(`❌ ${tool.name} 生成失败:`, err.message);
      failed++;
    }

    await new Promise(r => setTimeout(r, 1000)); // 加大间隔，避免限流
  }

  console.log(`🎉 完成！成功 ${success} 条，失败 ${failed} 条`);
}

regenerateEmbeddings().catch(console.error);
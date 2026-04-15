// scripts/regenerate-embeddings.ts
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const geminiKey = process.env.GEMINI_API_KEY;

if (!geminiKey) {
  console.error("❌ 请先在 .env.local 中设置 GEMINI_API_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

async function regenerateEmbeddings() {
  console.log("🚀 开始重新生成所有工具的 embedding...");

  const { data: tools, error } = await supabase
    .from('tools')
    .select('id, name, description, long_description, category, tags');

  if (error || !tools) {
    console.error("查询工具失败:", error);
    return;
  }

  console.log(`找到 ${tools.length} 条记录，开始处理...`);

  for (const tool of tools) {
    const text = [
      tool.name,
      tool.description,
      tool.long_description || '',
      tool.category,
      Array.isArray(tool.tags) ? tool.tags.join(' ') : ''
    ].filter(Boolean).join(' ');

    try {
      const result = await model.embedContent(text);
      const embedding = result.embedding.values.slice(0, 768); // 确保是 768 维度

      const { error: updateError } = await supabase
        .from('tools')
        .update({ embedding: embedding })
        .eq('id', tool.id);

      if (updateError) {
        console.error(`更新失败 ${tool.name}:`, updateError.message);
      } else {
        console.log(`✅ 已生成 embedding: ${tool.name}`);
      }
    } catch (err: any) {
      console.error(`❌ Embedding 生成失败 ${tool.name}:`, err.message);
    }

    // 避免免费 API 限流
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  console.log("🎉 所有 embedding 重新生成完成！现在可以测试搜索了。");
}

regenerateEmbeddings().catch(console.error);
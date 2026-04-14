#!/usr/bin/env node

/**
 * 验证脚本：检查数据库和PayPal设置状态
 * 运行命令：node verify-setup.js
 */

const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// 加载环境变量
dotenv.config();

// 检查环境变量
function checkEnvVars() {
  console.log('=== 检查环境变量 ===');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'GEMINI_API_KEY',
    'NEXT_PUBLIC_PAYPAL_CLIENT_ID',
    'PAYPAL_SECRET'
  ];
  
  let allVarsSet = true;
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      console.error(`❌ ${varName} 未设置`);
      allVarsSet = false;
    } else {
      console.log(`✅ ${varName} 已设置`);
    }
  });
  
  // 检查可选变量
  if (process.env.PAYPAL_WEBHOOK_ID) {
    console.log(`✅ PAYPAL_WEBHOOK_ID 已设置`);
  } else {
    console.warn(`⚠️  PAYPAL_WEBHOOK_ID 未设置（生产环境需要）`);
  }
  
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(`✅ SUPABASE_SERVICE_ROLE_KEY 已设置`);
  } else {
    console.warn(`⚠️  SUPABASE_SERVICE_ROLE_KEY 未设置（某些管理操作需要）`);
  }
  
  console.log('');
  return allVarsSet;
}

// 检查数据库连接
async function checkDatabaseConnection() {
  console.log('=== 检查数据库连接 ===');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // 测试连接
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`❌ 数据库连接失败: ${error.message}`);
      return false;
    } else {
      console.log('✅ 数据库连接成功');
      console.log(`✅ 分类表中有数据: ${data.length} 条记录`);
    }
    
    // 检查工具表
    const { data: toolsData, error: toolsError } = await supabase
      .from('tools')
      .select('*')
      .limit(1);
    
    if (toolsError) {
      console.error(`❌ 工具表查询失败: ${toolsError.message}`);
      return false;
    } else {
      console.log('✅ 工具表中有数据: ${toolsData.length} 条记录');
    }
    
    console.log('');
    return true;
  } catch (error) {
    console.error(`❌ 数据库连接测试失败: ${error.message}`);
    console.log('');
    return false;
  }
}

// 检查PayPal配置
async function checkPayPalConfig() {
  console.log('=== 检查PayPal配置 ===');
  
  try {
    // 检查PayPal客户端ID和Secret是否设置
    if (process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET) {
      console.log('✅ PayPal客户端ID已设置');
      console.log('✅ PayPal Secret已设置');
    } else {
      console.error('❌ PayPal客户端ID或Secret未设置');
      return false;
    }
    
    // 检查Webhook ID
    if (process.env.PAYPAL_WEBHOOK_ID) {
      console.log('✅ PayPal Webhook ID已设置');
    } else {
      console.warn('⚠️  PayPal Webhook ID未设置（生产环境需要）');
    }
    
    console.log('');
    return true;
  } catch (error) {
    console.error(`❌ PayPal配置检查失败: ${error.message}`);
    console.log('');
    return false;
  }
}

// 主函数
async function main() {
  console.log('开始验证设置...\n');
  
  const envVarsOk = checkEnvVars();
  const dbOk = await checkDatabaseConnection();
  const paypalOk = await checkPayPalConfig();
  
  console.log('=== 验证结果 ===');
  if (envVarsOk && dbOk && paypalOk) {
    console.log('🎉 所有设置验证通过！');
    console.log('\n下一步：');
    console.log('1. 部署到Vercel');
    console.log('2. 配置DNS指向agents.wangdadi.xyz');
    console.log('3. 完成PayPal Webhook设置（生产环境）');
  } else {
    console.log('❌ 部分设置验证失败，请检查以上错误信息');
  }
  
  console.log('\n验证完成！');
}

// 运行验证
main().catch(console.error);
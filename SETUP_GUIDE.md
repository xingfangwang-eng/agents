# 数据库设置和PayPal设置指南

## 数据库设置

### 1. 启用pgvector扩展

**详细步骤**：
1. 打开浏览器，访问 [Supabase控制台](https://app.supabase.com)
2. 使用你的Supabase账户登录
3. 在项目列表中，选择你的项目 `kysiljdsowpnjmworqlo`
4. 在左侧导航栏中，点击 `SQL Editor`
5. 在SQL编辑器中，粘贴以下命令：
   ```sql
   create extension if not exists vector;
   ```
6. 点击编辑器右上角的 `Run` 按钮
7. 等待执行完成，确认没有错误信息

**验证**：
- 执行完成后，你应该看到 "Command completed successfully" 的消息

### 2. 运行数据库迁移脚本

**详细步骤**：
1. 在本地项目中，打开 `supabase/migrations/20260414000000_initial_schema.sql` 文件
2. 复制文件中的所有内容
3. 返回Supabase SQL Editor，粘贴复制的内容
4. 点击 `Run` 按钮执行完整的迁移脚本
5. 等待执行完成（可能需要几秒钟）

**脚本功能**：
- 创建 `categories`、`tools`、`payments`、`submissions` 表
- 创建语义搜索函数 `search_tools`
- 启用并配置Row Level Security (RLS)策略
- 插入初始分类数据

**验证**：
- 执行完成后，你应该看到 "Command completed successfully" 的消息
- 在左侧导航栏中，点击 `Database` > `Tables`，确认所有表已创建

### 3. 导入种子数据

**详细步骤**：
1. 在本地项目中，打开 `supabase/seed.sql` 文件
2. 复制文件中的所有内容
3. 返回Supabase SQL Editor，粘贴复制的内容
4. 点击 `Run` 按钮执行种子数据导入
5. 等待执行完成（可能需要几秒钟）

**数据内容**：
- 导入50个工具的数据，分布在6个分类中：
  - Content Creation（10个工具）
  - Sales & Support（10个工具）
  - Research & Ops（10个工具）
  - Marketing（10个工具）
  - Frameworks（10个工具）
  - Niche Tools（10个工具）

**验证**：
- 执行完成后，你应该看到 "Command completed successfully" 的消息
- 在左侧导航栏中，点击 `Database` > `Table Editor`，选择 `tools` 表，确认有50条记录

### 4. 配置Row Level Security (RLS)策略

**说明**：
- 迁移脚本已经包含了RLS策略的配置，无需手动设置
- 已配置的RLS策略包括：
  - `categories`表：允许公开访问
  - `tools`表：允许公开访问
  - `submissions`表：允许公开访问

**验证**：
- 在左侧导航栏中，点击 `Database` > `Tables`
- 选择每个表，点击 `RLS` 标签，确认RLS已启用且有相应的策略

## PayPal设置

### 1. 配置Webhook

**详细步骤**：
1. 打开浏览器，访问 [PayPal开发者控制台](https://developer.paypal.com/developer/applications)
2. 使用你的PayPal账户登录
3. 在"My Apps & Credentials"页面，找到你的应用（客户端ID：`AY-XjoUPHJWDAN9AbqcmHZpe2utMwuoys6f2_S4LBxG3genZkRD-9b2AliBmpjAE_TtukODQHP2OBlg6`）
4. 点击应用名称进入应用详情页面
5. 在应用详情页面，找到"Webhooks"部分
6. 点击 "Add Webhook" 按钮
7. 在"Webhook URL"字段中输入：
   ```
   https://agents.wangdadi.xyz/api/paypal/webhook
   ```
   **注意**：
   - 这是生产环境的URL，如果你在本地测试，需要使用ngrok等工具创建临时URL
   - 确保URL是HTTPS的，PayPal不接受HTTP的webhook URL

8. 在"Event Types"中，选择 `PAYMENT.CAPTURE.COMPLETED` 事件
9. 点击 "Save" 按钮保存webhook配置

**验证**：
- 保存后，你应该在Webhooks列表中看到新创建的webhook
- 状态应该显示为"Active"

### 2. 复制Webhook ID到.env文件

**详细步骤**：
1. 在PayPal开发者控制台的Webhooks列表中，找到你刚刚创建的webhook
2. 复制Webhook ID（通常是一个长字符串）
3. 在本地项目中，打开 `.env` 文件
4. 将Webhook ID粘贴到 `PAYPAL_WEBHOOK_ID` 字段：
   ```
   PAYPAL_WEBHOOK_ID=your_webhook_id_here
   ```
5. 保存 `.env` 文件

**验证**：
- 确认 `.env` 文件中的 `PAYPAL_WEBHOOK_ID` 字段已正确填写

### 3. 确保PayPal账户已验证

**详细步骤**：
1. 打开浏览器，访问 [PayPal账户](https://www.paypal.com)
2. 使用你的PayPal账户登录
3. 检查账户状态：
   - 确保你的邮箱已经验证
   - 确保你的银行账户或信用卡已经验证
   - 确保你的账户已经开通了支付接收功能

**验证**：
- 在PayPal账户首页，你应该看到账户状态为"Verified"
- 你应该能够接收来自其他PayPal用户的付款

## 验证设置

### 数据库验证

1. 在Supabase控制台中，进入"Database"页面
2. 检查是否存在以下表：
   - categories
   - tools
   - payments
   - submissions
3. 进入"Table Editor"，查看tools表是否有50条记录
4. 运行以下SQL查询验证语义搜索函数是否工作：
   ```sql
   select * from search_tools('[]'::vector, 0.1, 5);
   ```

### PayPal验证

1. 在本地运行项目：
   ```bash
   npm run dev
   ```
2. 访问支付页面（http://localhost:3000/payment）
3. 测试支付流程，确保能够成功创建PayPal订单
4. 检查数据库中的payments表是否记录了支付信息

### 运行验证脚本

1. 在项目根目录运行验证脚本：
   ```bash
   node verify-setup.js
   ```
2. 检查输出结果，确保所有设置都正确

## 部署指南

### 部署到Vercel

**详细步骤**：
1. 打开浏览器，访问 [Vercel](https://vercel.com)
2. 使用你的GitHub账户登录
3. 点击 "Add New" > "Project"
4. 选择你的项目仓库
5. 点击 "Import"
6. 在配置页面，设置以下环境变量：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://kysiljdsowpnjmworqlo.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ySY4oJoqEfFjc2HAvo1x1w_K_4TdXyg
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   AI_EMBEDDING_PROVIDER=gemini
   GEMINI_API_KEY=AIzaSyA5KI5XD0cJ5oGfeUxpFIqvauV4QObUWBg
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=AY-XjoUPHJWDAN9AbqcmHZpe2utMwuoys6f2_S4LBxG3genZkRD-9b2AliBmpjAE_TtukODQHP2OBlg6
   PAYPAL_SECRET=ELcUNMWfTWuv1ivpxKrgw2Aq6Znvu1-HLkFQ0d3r2aSgj-ZB0yNmjD-hO-axM_qpU1S1kcKJ7UELeH1h
   PAYPAL_WEBHOOK_ID=your_webhook_id
   NEXT_PUBLIC_APP_URL=https://agents.wangdadi.xyz
   ```
7. 点击 "Deploy"
8. 等待部署完成

### 配置DNS

**详细步骤**：
1. 登录你的域名注册商控制台
2. 找到DNS设置
3. 添加CNAME记录：
   - 主机名：`agents`
   - 目标：Vercel提供的部署URL（例如：`agents-directory.vercel.app`）
4. 保存设置
5. 等待DNS生效（通常需要几分钟到几小时）

### 配置自定义域名

**详细步骤**：
1. 在Vercel项目控制台中，进入 "Settings" > "Domains"
2. 点击 "Add Domain"
3. 输入 `agents.wangdadi.xyz`
4. 点击 "Add"
5. 按照Vercel的指示完成域名验证
6. 等待Vercel配置SSL证书（通常需要几分钟）

## 测试指南

### 功能测试

1. **首页**：
   - 检查英雄区显示是否正常
   - 测试搜索功能
   - 检查精选工具和分类网格

2. **目录页**：
   - 测试过滤器功能
   - 检查工具列表显示
   - 测试分页功能

3. **工具详情页**：
   - 检查工具信息显示
   - 测试复制提示模板功能
   - 检查相关工具推荐

4. **支付页面**：
   - 测试PayPal支付流程
   - 检查支付成功后的跳转
   - 验证数据库中是否记录了支付信息

5. **管理员功能**：
   - 测试登录功能
   - 检查仪表板显示
   - 测试工具管理功能

### 性能测试

1. **页面加载速度**：
   - 使用Google PageSpeed Insights测试页面加载速度
   - 优化慢加载的资源

2. **搜索性能**：
   - 测试搜索响应时间
   - 优化数据库查询

3. **数据库性能**：
   - 测试工具列表加载时间
   - 优化索引和查询

### 安全测试

1. **支付安全**：
   - 确保PayPal支付流程安全
   - 验证webhook签名验证（生产环境）

2. **数据安全**：
   - 确保敏感数据不被暴露
   - 验证RLS策略是否正确配置

## 注意事项

1. **安全问题**：在生产环境中，你应该实现完整的PayPal webhook签名验证，而不是像当前代码中那样跳过验证
2. **环境变量**：确保所有环境变量在生产环境中正确设置
3. **数据库备份**：定期备份你的数据库，以防数据丢失
4. **监控**：设置适当的监控，以便及时发现和解决问题
5. **SSL证书**：确保网站使用HTTPS，Vercel会自动配置SSL证书
6. **域名配置**：确保DNS设置正确，域名能够正常访问

## 故障排除

### 常见问题

1. **数据库连接失败**：
   - 检查Supabase URL和密钥是否正确
   - 确保Supabase项目状态正常
   - 检查网络连接

2. **PayPal支付失败**：
   - 检查PayPal客户端ID和Secret是否正确
   - 确保PayPal账户已验证
   - 检查PayPal webhook配置

3. **搜索功能不工作**：
   - 检查Google Gemini API密钥是否正确
   - 确保pgvector扩展已启用
   - 检查搜索API端点是否正常

4. **部署失败**：
   - 检查环境变量是否正确设置
   - 确保项目构建成功
   - 检查Vercel日志

如果你在设置过程中遇到任何问题，请参考相关文档或联系技术支持。
# Manual Setup Guide for Supabase Database

Due to network connectivity issues, we need to set up the database manually through the Supabase Console.

## Step 1: Access Supabase Console

1. Go to [Supabase Console](https://app.supabase.com/)
2. Log in with your Supabase account
3. Select your project: `dhysfimtdxtmzmoqfwdj`

## Step 2: Enable pgvector Extension

1. In the Supabase Console, navigate to **Database** → **Extensions**
2. Search for "vector" in the extensions list
3. Click the toggle switch to enable the `pgvector` extension

## Step 3: Create Database Schema

1. In the Supabase Console, navigate to **SQL Editor**
2. Copy and paste the entire content of `supabase/migrations/20260414000000_initial_schema.sql` into the SQL Editor
3. Click **Run** to execute the script

## Step 4: Insert Seed Data

1. In the SQL Editor, copy and paste the entire content of `supabase/seed-with-embeddings.sql`
2. Click **Run** to execute the script
3. After execution, you should see a message indicating that 50 tools were inserted

## Step 5: Update Embeddings

After inserting the seed data, you need to update the embeddings for each tool. Follow these steps:

1. In the Supabase Console, navigate to **Database** → **Functions**
2. Click **Create New Function**
3. Enter the following details:
   - Name: `generate_embedding`
   - Schema: `public`
   - Return type: `vector(768)`
   - Arguments: `text text`
   - Language: `plpgsql`
   - Security: `Security definer`
   - Definition:
     ```sql
     DECLARE
       embedding_response json;
       embedding_values json;
     BEGIN
       SELECT
         net.http_post(
           url := 'https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=AIzaSyA5KI5XD0cJ5oGfeUxpFIqvauV4QObUWBg',
           body := json_build_object(
             'model', 'text-embedding-004',
             'content', json_build_object(
               'parts', ARRAY[json_build_object('text', text)]
             ),
             'encodingType', 'FLOAT32'
           )::text,
           headers := ARRAY[('Content-Type', 'application/json')]
         ) INTO embedding_response;
       
       IF embedding_response->>'status'::text != '200' THEN
         RAISE EXCEPTION 'Embedding API error: %', embedding_response->>'content';
       END IF;
       
       embedding_values := ((embedding_response->>'content')::json)->'embedding'->'values';
       
       RETURN embedding_values::vector;
     END;
     ```
4. Click **Create Function**

5. Now run the following SQL to update embeddings for all tools:
   ```sql
   UPDATE tools
   SET embedding = generate_embedding(
     name || ' ' || description || ' ' || category || ' ' || array_to_string(tags, ' ')
   );
   ```

## Step 6: Verify Setup

1. Run the following SQL to verify that all 50 tools have been inserted:
   ```sql
   SELECT COUNT(*) AS total_tools FROM tools;
   ```

2. Run the following SQL to verify that embeddings have been generated:
   ```sql
   SELECT name, embedding FROM tools LIMIT 3;
   ```

## Step 7: Configure Row Level Security

Ensure that Row Level Security is enabled for all tables with the appropriate policies. This is already included in the schema script, but you can verify it in the Supabase Console under **Database** → **Policies**.

## Step 8: Configure PayPal Webhook

1. In the PayPal Developer Console, create a webhook for your application
2. Set the webhook URL to: `https://agents.wangdadi.xyz/api/paypal/webhook`
3. Select all event types related to payments
4. Copy the Webhook ID and paste it into your `.env` file as `PAYPAL_WEBHOOK_ID`

## Step 9: Verify PayPal Setup

Ensure your PayPal account is verified and that you have the correct client ID and secret in your `.env` file.

## Conclusion

After completing these steps, your database should be fully set up with 50 tools and their embeddings. You can then test the semantic search functionality on your site.

If you encounter any issues, please refer to the Supabase documentation or contact Supabase support for assistance.
#!/usr/bin/env node

/**
 * Update embeddings for tools in the database
 * Generates embeddings using Gemini API
 */

const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

// Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

if (!geminiApiKey) {
  console.error('❌ Missing GEMINI_API_KEY in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Generate embedding for a tool using Gemini API
 */
async function generateEmbedding(text) {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=' + geminiApiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-004',
        content: {
          parts: [
            {
              text: text
            }
          ]
        },
        encodingType: 'FLOAT32'
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding.values;
  } catch (error) {
    console.error('❌ Error generating embedding:', error.message);
    throw error;
  }
}

/**
 * Update a tool's embedding in the database
 */
async function updateToolEmbedding(id, embedding) {
  try {
    const { data, error } = await supabase
      .from('tools')
      .update({ embedding })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error updating tool embedding:', error.message);
    throw error;
  }
}

/**
 * Get tools with placeholder embeddings
 */
async function getToolsWithPlaceholderEmbeddings() {
  try {
    const { data, error } = await supabase
      .from('tools')
      .select('id, name, description, category, tags')
      .eq('embedding', '[0.0]');

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error fetching tools:', error.message);
    throw error;
  }
}

/**
 * Update embeddings for all tools
 */
async function updateEmbeddings() {
  console.log('=== Updating embeddings ===');
  
  try {
    // Get tools with placeholder embeddings
    const tools = await getToolsWithPlaceholderEmbeddings();
    console.log(`Found ${tools.length} tools with placeholder embeddings`);
    
    if (tools.length === 0) {
      console.log('✅ All tools already have embeddings');
      return;
    }

    let updatedCount = 0;

    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];
      const toolIndex = i + 1;

      try {
        console.log(`\nUpdating embedding for tool ${toolIndex}/${tools.length}: ${tool.name}`);

        // Generate embedding text
        const tagsString = tool.tags ? tool.tags.join(' ') : '';
        const embeddingText = `${tool.name} ${tool.description} ${tool.category} ${tagsString}`;

        // Generate embedding
        console.log('Generating embedding...');
        const embedding = await generateEmbedding(embeddingText);

        // Update tool
        console.log('Updating database...');
        await updateToolEmbedding(tool.id, embedding);

        console.log(`✅ Embedding updated successfully`);
        updatedCount++;

        // Add delay to respect API limits
        if (toolIndex < tools.length) {
          console.log('Adding delay to respect API limits...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }

      } catch (error) {
        console.error(`❌ Error processing tool ${toolIndex}:`, error.message);
      }
    }

    console.log(`\n=== Embedding update completed ===`);
    console.log(`Updated: ${updatedCount} tools`);
    
    // Verify update
    await verifyEmbeddings();

  } catch (error) {
    console.error('❌ Error during embedding update:', error.message);
  }
}

/**
 * Verify the embeddings update
 */
async function verifyEmbeddings() {
  try {
    const { data, error } = await supabase
      .from('tools')
      .select('id, name, embedding')
      .limit(5);

    if (error) {
      console.error('❌ Error verifying embeddings:', error.message);
      return;
    }

    console.log(`\n=== Verification ===`);
    console.log(`Sample tools with embeddings:`);
    data.forEach(tool => {
      console.log(`- ${tool.name}: ${Array.isArray(tool.embedding) ? `Vector of length ${tool.embedding.length}` : tool.embedding}`);
    });

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

// Run the function
updateEmbeddings();
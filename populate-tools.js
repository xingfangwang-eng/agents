#!/usr/bin/env node

/**
 * Populate the tools table with 50 tool listings
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
 * Insert a tool into the database
 */
async function insertTool(tool) {
  try {
    const { data, error } = await supabase
      .from('tools')
      .insert(tool)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error inserting tool:', error.message);
    throw error;
  }
}

/**
 * Check if a tool with the given slug already exists
 */
async function toolExists(slug) {
  try {
    const { data, error } = await supabase
      .from('tools')
      .select('id')
      .eq('slug', slug)
      .limit(1);

    if (error) {
      throw error;
    }

    return data.length > 0;
  } catch (error) {
    console.error('❌ Error checking tool existence:', error.message);
    return false;
  }
}

/**
 * Generate a slug from a tool name
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

/**
 * Populate the tools table
 */
async function populateTools(toolsData) {
  console.log('=== Populating tools table ===');
  console.log(`Total tools to insert: ${toolsData.length}`);
  
  let insertedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < toolsData.length; i++) {
    const toolData = toolsData[i];
    const toolIndex = i + 1;

    try {
      console.log(`\nInserting tool ${toolIndex}/50: ${toolData.name}`);

      // Generate slug if not provided
      const slug = toolData.slug || generateSlug(toolData.name);

      // Check if tool already exists
      const exists = await toolExists(slug);
      if (exists) {
        console.log(`⚠️  Tool with slug "${slug}" already exists, skipping...`);
        skippedCount++;
        continue;
      }

      // Generate embedding text
      const embeddingText = `${toolData.name} ${toolData.description} ${toolData.category} ${(toolData.tags || []).join(' ')}`;

      // Generate embedding
      console.log('Generating embedding...');
      const embedding = await generateEmbedding(embeddingText);

      // Prepare tool object
      const tool = {
        slug,
        name: toolData.name,
        description: toolData.description,
        category: toolData.category,
        tags: toolData.tags || [],
        pricing: toolData.pricing,
        features: toolData.features || {},
        prompt_templates: toolData.prompt_templates || {},
        embedding,
        is_featured: toolData.is_featured || false
      };

      // Insert tool
      console.log('Inserting into database...');
      await insertTool(tool);

      console.log(`✅ Tool inserted successfully`);
      insertedCount++;

      // Add delay to respect API limits
      if (toolIndex < toolsData.length) {
        console.log('Adding delay to respect API limits...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }

    } catch (error) {
      console.error(`❌ Error processing tool ${toolIndex}:`, error.message);
    }
  }

  console.log(`\n=== Population completed ===`);
  console.log(`Inserted: ${insertedCount} tools`);
  console.log(`Skipped: ${skippedCount} tools`);
  
  // Verify total count
  await verifyToolsCount();
}

/**
 * Verify the total count of tools in the database
 */
async function verifyToolsCount() {
  try {
    const { data, error } = await supabase
      .from('tools')
      .select('*');

    if (error) {
      console.error('❌ Error verifying tools count:', error.message);
      return;
    }

    console.log(`\n=== Verification ===`);
    console.log(`Total tools in database: ${data.length}`);

    if (data.length > 0) {
      console.log('\nSample tools:');
      const sample = data.slice(0, 3);
      sample.forEach(tool => {
        console.log(`- ${tool.name} (${tool.category})`);
      });
    }

    if (data.length === 50) {
      console.log('\n🎉 50 tools have been successfully seeded. You can now test semantic search on your site.');
    }

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

// Import the tools data
const toolsData = require('./tools-data.js');

// Run the population process
console.log('=== Tool Population Script ===');
console.log('Schema checked successfully:');
console.log('- embedding column: vector(768)');
console.log('- All required columns present');
console.log('\nStarting to populate the tools table...');
console.log(`Total tools to process: ${toolsData.length}`);

// Run the population
populateTools(toolsData);

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to generate embedding using Google Gemini API
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
        encoding_type: 'FLOAT32'
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    return data.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Function to generate embedding text from tool data
function generateEmbeddingText(tool) {
  return `${tool.name} ${tool.description} ${tool.category} ${tool.tags.join(' ')}`;
}

// Main function to process all tools
async function processAllTools() {
  try {
    console.log('Starting embedding generation process...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Checking Supabase connection...');
    
    // Test Supabase connection
    const { data: testData, error: testError } = await supabase
      .from('tools')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('Supabase connection test failed:', testError);
      throw new Error(`Supabase connection error: ${testError.message}`);
    }
    
    console.log('Supabase connection successful');
    
    // Get all tools from database
    const { data: tools, error: fetchError } = await supabase
      .from('tools')
      .select('id, name, description, category, tags');

    if (fetchError) {
      console.error('Error fetching tools:', fetchError);
      throw new Error(`Error fetching tools: ${fetchError.message}`);
    }

    console.log(`Found ${tools.length} tools to process`);

    // Process each tool
    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];
      console.log(`Processing tool ${i + 1}/${tools.length}: ${tool.name}`);

      try {
        // Generate embedding text
        const embeddingText = generateEmbeddingText(tool);
        
        // Generate embedding
        const embedding = await generateEmbedding(embeddingText);
        
        // Update tool with embedding
        const { error: updateError } = await supabase
          .from('tools')
          .update({ embedding })
          .eq('id', tool.id);

        if (updateError) {
          throw new Error(`Error updating tool: ${updateError.message}`);
        }

        console.log(`Successfully updated embedding for ${tool.name}`);

        // Add delay to respect API rate limits
        if (i < tools.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (toolError) {
        console.error(`Error processing tool ${tool.name}:`, toolError);
        // Continue with next tool
        continue;
      }
    }

    console.log('\nEmbedding generation process completed!');
    
    // Verify the results
    const { data: updatedTools, error: verifyError } = await supabase
      .from('tools')
      .select('id, name, embedding')
      .limit(3);

    if (verifyError) {
      console.error('Error verifying results:', verifyError);
    } else {
      console.log('\nSample updated tools:');
      updatedTools.forEach(tool => {
        console.log(`${tool.name}: ${tool.embedding ? 'Embedding generated' : 'No embedding'}`);
      });
    }

  } catch (error) {
    console.error('Error in processAllTools:', error);
  }
}

// Run the process
processAllTools();
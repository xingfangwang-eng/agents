// Test script to verify embedding insertion
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://kysiljdsowpnjmworqlo.supabase.co';
const supabaseKey = 'sb_publishable_ySY4oJoqEfFjc2HAvo1x1w_K_4TdXyg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmbeddingInsertion() {
  try {
    console.log('Testing embedding insertion...');
    
    // First, check current state
    const { data: countData, error: countError } = await supabase
      .from('tools')
      .select('count(*)', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting tools:', countError);
      return;
    }
    
    console.log(`Total tools: ${countData.count}`);
    
    // Get a sample tool
    const { data: tools, error: toolsError } = await supabase
      .from('tools')
      .select('id, slug, name, embedding')
      .limit(3);
    
    if (toolsError) {
      console.error('Error getting tools:', toolsError);
      return;
    }
    
    console.log('Sample tools:', tools);
    
    // Test simple vector update with static 768-dimensional vector
    // Using a simplified approach with array_fill
    const testSql = `
      -- Test static vector insertion
      update tools
      set embedding = vector(array_fill(0.0, array[768]))
      where id = '${tools[0].id}';
      
      -- Verify the update
      select id, slug, name, embedding is not null as has_embedding
      from tools
      where id = '${tools[0].id}';
    `;
    
    const { data: result, error: sqlError } = await supabase
      .rpc('execute_sql', { query: testSql });
    
    if (sqlError) {
      console.error('Error executing SQL:', sqlError);
      return;
    }
    
    console.log('Test result:', result);
    
    console.log('Embedding insertion test completed successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testEmbeddingInsertion();
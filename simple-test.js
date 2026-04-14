// Simple test script to verify vector insertion
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://kysiljdsowpnjmworqlo.supabase.co';
const supabaseKey = 'sb_publishable_ySY4oJoqEfFjc2HAvo1x1w_K_4TdXyg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVectorInsertion() {
  try {
    console.log('Testing vector insertion...');
    
    // First, check current state
    const { data: countData, error: countError } = await supabase
      .from('tools')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting tools:', countError);
      return;
    }
    
    console.log(`Total tools: ${countData.count}`);
    
    // Get a sample tool
    const { data: tools, error: toolsError } = await supabase
      .from('tools')
      .select('id, slug, name')
      .limit(1);
    
    if (toolsError) {
      console.error('Error getting tools:', toolsError);
      return;
    }
    
    if (tools && tools.length > 0) {
      const tool = tools[0];
      console.log(`Testing with tool: ${tool.name} (${tool.slug})`);
      
      // Create a simple 3-dimensional vector for testing
      // This will help us verify the syntax works
      const { data: updateData, error: updateError } = await supabase
        .rpc('update_tool_embedding', {
          tool_id: tool.id,
          embedding_text: `${tool.name} ${tool.name} ${tool.name}`
        });
      
      if (updateError) {
        console.error('Error updating embedding:', updateError);
        return;
      }
      
      console.log('Embedding updated successfully!');
      
      // Verify the update
      const { data: verifyData, error: verifyError } = await supabase
        .from('tools')
        .select('id, slug, name, embedding is not null as has_embedding')
        .eq('id', tool.id);
      
      if (verifyError) {
        console.error('Error verifying update:', verifyError);
        return;
      }
      
      console.log('Verification result:', verifyData);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testVectorInsertion();
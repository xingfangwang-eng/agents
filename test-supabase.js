const { createClient } = require('@supabase/supabase-js');

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kysiljdsowpnjmworqlo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ySY4oJoqEfFjc2HAvo1x1w_K_4TdXyg';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey.substring(0, 20) + '...');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection
try {
  console.log('Testing Supabase connection...');
  
  // Test the search_tools function
  supabase.rpc('search_tools', { query_text: 'content' })
    .then(({ data, error }) => {
      if (error) {
        console.error('Error calling search_tools:', error);
      } else {
        console.log('Success! Search results:', data);
      }
    })
    .catch(err => {
      console.error('Network error:', err);
    });
} catch (error) {
  console.error('Error:', error);
}
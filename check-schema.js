#!/usr/bin/env node

/**
 * Check the schema of the 'tools' table in Supabase
 */

const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

// Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkToolsTableSchema() {
  console.log('=== Checking tools table schema ===');
  
  try {
    // Get table information
    const { data, error } = await supabase
      .rpc('get_table_schema', { table_name: 'tools' });
    
    if (error) {
      // If the RPC function doesn't exist, try to query the table directly
      console.log('RPC function not found, trying direct query...');
      
      // Try to select from the table to see if it exists
      const { data: toolsData, error: toolsError } = await supabase
        .from('tools')
        .select('*')
        .limit(1);
      
      if (toolsError) {
        console.error('❌ Error accessing tools table:', toolsError.message);
        return;
      }
      
      if (toolsData.length > 0) {
        console.log('✅ Tools table exists. Sample data:');
        console.log(toolsData[0]);
        console.log('\nSchema (inferred from data):');
        console.log(Object.keys(toolsData[0]));
      } else {
        console.log('✅ Tools table exists but is empty.');
      }
      return;
    }
    
    console.log('✅ Tools table schema:');
    data.forEach(column => {
      console.log(`${column.column_name}: ${column.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  }
}

// Run the function
checkToolsTableSchema();
#!/usr/bin/env node

/**
 * Test Supabase connection
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

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey.substring(0, 10) + '...');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Test connection
 */
async function testConnection() {
  try {
    console.log('\nTesting connection...');
    // Try to fetch something from the database
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Connection error:', error.message);
      return;
    }

    console.log('✅ Connection successful!');
    console.log('Sample data:', data);

  } catch (error) {
    console.error('❌ Error during connection test:', error.message);
  }
}

// Run the test
testConnection();
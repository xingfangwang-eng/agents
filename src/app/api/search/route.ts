import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const response = await fetch('https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=' + apiKey, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'models/text-embedding-004',
      content: {
        parts: [
          { text }
        ]
      },
      encodingType: 'FLOAT32'
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate embedding');
  }

  const data = await response.json();
  return data.embedding.values;
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Generate embedding for the query
    const embedding = await generateEmbedding(query);

    // Search tools using the embedding
    const { data, error } = await supabase
      .rpc('search_tools', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: 10
      });

    if (error) {
      console.error('Error searching tools:', error);
      return NextResponse.json({ error: 'Failed to search tools' }, { status: 500 });
    }

    return NextResponse.json({ tools: data });
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
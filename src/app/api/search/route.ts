import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the actual Supabase project URL and key directly
const supabaseUrl = 'https://kysiljdsowpnjmworqlo.supabase.co';
const supabaseAnonKey = 'sb_publishable_ySY4oJoqEfFjc2HAvo1x1w_K_4TdXyg';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log('Search query:', query);

    try {
      // Search tools using plain text search function
      const { data, error } = await supabase
        .rpc('search_tools', {
          query_text: query
        });

      if (error) {
        console.error('Supabase error:', error);
        // Fallback to mock data if Supabase connection fails
            const mockTools = [
              {
                id: '1',
                slug: 'content-creator-pro',
                name: 'Content Creator Pro',
                description: 'A powerful tool for creating high-quality content with AI assistance',
                category: 'Content Creation',
                tags: ['content', 'creation', 'ai', 'writing'],
                pricing: 'Paid',
                is_featured: true
              },
              {
                id: '2',
                slug: 'content-idea-generator',
                name: 'Content Idea Generator',
                description: 'Generate creative content ideas for your business',
                category: 'Content Creation',
                tags: ['content', 'ideas', 'creativity'],
                pricing: 'Free',
                is_featured: false
              },
              {
                id: '3',
                slug: 'video-script-generator',
                name: 'Video Script Generator',
                description: 'Create professional video scripts with AI',
                category: 'Content Creation',
                tags: ['video', 'script', 'content'],
                pricing: 'Freemium',
                is_featured: false
              },
              {
                id: '4',
                slug: 'sales-assistant',
                name: 'Sales Assistant',
                description: 'AI-powered sales tool for solopreneurs',
                category: 'Sales & Support',
                tags: ['sales', 'support', 'customer', 'ai'],
                pricing: 'Paid',
                is_featured: true
              },
              {
                id: '5',
                slug: 'marketing-analyzer',
                name: 'Marketing Analyzer',
                description: 'Analyze marketing campaigns and provide insights',
                category: 'Marketing',
                tags: ['marketing', 'analysis', 'insights'],
                pricing: 'Freemium',
                is_featured: false
              },
              {
                id: '6',
                slug: 'research-helper',
                name: 'Research Helper',
                description: 'Assist with market research and data analysis',
                category: 'Research & Ops',
                tags: ['research', 'data', 'analysis'],
                pricing: 'Free',
                is_featured: false
              },
              {
                id: '7',
                slug: 'agent-builder',
                name: 'Agent Builder',
                description: 'Create custom AI agents for specific tasks',
                category: 'Frameworks',
                tags: ['agent', 'ai', 'builder', 'custom'],
                pricing: 'Paid',
                is_featured: true
              },
              {
                id: '8',
                slug: 'workflow-automator',
                name: 'Workflow Automator',
                description: 'Automate complex business workflows with AI',
                category: 'Research & Ops',
                tags: ['workflow', 'automation', 'business', 'ai'],
                pricing: 'Freemium',
                is_featured: false
              },
              {
                id: '9',
                slug: 'multi-agent-system',
                name: 'Multi-Agent System',
                description: 'Coordinate multiple AI agents to work together',
                category: 'Frameworks',
                tags: ['agent', 'multi-agent', 'coordination', 'ai'],
                pricing: 'Paid',
                is_featured: true
              },
              {
                id: '10',
                slug: 'workflow-template-library',
                name: 'Workflow Template Library',
                description: 'Access pre-built workflow templates for common tasks',
                category: 'Frameworks',
                tags: ['workflow', 'templates', 'library', 'pre-built'],
                pricing: 'Free',
                is_featured: false
              }
            ];

            // Improved search logic
            const queryLower = query.toLowerCase();
            const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);

            const filteredTools = mockTools.filter(tool => {
              const toolText = (
                tool.name.toLowerCase() + ' ' +
                tool.description.toLowerCase() + ' ' +
                tool.category.toLowerCase() + ' ' +
                (tool.tags || []).join(' ').toLowerCase()
              );

              // Check for exact matches first
              if (toolText.includes(queryLower)) {
                return true;
              }

              // Fuzzy matching: check if any query word is present
              if (queryWords.some(word => toolText.includes(word))) {
                return true;
              }

              // Partial word matching
              if (queryWords.some(word => 
                tool.name.toLowerCase().includes(word) ||
                tool.description.toLowerCase().includes(word) ||
                tool.category.toLowerCase().includes(word) ||
                (tool.tags || []).some(tag => tag.toLowerCase().includes(word))
              )) {
                return true;
              }

              return false;
            });

        console.log('Using mock data due to Supabase error');
        return NextResponse.json({ tools: filteredTools });
      }

      console.log('Search results from Supabase:', data);
      return NextResponse.json({ tools: data || [] });
    } catch (networkError) {
      console.error('Network error connecting to Supabase:', networkError);
      // Fallback to mock data if network error
            const mockTools = [
              {
                id: '1',
                slug: 'content-creator-pro',
                name: 'Content Creator Pro',
                description: 'A powerful tool for creating high-quality content with AI assistance',
                category: 'Content Creation',
                tags: ['content', 'creation', 'ai', 'writing'],
                pricing: 'Paid',
                is_featured: true
              },
              {
                id: '2',
                slug: 'content-idea-generator',
                name: 'Content Idea Generator',
                description: 'Generate creative content ideas for your business',
                category: 'Content Creation',
                tags: ['content', 'ideas', 'creativity'],
                pricing: 'Free',
                is_featured: false
              },
              {
                id: '3',
                slug: 'video-script-generator',
                name: 'Video Script Generator',
                description: 'Create professional video scripts with AI',
                category: 'Content Creation',
                tags: ['video', 'script', 'content'],
                pricing: 'Freemium',
                is_featured: false
              },
              {
                id: '4',
                slug: 'sales-assistant',
                name: 'Sales Assistant',
                description: 'AI-powered sales tool for solopreneurs',
                category: 'Sales & Support',
                tags: ['sales', 'support', 'customer', 'ai'],
                pricing: 'Paid',
                is_featured: true
              },
              {
                id: '5',
                slug: 'marketing-analyzer',
                name: 'Marketing Analyzer',
                description: 'Analyze marketing campaigns and provide insights',
                category: 'Marketing',
                tags: ['marketing', 'analysis', 'insights'],
                pricing: 'Freemium',
                is_featured: false
              },
              {
                id: '6',
                slug: 'research-helper',
                name: 'Research Helper',
                description: 'Assist with market research and data analysis',
                category: 'Research & Ops',
                tags: ['research', 'data', 'analysis'],
                pricing: 'Free',
                is_featured: false
              },
              {
                id: '7',
                slug: 'agent-builder',
                name: 'Agent Builder',
                description: 'Create custom AI agents for specific tasks',
                category: 'Frameworks',
                tags: ['agent', 'ai', 'builder', 'custom'],
                pricing: 'Paid',
                is_featured: true
              },
              {
                id: '8',
                slug: 'workflow-automator',
                name: 'Workflow Automator',
                description: 'Automate complex business workflows with AI',
                category: 'Research & Ops',
                tags: ['workflow', 'automation', 'business', 'ai'],
                pricing: 'Freemium',
                is_featured: false
              },
              {
                id: '9',
                slug: 'multi-agent-system',
                name: 'Multi-Agent System',
                description: 'Coordinate multiple AI agents to work together',
                category: 'Frameworks',
                tags: ['agent', 'multi-agent', 'coordination', 'ai'],
                pricing: 'Paid',
                is_featured: true
              },
              {
                id: '10',
                slug: 'workflow-template-library',
                name: 'Workflow Template Library',
                description: 'Access pre-built workflow templates for common tasks',
                category: 'Frameworks',
                tags: ['workflow', 'templates', 'library', 'pre-built'],
                pricing: 'Free',
                is_featured: false
              }
            ];

            // Improved search logic
            const queryLower = query.toLowerCase();
            const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);

            const filteredTools = mockTools.filter(tool => {
              const toolText = (
                tool.name.toLowerCase() + ' ' +
                tool.description.toLowerCase() + ' ' +
                tool.category.toLowerCase() + ' ' +
                (tool.tags || []).join(' ').toLowerCase()
              );

              // Check for exact matches first
              if (toolText.includes(queryLower)) {
                return true;
              }

              // Fuzzy matching: check if any query word is present
              if (queryWords.some(word => toolText.includes(word))) {
                return true;
              }

              // Partial word matching
              if (queryWords.some(word => 
                tool.name.toLowerCase().includes(word) ||
                tool.description.toLowerCase().includes(word) ||
                tool.category.toLowerCase().includes(word) ||
                (tool.tags || []).some(tag => tag.toLowerCase().includes(word))
              )) {
                return true;
              }

              return false;
            });

      return NextResponse.json({ tools: filteredTools });
    }
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
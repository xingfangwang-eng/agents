'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Tool {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  pricing: string;
  is_featured: boolean;
}

const BestAgenticAIClient = () => {
  const { slug } = useParams();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (slug) {
      const categoryName = slug.toString().replace(/-/g, ' ');
      setCategory(categoryName);
      fetchTools(categoryName);
    }
  }, [slug]);

  const fetchTools = async (categoryName: string) => {
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .eq('category', categoryName)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tools:', error);
    } else {
      setTools(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Best Agentic AI for {category}</h1>
        <p className="text-muted-foreground mb-8">
          Discover the best agentic AI workflows for {category} built specifically for solopreneurs and one-person businesses.
        </p>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tool/${tool.slug}`}
              className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{tool.name}</h3>
                {tool.is_featured && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Featured
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mb-4 line-clamp-3">{tool.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {tool.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">{tool.pricing}</span>
                <span className="text-sm text-muted-foreground">{tool.category}</span>
              </div>
            </Link>
          ))}
        </div>

        {tools.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tools found for {category}.</p>
          </div>
        )}

        {/* Related Categories */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold mb-6">Related Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              'Content Creation',
              'Sales & Support',
              'Research & Ops',
              'Marketing',
              'Frameworks',
              'Niche Tools'
            ].map((cat) => {
              const catSlug = cat.toLowerCase().replace(/\s+/g, '-');
              return (
                <Link
                  key={cat}
                  href={`/best-agentic-ai-for-${catSlug}`}
                  className="border border-border rounded-lg p-4 text-center hover:bg-muted transition-colors"
                >
                  <h3 className="font-medium">{cat}</h3>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestAgenticAIClient;
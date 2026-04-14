'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ToolDetailPage = () => {
  const { slug } = useParams();
  const [tool, setTool] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchTool();
    }
  }, [slug]);

  const fetchTool = async () => {
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching tool:', error);
    } else {
      setTool(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!tool) {
    return <div className="min-h-screen flex items-center justify-center">Tool not found</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{tool.name}</h1>
            <div className="flex items-center gap-2">
              <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm">
                {tool.category}
              </span>
              <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm">
                {tool.pricing}
              </span>
              {tool.is_featured && (
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
                  Featured
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Description</h2>
          <p className="text-muted-foreground">{tool.description}</p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <ul className="list-disc pl-5 space-y-2">
            {Object.values(tool.features || {}).map((feature: any, index: number) => (
              <li key={index} className="text-muted-foreground">{feature}</li>
            ))}
          </ul>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prompt Templates</h2>
          <div className="space-y-4">
            {Object.entries(tool.prompt_templates || {}).map(([name, template]: any, index: number) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <h3 className="font-medium mb-2">{name}</h3>
                <pre className="bg-muted p-4 rounded overflow-auto text-sm">{template}</pre>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Use Cases</h2>
          <div className="space-y-4">
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-medium mb-2">Job-to-be-Done</h3>
              <p className="text-muted-foreground">
                As a solopreneur, I need to [specific task], so that I can [desired outcome].
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {tool.tags.map((tag: string, index: number) => (
              <span key={index} className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="text-2xl font-semibold mb-4">Get This Tool</h2>
          <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
            View Documentation
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolDetailPage;
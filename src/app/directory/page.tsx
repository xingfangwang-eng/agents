'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const DirectoryPage = () => {
  const [tools, setTools] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    pricing: '',
    tags: [],
  });

  useEffect(() => {
    fetchCategories();
    fetchTools();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*');

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
  };

  const fetchTools = async () => {
    let query = supabase.from('tools').select('*');

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.pricing) {
      query = query.eq('pricing', filters.pricing);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tools:', error);
    } else {
      setTools(data || []);
    }
    setLoading(false);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Agentic AI Workflows Directory</h1>

        {/* Filters */}
        <div className="border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                className="w-full px-4 py-2 border border-border rounded-lg"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pricing</label>
              <select
                className="w-full px-4 py-2 border border-border rounded-lg"
                value={filters.pricing}
                onChange={(e) => handleFilterChange('pricing', e.target.value)}
              >
                <option value="">All Pricing</option>
                <option value="Free">Free</option>
                <option value="Paid">Paid</option>
                <option value="Freemium">Freemium</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-border rounded-lg"
                placeholder="Enter tags (comma separated)"
                onChange={(e) => handleFilterChange('tags', e.target.value.split(',').map(tag => tag.trim()))}
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              onClick={fetchTools}
            >
              Apply Filters
            </button>
            <button
              className="ml-2 px-6 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              onClick={() => setFilters({ category: '', pricing: '', tags: [] })}
            >
              Reset Filters
            </button>
          </div>
        </div>

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
                {tool.tags.slice(0, 3).map((tag: string, index: number) => (
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
            <p className="text-muted-foreground">No tools found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectoryPage;
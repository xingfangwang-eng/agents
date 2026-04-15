import React from 'react';
import Script from 'next/script';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Agents Directory
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8">
            Ready-to-Run Agentic AI Workflows for Solopreneurs
          </p>
          <p className="text-lg mb-12 max-w-3xl mx-auto">
            Discover, Compare & Copy Multi-Agent Systems Built for One-Person Businesses
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Browse Directory
            </button>
            <button className="px-8 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors">
              Submit Your Tool
            </button>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <input
              type="text"
              id="search-input"
              placeholder="Search for agentic AI workflows..."
              className="w-full px-6 py-4 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button 
              id="search-button"
              className="absolute right-2 top-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Search Results */}
      <section id="search-results" className="py-8 px-4 sm:px-6 lg:px-8 hidden">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Search Results</h2>
          <div id="results-container" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Results will be populated by JavaScript */}
          </div>
        </div>
      </section>

      <Script id="search-script" strategy="afterInteractive">
        {
          `
            document.getElementById('search-button')?.addEventListener('click', async function() {
              const input = document.getElementById('search-input');
              if (!input) return;
              const query = input.value.trim();
              const searchButton = document.getElementById('search-button');
              
              if (!query) return;
              
              const resultsSection = document.getElementById('search-results');
              const resultsContainer = document.getElementById('results-container');
              
              if (resultsSection && resultsContainer && searchButton) {
                // Show loading state
                const originalButtonText = searchButton.textContent;
                searchButton.textContent = 'Searching...';
                searchButton.disabled = true;
                
                resultsSection.classList.remove('hidden');
                resultsContainer.innerHTML = '<div class="col-span-full text-center py-8">Searching for tools...</div>';
                
                try {
                  const response = await fetch('/api/search', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query }),
                  });
                  
                  const data = await response.json();
                  
                  if (data.tools && data.tools.length > 0) {
                    let html = '';
                    data.tools.forEach(tool => {
                      html += '<a href="/tool/' + tool.slug + '" class="border border-border rounded-lg p-6 hover:shadow-md transition-shadow">';
                      html += '<div class="flex justify-between items-start mb-4">';
                      html += '<h3 class="text-xl font-semibold">' + tool.name + '</h3>';
                      if (tool.is_featured) {
                        html += '<span class="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">Featured</span>';
                      }
                      html += '</div>';
                      html += '<p class="text-muted-foreground mb-4 line-clamp-3">' + tool.description + '</p>';
                      html += '<div class="flex justify-between items-center">';
                      html += '<span class="font-medium">' + tool.pricing + '</span>';
                      html += '<span class="text-sm text-muted-foreground">' + tool.category + '</span>';
                      html += '</div>';
                      html += '</a>';
                    });
                    resultsContainer.innerHTML = html;
                  } else {
                    // Improved no results message with suggestions
                    resultsContainer.innerHTML = '<div class="col-span-full text-center py-8">' +
                      '<h3 class="text-xl font-semibold mb-2">No results found</h3>' +
                      '<p class="text-muted-foreground mb-6">Try searching for:</p>' +
                      '<div class="flex flex-wrap justify-center gap-2" id="suggestions-container"></div>' +
                      '</div>';
                    
                    // Add suggestion buttons with event listeners
                    const suggestions = ['content', 'marketing', 'research', 'sales'];
                    const container = document.getElementById('suggestions-container');
                    if (container) {
                      suggestions.forEach(term => {
                        const button = document.createElement('button');
                        button.className = 'px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors';
                        button.textContent = term;
                        button.addEventListener('click', function() {
                          input.value = term;
                          searchButton.click();
                        });
                        container.appendChild(button);
                      });
                    }
                  }
                } catch (error) {
                  resultsContainer.innerHTML = '<div class="col-span-full text-center py-8">Error searching tools. Please try again later.</div>';
                } finally {
                  // Restore button state
                  searchButton.textContent = originalButtonText;
                  searchButton.disabled = false;
                }
              }
            });
          `
        }
      </Script>

      {/* Featured Tools */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Featured Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-primary font-bold">{item}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Featured Tool {item}</h3>
                <p className="text-muted-foreground mb-4">A powerful agentic AI workflow for solopreneurs</p>
                <button className="text-primary font-medium hover:underline">
                  Learn More
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              'Content Creation',
              'Sales & Support',
              'Research & Ops',
              'Marketing',
              'Frameworks',
              'Niche Tools'
            ].map((category, index) => (
              <div key={index} className="border border-border rounded-lg p-4 text-center hover:bg-muted transition-colors">
                <h3 className="font-medium">{category}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground">
            Built with Grok + Trae SOLO on agents.wangdadi.xyz
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
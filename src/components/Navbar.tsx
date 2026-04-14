import React from 'react';
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold">Agents Directory</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/directory" className="font-medium hover:text-primary transition-colors">
              Directory
            </Link>
            <Link href="/submit" className="font-medium hover:text-primary transition-colors">
              Submit Tool
            </Link>
            <Link href="/admin" className="font-medium hover:text-primary transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
'use client';

import React from 'react';
import { Sidebar } from './Sidebar';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-[#F2F2ED] flex flex-col lg:flex-row font-sans selection:bg-[#335943] selection:text-white">
      <div className="no-print shrink-0">
        <Sidebar />
      </div>
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

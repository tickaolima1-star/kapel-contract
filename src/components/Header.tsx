'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, breadcrumbs, actions }: HeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-[rgba(242,242,237,0.1)] mb-6 sm:mb-8 gap-4">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-[#AEB4AE] mb-2 overflow-x-auto font-mono">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#8E948E] shrink-0" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-[#44755A] transition-colors whitespace-nowrap">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[#F2F2ED] font-medium whitespace-nowrap">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display uppercase">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-[#AEB4AE] font-mono mt-1">{subtitle}</p>}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

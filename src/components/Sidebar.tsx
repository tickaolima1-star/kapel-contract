'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  PlusCircle,
  Briefcase,
  Layers,
  FileCode2,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Clientes', href: '/clients', icon: Users },
    { label: 'Contratos', href: '/contracts', icon: FileText },
    { label: 'Upscaler Studio', href: '/upscaler', icon: Sparkles },
    { label: 'Serviços', href: '/services', icon: Briefcase },
    { label: 'Templates', href: '/templates', icon: Layers },
    { label: 'Cláusulas', href: '/clauses', icon: FileCode2 },
    { label: 'Configurações', href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0A0A0A] border-r border-[rgba(242,242,237,0.1)] select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[rgba(242,242,237,0.1)] flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="kapel-logo logo-sm text-lg font-black tracking-wider flex items-center">
            <span>K</span>
            <span className="a-mark" aria-label="A"></span>
            <span>PEL</span>
          </div>
          <div className="ml-1">
            <span className="text-[9px] font-bold tracking-widest text-[#F2F2ED] bg-[#1C2E24] border border-[#335943] px-1.5 py-0.5 rounded font-mono uppercase">
              CONTRACT
            </span>
            <p className="text-[10px] text-[#8E948E] font-mono mt-0.5">SISTEMA OPERACIONAL</p>
          </div>
        </Link>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 text-[#AEB4AE] hover:text-[#F2F2ED] rounded-lg"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Action Button: Novo Contrato */}
      <div className="px-4 pt-5 pb-2">
        <Link
          href="/contracts/new"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded bg-[#1C2E24] hover:bg-[#263F31] text-[#F2F2ED] border border-[#335943] font-semibold text-xs font-mono tracking-wider uppercase transition-all shadow-lg shadow-[#1C2E24]/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Novo Contrato</span>
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-all font-mono ${
                isActive
                  ? 'bg-[#1C2E24]/40 text-[#44755A] border border-[#335943]/30 shadow-sm'
                  : 'text-[#AEB4AE] hover:text-[#F2F2ED] hover:bg-[#121312]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#44755A]' : 'text-[#8E948E]'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User / Admin Footer */}
      <div className="p-4 border-t border-[rgba(242,242,237,0.1)] bg-[#050505]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#121312] border border-[rgba(242,242,237,0.1)] flex items-center justify-center text-xs font-bold text-[#44755A] font-mono">
              P
            </div>
            <div>
              <p className="text-xs font-bold text-[#F2F2ED] leading-tight">Patrick Silva</p>
              <div className="flex items-center gap-1 text-[10px] text-[#44755A] font-mono">
                <ShieldCheck className="w-3 h-3" />
                <span>OPERADOR</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Encerrar Sessão"
            className="p-1.5 rounded bg-transparent text-[#8E948E] hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navbar */}
      <header className="lg:hidden no-print sticky top-0 z-30 bg-[#0A0A0A] border-b border-[rgba(242,242,237,0.1)] px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="kapel-logo logo-sm text-base font-black flex items-center">
            <span>K</span>
            <span className="a-mark"></span>
            <span>PEL</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 text-[#AEB4AE] hover:text-[#F2F2ED] bg-[#121312] rounded border border-[rgba(242,242,237,0.1)]"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-full h-full z-10 animate-in slide-in-from-left duration-200">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}

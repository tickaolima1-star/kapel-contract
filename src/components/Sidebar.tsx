'use client';

import React from 'react';
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
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Clientes', href: '/clients', icon: Users },
    { label: 'Contratos', href: '/contracts', icon: FileText },
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

  return (
    <aside className="w-64 bg-[#0c121e] border-r border-[#1a2333] flex flex-col h-screen sticky top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#1a2333]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <span className="font-bold text-black font-display text-lg tracking-wider">K</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-lg tracking-wider text-white">KAPEL</span>
              <span className="text-[10px] font-semibold tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded">CONTRACT</span>
            </div>
            <p className="text-[11px] text-slate-400">Inteligência Comercial & Gestão</p>
          </div>
        </Link>
      </div>

      {/* Action Button: Novo Contrato */}
      <div className="px-4 pt-5 pb-2">
        <Link
          href="/contracts/new"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:-translate-y-0.5"
        >
          <PlusCircle className="w-4 h-4 text-black" />
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
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#131d2e]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User / Admin Footer */}
      <div className="p-4 border-t border-[#1a2333] bg-[#090d16]/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-emerald-400">
              P
            </div>
            <div>
              <p className="text-xs font-medium text-slate-200 leading-tight">Patrick Silva</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                <span>Administrador</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Encerrar Sessão"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

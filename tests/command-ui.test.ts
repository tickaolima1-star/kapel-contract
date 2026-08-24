import { describe, expect, it, vi } from 'vitest';
import CommandDashboardPage from '../src/app/command/page';

// Mock routing
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock AdminLayout and Header components
vi.mock('@/components/AdminLayout', () => ({
  AdminLayout: ({ children }: any) => children,
}));
vi.mock('@/components/Header', () => ({
  Header: () => null,
}));

describe('CommandDashboardPage component logic', () => {
  it('é exportado como uma função de componente React válida', () => {
    expect(typeof CommandDashboardPage).toBe('function');
  });
});

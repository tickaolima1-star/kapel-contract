// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({ usePathname: () => '/command', useRouter: () => ({ push: vi.fn() }) }));
vi.mock('next/link', () => ({ default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a> }));
import CommandPage from '@/app/command/page';

const factors = { deadline: 22, financialImpact: 25, unblockImpact: 0, strategicValue: 15, founderNeed: 10, effortEfficiency: 3, staleConfidencePenalty: 0 };
const response = {
  generatedAt: '2026-08-23T12:00:00.000Z', decisions: [1, 2, 3].map(rank => ({ workItemId: `w${rank}`, title: `Decisão ${rank}`, projectId: `p${rank}`, projectName: `Projeto ${rank}`, score: 90 - rank, factors, explanation: ['Prazo: +22'], dueAt: null, estimatedMinutes: 30 })),
  revenueAtRisk: [{ projectId: 'p1', projectName: 'Projeto 1', amount: 11000, reason: 'Entrega bloqueada' }], externalBlockers: [], delegations: [], notNow: [], staleProjects: [], memberships: [],
};
describe('command UI', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => response })); });
  it('puts exactly three decisions before operational context', async () => {
    render(<CommandPage />);
    await waitFor(() => expect(screen.getAllByTestId('command-decision')).toHaveLength(3));
    expect(screen.getByText(/11\.000,00/)).toBeVisible();
    expect(screen.getByRole('heading', { name: 'O que não fazer agora' })).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Começar' })).toHaveLength(3);
  });
});

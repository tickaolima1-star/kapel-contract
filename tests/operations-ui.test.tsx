// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/operations', useRouter: () => ({ push: vi.fn() }) }));
vi.mock('next/link', () => ({ default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a> }));

import OperationsPage from '@/app/operations/page';

describe('operations UI', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] })); });
  it('renders fast capture and an actionable empty state', async () => {
    render(<OperationsPage />);
    expect(screen.getByRole('heading', { name: /operations/i })).toBeVisible();
    expect(screen.getByLabelText('Próxima ação')).toBeRequired();
    expect(screen.getByRole('button', { name: 'Criar projeto e ação' })).toBeEnabled();
    await waitFor(() => expect(screen.getByText(/nenhum projeto operacional/i)).toBeVisible());
  });
});

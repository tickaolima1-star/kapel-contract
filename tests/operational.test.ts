import { describe, expect, it, vi } from 'vitest';
import { initializeOperationalProject } from '../src/lib/engine/project-initializer';

const mockTx = {
  project: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  contract: {
    findUnique: vi.fn(),
  },
  membership: {
    findFirst: vi.fn(),
  },
  workItem: {
    createMany: vi.fn(),
  },
};

describe('initializeOperationalProject', () => {
  it('não cria se o projeto já existir', async () => {
    mockTx.project.findUnique.mockResolvedValue({ id: 'proj_1' });
    const result = await initializeOperationalProject('contract_1', mockTx);
    expect(result).toEqual({ id: 'proj_1' });
    expect(mockTx.contract.findUnique).not.toHaveBeenCalled();
  });

  it('cria projeto e work items de performance corretos', async () => {
    mockTx.project.findUnique.mockResolvedValue(null);
    mockTx.contract.findUnique.mockResolvedValue({
      id: 'contract_1',
      organization_id: 'org_kapel',
      title: 'Contrato Performance',
      calculated_mrr: 2500,
      template: { type: 'PERFORMANCE' },
    });
    mockTx.membership.findFirst.mockResolvedValue({ id: 'membership_patrick' });
    mockTx.project.create.mockImplementation(({ data }: any) => ({
      id: 'proj_1',
      ...data,
    }));

    const result = await initializeOperationalProject('contract_1', mockTx);

    expect(result.id).toBe('proj_1');
    expect(result.organization_id).toBe('org_kapel');
    expect(result.monthly_value_at_risk).toBe(2500);

    expect(mockTx.workItem.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ title: 'Onboarding & Briefing' }),
          expect.objectContaining({ title: 'Setup de Contas' }),
          expect.objectContaining({ title: 'Primeira Entrega de Criativos' }),
        ]),
      })
    );
  });
});

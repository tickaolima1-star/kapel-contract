import { describe, expect, it } from 'vitest';
import { scoreWorkItem, rankCommandItems, PriorityInput } from '../src/lib/command/priority';

describe('Deterministic Prioritization Engine', () => {
  const now = new Date('2026-08-24T09:00:00Z');

  it('retorna score 0 se o projeto estiver bloqueado por terceiros', () => {
    const item: PriorityInput = {
      id: 'task_1',
      title: 'Action Item',
      type: 'ACTION',
      created_at: new Date('2026-08-24T08:00:00Z'),
      project: {
        id: 'proj_1',
        name: 'Projeto 1',
        strategic_value: 3,
        owner_membership_id: 'membership_patrick',
        last_update_at: new Date('2026-08-24T08:00:00Z'),
        monthly_value_at_risk: 0,
        blockers: [{
          id: 'b_1',
          status: 'OPEN',
          responsible_party: 'CLIENT',
          blocks_delivery: true,
          follow_up_at: null,
        }],
      },
      assignee_membership_id: 'membership_patrick',
      due_at: null,
      estimated_minutes: 30,
    };

    const res = scoreWorkItem(item, now);
    expect(res.score).toBe(0);
    expect(res.executable).toBe(false);
  });

  it('permite executabilidade de follow-up se prazo do blocker de terceiros ja venceu', () => {
    const item: PriorityInput = {
      id: 'task_followup',
      title: 'Cobrar cliente',
      type: 'FOLLOW_UP',
      created_at: new Date('2026-08-24T08:00:00Z'),
      project: {
        id: 'proj_1',
        name: 'Projeto 1',
        strategic_value: 3,
        owner_membership_id: 'membership_patrick',
        last_update_at: new Date('2026-08-24T08:00:00Z'),
        monthly_value_at_risk: 0,
        blockers: [{
          id: 'b_1',
          status: 'OPEN',
          responsible_party: 'CLIENT',
          blocks_delivery: true,
          follow_up_at: new Date('2026-08-24T08:30:00Z'), // Vencido (now é 09:00:00Z)
        }],
      },
      assignee_membership_id: 'membership_patrick',
      due_at: null,
      estimated_minutes: 10,
    };

    const res = scoreWorkItem(item, now);
    expect(res.executable).toBe(true);
    expect(res.score).toBeGreaterThan(0);
  });

  it('aplica pontuações para tarefas com vencimento e valor estratégico', () => {
    const item: PriorityInput = {
      id: 'task_2',
      title: 'Decisão Importante',
      type: 'DECISION',
      created_at: new Date('2026-08-24T08:00:00Z'),
      project: {
        id: 'proj_2',
        name: 'Projeto 2',
        strategic_value: 5,
        owner_membership_id: 'membership_patrick',
        last_update_at: new Date('2026-08-24T08:00:00Z'),
        monthly_value_at_risk: 6000,
        blockers: [],
      },
      assignee_membership_id: 'membership_patrick',
      due_at: new Date('2026-08-24T18:00:00Z'), // Vence hoje (dentro de 24h)
      estimated_minutes: 10,
    };

    const res = scoreWorkItem(item, now);
    expect(res.score).toBeGreaterThan(50);
    expect(res.executable).toBe(true);
  });

  it('ordena itens com ranking correto e estavel', () => {
    const item1: PriorityInput = {
      id: 'task_low',
      title: 'Tarefa Low Strategic',
      type: 'ACTION',
      created_at: new Date('2026-08-24T08:00:00Z'),
      project: {
        id: 'proj_low',
        name: 'Projeto Low',
        strategic_value: 1,
        owner_membership_id: 'membership_patrick',
        last_update_at: new Date('2026-08-24T08:00:00Z'),
        monthly_value_at_risk: 0,
        blockers: [],
      },
      assignee_membership_id: 'membership_patrick',
      due_at: null,
      estimated_minutes: 60,
    };

    const item2: PriorityInput = {
      id: 'task_high',
      title: 'Tarefa High Strategic',
      type: 'ACTION',
      created_at: new Date('2026-08-24T08:00:00Z'),
      project: {
        id: 'proj_high',
        name: 'Projeto High',
        strategic_value: 5,
        owner_membership_id: 'membership_patrick',
        last_update_at: new Date('2026-08-24T08:00:00Z'),
        monthly_value_at_risk: 0,
        blockers: [],
      },
      assignee_membership_id: 'membership_patrick',
      due_at: null,
      estimated_minutes: 60,
    };

    const ranked = rankCommandItems([item1, item2], now);
    expect(ranked[0].id).toBe('task_high');
    expect(ranked[1].id).toBe('task_low');
  });
});

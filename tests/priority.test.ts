import { describe, expect, it } from 'vitest';
import { rankCommandItems, scoreWorkItem, type PriorityInput } from '@/lib/command/priority';

const now = new Date('2026-08-23T12:00:00.000Z');
const base: PriorityInput = {
  id: 'base', type: 'ACTION', status: 'OPEN', dueAt: null, createdAt: '2026-08-20T12:00:00.000Z',
  estimatedMinutes: 60, monthlyValueAtRisk: 0, projectStrategicValue: 3,
  assigneeMembershipId: 'patrick', projectOwnerMembershipId: 'patrick', currentMembershipId: 'patrick',
  lastProjectUpdateAt: '2026-08-22T12:00:00.000Z', blockers: [],
};

describe('deterministic command priority', () => {
  it('clamps the maximum and exposes factor contributions', () => {
    const result = scoreWorkItem({ ...base, dueAt: '2026-08-22T12:00:00.000Z', monthlyValueAtRisk: 20000, projectStrategicValue: 5, estimatedMinutes: 10, blockers: [{ responsibleParty: 'KAPEL', blocksDelivery: true, status: 'OPEN', followUpAt: null }] }, now);
    expect(result.score).toBe(80);
    expect(result.factors).toMatchObject({ deadline: 25, financialImpact: 25, strategicValue: 15, founderNeed: 10, effortEfficiency: 5 });
    const maximum = scoreWorkItem({ ...base, type: 'FOLLOW_UP', dueAt: '2026-08-22T12:00:00.000Z', monthlyValueAtRisk: 20000, projectStrategicValue: 5, estimatedMinutes: 10, blockers: [{ responsibleParty: 'CLIENT', blocksDelivery: true, status: 'OPEN', followUpAt: '2026-08-23T10:00:00.000Z' }] }, now);
    expect(maximum.score).toBe(100);
  });

  it('excludes externally blocked execution but permits a due follow-up', () => {
    const blocker = { responsibleParty: 'CLIENT' as const, blocksDelivery: true, status: 'OPEN' as const, followUpAt: '2026-08-23T10:00:00.000Z' };
    expect(scoreWorkItem({ ...base, blockers: [blocker] }, now)).toMatchObject({ score: 0, executable: false });
    expect(scoreWorkItem({ ...base, type: 'FOLLOW_UP', blockers: [blocker] }, now).executable).toBe(true);
  });

  it('sorts ties by due date, creation date and id', () => {
    const tied = [
      { ...base, id: 'older-created', dueAt: '2026-08-25T12:00:00.000Z', createdAt: '2026-08-20T12:00:00.000Z' },
      { ...base, id: 'later-created', dueAt: '2026-08-25T12:00:00.000Z', createdAt: '2026-08-21T12:00:00.000Z' },
      { ...base, id: 'earlier-due', dueAt: '2026-08-24T12:00:00.000Z' },
    ];
    expect(rankCommandItems(tied, now).map(x => x.id)).toEqual(['earlier-due', 'older-created', 'later-created']);
  });

  it('penalizes stale project confidence', () => {
    expect(scoreWorkItem({ ...base, lastProjectUpdateAt: '2026-08-01T12:00:00.000Z' }, now).factors.staleConfidencePenalty).toBe(-5);
  });
});

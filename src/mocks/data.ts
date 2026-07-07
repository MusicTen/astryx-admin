export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  isActive: boolean;
  createdAt: string;
}

const ROLES = ['admin', 'editor', 'viewer'] as const;

export function createSeedUsers(count = 43): MockUser[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    name: `用户${String(index + 1).padStart(2, '0')}`,
    email: `user${index + 1}@example.com`,
    role: ROLES[index % ROLES.length],
    isActive: index % 5 !== 0,
    createdAt: new Date(Date.UTC(2026, 0, 1 + index)).toISOString(),
  }));
}

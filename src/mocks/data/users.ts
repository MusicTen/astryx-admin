export type MockUserStatus = "active" | "suspended" | "invited";

export interface MockUser {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "editor" | "viewer";
  status: MockUserStatus;
  createdAt: string;
}

const ROLES = ["admin", "editor", "viewer"] as const;
const STATUSES: MockUserStatus[] = ["active", "active", "suspended", "invited"];

export function createSeedUsers(count = 43): MockUser[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    username: `user${String(index + 1).padStart(2, "0")}`,
    name: `用户${String(index + 1).padStart(2, "0")}`,
    email: `user${index + 1}@example.com`,
    phone: `+1${String(2000000000 + index * 137).padStart(10, "0")}`,
    role: ROLES[index % ROLES.length],
    status: STATUSES[index % STATUSES.length],
    createdAt: new Date(Date.UTC(2026, 0, 1 + index)).toISOString(),
  }));
}

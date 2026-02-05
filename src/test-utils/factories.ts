import type { User, Category, Expense } from "@/types";

let counter = 0;
function nextId() {
  return `test-${++counter}`;
}

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    baseCurrency: "USD",
    ...overrides,
  };
}

export function createMockCategory(
  overrides: Partial<Category> = {},
): Category {
  const id = nextId();
  return {
    id,
    name: "Food",
    icon: "UtensilsCrossed",
    color: "#E8855B",
    ...overrides,
  };
}

export function createMockExpense(overrides: Partial<Expense> = {}): Expense {
  const id = nextId();
  const category = createMockCategory();
  return {
    id,
    amount: 25.5,
    currency: "USD",
    baseAmount: 25.5,
    baseCurrency: "USD",
    description: "Lunch at cafe",
    date: "2025-01-15",
    categoryId: category.id,
    category,
    ...overrides,
  };
}

// Prisma-shaped objects (with Decimal-like amounts)
export function createPrismaExpense(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    userId: "user-1",
    amount: { toNumber: () => 25.5 } as unknown,
    currency: "USD",
    baseAmount: { toNumber: () => 25.5 } as unknown,
    exchangeRate: { toNumber: () => 1 } as unknown,
    description: "Lunch at cafe",
    categoryId: "cat-1",
    date: new Date("2025-01-15"),
    notes: null,
    createdAt: new Date("2025-01-15T12:00:00.000Z"),
    updatedAt: new Date("2025-01-15T12:00:00.000Z"),
    category: {
      id: "cat-1",
      userId: "user-1",
      name: "Food",
      color: "#E8855B",
      icon: "UtensilsCrossed",
      createdAt: new Date(),
    },
    ...overrides,
  };
}

export function createPrismaCategory(overrides: Record<string, unknown> = {}) {
  const id = nextId();
  return {
    id,
    userId: "user-1",
    name: "Food",
    color: "#E8855B",
    icon: "UtensilsCrossed",
    createdAt: new Date(),
    ...overrides,
  };
}

export function createPrismaUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    image: null,
    emailVerified: null,
    baseCurrency: "USD",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

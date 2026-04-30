export const CATEGORIES = [
  'Groceries', 'Restaurants', 'Transport', 'Subscriptions',
  'Utilities', 'Rent', 'Health', 'Shopping',
  'Travel', 'Income', 'Gasoline', 'Misc',
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Groceries:     '#22c55e',
  Restaurants:        '#f97316',
  Transport:     '#3b82f6',
  Subscriptions: '#a855f7',
  Utilities:     '#06b6d4',
  Rent:          '#ef4444',
  Health:        '#ec4899',
  Shopping:      '#eab308',
  Travel:        '#14b8a6',
  Income:        '#10b981',
  Gasoline:      '#f59e0b',
  Misc:          '#6b7280',
};

export const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'investment'] as const;

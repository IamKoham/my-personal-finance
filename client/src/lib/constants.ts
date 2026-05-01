export const CATEGORIES = [
  'Groceries', 'Restaurants', 'Transport', 'Subscriptions',
  'Utilities', 'Rent', 'Health', 'Shopping',
  'Travel', 'Income', 'Gasoline', 'Misc',
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Rent:          '#FF6B6B',
  Misc:          '#A78BFA',
  Transport:     '#60A5FA',
  Subscriptions: '#F59E0B',
  Utilities:     '#34D399',
  Other:         '#FB923C',
  Restaurants:   '#E879F9',
  Shopping:      '#38BDF8',
  Groceries:     '#4ADE80',
  Health:        '#F472B6',
  Travel:        '#2DD4BF',
  Income:        '#10B981',
  Gasoline:      '#FCD34D',
  'CC Payment':  '#94A3B8',
  Transfer:      '#64748B',
};

export const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'investment'] as const;

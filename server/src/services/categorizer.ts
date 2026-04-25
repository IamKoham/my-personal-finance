export const CATEGORY_MAP: Record<string, string[]> = {
  Groceries:     ['whole foods','trader joe','safeway','kroger','costco','walmart','target','aldi'],
  Dining:        ['restaurant','mcdonald','starbucks','doordash','ubereats','grubhub','chipotle','chick-fil','cafe','sushi','pizza','taco','burger','diner'],
  Transport:     ['uber','lyft','bart','muni','parking','gas station','shell','chevron','76','arco','metro','transit','fuel'],
  Subscriptions: ['netflix','spotify','hulu','amazon prime','apple.com/bill','google one','openai','chatgpt','youtube','claude.ai','anthropic','disney+'],
  Utilities:     ['pg&e','electric','water','internet','comcast','at&t','verizon','t-mobile','xfinity','cox'],
  Rent:          ['rent','zelle rent','venmo rent','lease','apartment'],
  Health:        ['cvs','walgreens','pharmacy','doctor','dental','vision','kaiser','insurance','medical','clinic','hospital'],
  Shopping:      ['amazon','ebay','etsy','best buy','apple store','nike','gap','zara','h&m','nordstrom','tj maxx','ross'],
  Travel:        ['airline','united','delta','southwest','airbnb','hotel','marriott','hilton','expedia','booking','kayak','amtrak'],
  Income:        ['direct deposit','payroll','zelle from','venmo from','transfer from','interest payment','refund','cashback'],
  Gasoline:      ['chevron','shell','arco','76','bp','exxon','mobil','gas','fuel'],
};

// Chase Sapphire / Discover category → our category
const BANK_CATEGORY_MAP: Record<string, string> = {
  'Restaurants':   'Dining',
  'Gasoline':      'Gasoline',
  'Merchandise':   'Shopping',
  'Travel':        'Travel',
  'Entertainment': 'Subscriptions',
  'Health & Beauty': 'Health',
  'Supermarkets':  'Groceries',
  'Food & Drink':  'Dining',
  'Shopping':      'Shopping',
  'Gas':           'Gasoline',
  'Auto & Transport': 'Transport',
  'Bills & Utilities': 'Utilities',
  'Health & Fitness': 'Health',
  'Transfer':      'Income',
  'Payment':       'Income',
};

export function categorize(description: string, bankCategory?: string): string {
  // Prefer bank-provided category if mapped
  if (bankCategory) {
    const mapped = BANK_CATEGORY_MAP[bankCategory];
    if (mapped) return mapped;
  }

  const lower = description.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(kw => lower.includes(kw))) return category;
  }
  return 'Other';
}

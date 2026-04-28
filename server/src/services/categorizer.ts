export const CATEGORY_MAP: Record<string, string[]> = {
  Groceries:     ['whole foods','trader joe','safeway','kroger','costco','walmart','target','aldi','ic instacart'],
  Restaurants:   ['restaurant','mcdonald','starbucks','doordash','ubereats','grubhub','chipotle','chick-fil','cafe','coffee','sushi','pizza','taco','burger','diner','panda express','subway','dunkin','wingstop','olive garden','cheesecake','caffe','sdg coff'],
  Transport:     ['uber','lyft','bart','muni','parking','gas station','shell','chevron','76','arco','metro','transit','fuel','fastrak','clipper','caltrain','zipcar'],
  Subscriptions: ['netflix','spotify','hulu','amazon prime','apple.com/bill','google one','openai','chatgpt','youtube','claude.ai','anthropic','disney+','hbo','max.com','peacock','paramount','crunchyroll','adobe','microsoft 365','dropbox','icloud','google storage','uber one','instacart*subscri'],
  Utilities:     ['pg&e','electric','water','internet','comcast','at&t','verizon','t-mobile','xfinity','cox','sdg&e','san diego gas','google *fi','g.co/helppay','att payment'],
  Rent:          ['rent','zelle rent','venmo rent','lease','apartment','ubertas','management','property mgmt','residential'],
  Health:        ['cvs','walgreens','pharmacy','doctor','dental','vision','kaiser','insurance','medical','clinic','hospital'],
  Shopping:      ['amazon','ebay','etsy','best buy','apple store','nike','gap','zara','h&m','nordstrom','tj maxx','ross','marshall','old navy','uniqlo','ikea','home depot','lowe','wayfair'],
  Travel:        ['airline','united','delta','southwest','airbnb','hotel','marriott','hilton','expedia','booking','kayak','amtrak','spirit','alaska air','frontier','jetblue'],
  Income:        ['direct deposit','payroll','zelle from','venmo from','interest payment','refund','cashback','ach credit'],
  Investments:   ['buy nflx','buy amzn','buy fig','espp purchase','robinhood','etrade','e*trade','fidelity','vanguard','schwab','brokerage transfer','investment transfer','buy order'],
  Gasoline:      ['bp','exxon','mobil'],
  'CC Payment':  ['payment to chase','payment to discover','payment to citi','payment to amex','payment to bofa','payment to bank of america','chase autopay','discover autopay','autopay payment'],
  Transfer:      ['online transfer to chk','transfer to chk','online transfer to sav','zelle to','venmo to'],
};

// Chase Sapphire / Discover category → our category
const BANK_CATEGORY_MAP: Record<string, string> = {
  'Restaurants':      'Restaurants',
  'Gasoline':         'Gasoline',
  'Merchandise':      'Shopping',
  'Travel':           'Travel',
  'Entertainment':    'Subscriptions',
  'Health & Beauty':  'Health',
  'Supermarkets':     'Groceries',
  'Food & Drink':     'Restaurants',
  'Shopping':         'Shopping',
  'Gas':              'Gasoline',
  'Auto & Transport': 'Transport',
  'Bills & Utilities':'Utilities',
  'Health & Fitness': 'Health',
  'Transfer':         'Transfer',
  'Payment':          'CC Payment',
};

// Categories that are NOT personal expenses (excluded from spending totals)
export const NON_EXPENSE_CATEGORIES = new Set(['Investments', 'Income', 'CC Payment', 'Transfer']);

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

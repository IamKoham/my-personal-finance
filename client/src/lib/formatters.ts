export const currency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export const pct = (n: number, decimals = 1) => `${n.toFixed(decimals)}%`;

export const shortDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
};

export const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
  return date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
};

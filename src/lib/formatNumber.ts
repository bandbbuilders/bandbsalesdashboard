/**
 * Format large numbers with CR (Crore) and M (Million) suffixes
 * Shows 2 decimal places
 */
export const formatCurrency = (value: number): string => {
  const absValue = Math.abs(value);
  
  // 1 Crore = 10,000,000
  if (absValue >= 10000000) {
    const crores = value / 10000000;
    return `${crores.toFixed(2)} CR`;
  }
  
  // 1 Million = 1,000,000
  if (absValue >= 1000000) {
    const millions = value / 1000000;
    return `${millions.toFixed(2)} M`;
  }
  
  // For smaller numbers, show with commas and 2 decimal places
  return value.toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

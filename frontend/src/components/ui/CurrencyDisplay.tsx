import React from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CurrencyDisplayProps {
  amountCents: number;
  className?: string;
  showCurrencyCode?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amountCents,
  className = "",
  showCurrencyCode = false
}) => {
  const { formatAmount, currencyInfo } = useCurrency();

  const formattedAmount = formatAmount(amountCents);

  return (
    <span className={className}>
      {formattedAmount}
      {showCurrencyCode && currencyInfo && (
        <span className="ml-1 text-xs text-muted-foreground">
          {currencyInfo.code}
        </span>
      )}
    </span>
  );
};
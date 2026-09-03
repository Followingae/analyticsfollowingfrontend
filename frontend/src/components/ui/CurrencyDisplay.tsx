import React from 'react';
import { Aed } from '@/components/console/primitives';

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
  // Simple static formatting - convert cents to AED
  const amount = amountCents / 100;
  const formattedAmount = amount.toFixed(2);

  return (
    <span className={className}>
      <Aed>{formattedAmount}</Aed>
      {showCurrencyCode && (
        <span className="ml-1 text-xs text-muted-foreground">
          AED
        </span>
      )}
    </span>
  );
};
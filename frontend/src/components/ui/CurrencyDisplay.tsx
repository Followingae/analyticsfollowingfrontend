import React from 'react';

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
  const formattedAmount = `AED ${amount.toFixed(2)}`;

  return (
    <span className={className}>
      {formattedAmount}
      {showCurrencyCode && (
        <span className="ml-1 text-xs text-muted-foreground">
          AED
        </span>
      )}
    </span>
  );
};
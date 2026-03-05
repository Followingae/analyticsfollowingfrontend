/**
 * Shared helpers for proposal components
 */

export function getTierColor(tier?: string) {
  switch (tier?.toLowerCase()) {
    case "mega":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    case "macro":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "mid":
    case "mid-tier":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "micro":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "nano":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  }
}

export function formatCount(n?: number): string {
  if (!n) return "0"
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M"
  if (n >= 1000) return (n / 1000).toFixed(1) + "K"
  return n.toString()
}

export function formatCurrency(amount?: number | null): string {
  if (!amount) return "-"
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 0 })
}

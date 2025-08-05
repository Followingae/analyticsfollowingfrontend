import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function formatPercentage(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0.0%'
  return `${num.toFixed(1)}%`
}

export function isValidProfile(profile: any): boolean {
  return profile && profile.username && profile.followers !== undefined
}
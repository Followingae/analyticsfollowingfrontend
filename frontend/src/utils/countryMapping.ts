// Country code to display name mapping for creator analytics
export const countryNames: Record<string, string> = {
  'AE': 'UAE',
  'US': 'United States',
  'GB': 'United Kingdom',
  'FR': 'France',
  'CA': 'Canada',
  'DE': 'Germany',
  'AU': 'Australia',
  'IT': 'Italy',
  'ES': 'Spain',
  'NL': 'Netherlands',
  'BR': 'Brazil',
  'MX': 'Mexico',
  'AR': 'Argentina',
  'IN': 'India',
  'JP': 'Japan',
  'CN': 'China',
  'KR': 'South Korea',
  'SA': 'Saudi Arabia',
  'EG': 'Egypt',
  'TH': 'Thailand',
  'SG': 'Singapore',
  'MY': 'Malaysia',
  'ID': 'Indonesia',
  'PH': 'Philippines',
  'VN': 'Vietnam',
  'TR': 'Turkey',
  'RU': 'Russia',
  'UA': 'Ukraine',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'RO': 'Romania',
  'HU': 'Hungary',
  'GR': 'Greece',
  'PT': 'Portugal',
  'BE': 'Belgium',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'DK': 'Denmark',
  'SE': 'Sweden',
  'NO': 'Norway',
  'FI': 'Finland',
  'IS': 'Iceland',
  'IE': 'Ireland',
  'LU': 'Luxembourg',
  'MT': 'Malta',
  'CY': 'Cyprus',
  'BG': 'Bulgaria',
  'HR': 'Croatia',
  'SI': 'Slovenia',
  'SK': 'Slovakia',
  'LT': 'Lithuania',
  'LV': 'Latvia',
  'EE': 'Estonia',
  'ZA': 'South Africa',
  'NG': 'Nigeria',
  'KE': 'Kenya',
  'GH': 'Ghana',
  'MA': 'Morocco',
  'TN': 'Tunisia',
  'DZ': 'Algeria',
  'LY': 'Libya',
  'SD': 'Sudan',
  'ET': 'Ethiopia',
  'UG': 'Uganda',
  'TZ': 'Tanzania',
  'MW': 'Malawi',
  'ZM': 'Zambia',
  'ZW': 'Zimbabwe',
  'BW': 'Botswana',
  'NA': 'Namibia',
  'SZ': 'Eswatini',
  'LS': 'Lesotho',
  'MG': 'Madagascar',
  'MU': 'Mauritius',
  'SC': 'Seychelles',
  'CV': 'Cape Verde',
  'SN': 'Senegal',
  'ML': 'Mali',
  'BF': 'Burkina Faso',
  'NE': 'Niger',
  'TD': 'Chad',
  'CF': 'Central African Republic',
  'CM': 'Cameroon',
  'GQ': 'Equatorial Guinea',
  'GA': 'Gabon',
  'CG': 'Congo',
  'CD': 'Democratic Republic of Congo',
  'AO': 'Angola',
  'ZZ': 'Unknown'
};

/**
 * Get display name for a country code
 * @param countryCode - ISO 2-letter country code
 * @returns Display name or the country code if not found
 */
export function getCountryDisplayName(countryCode: string | null | undefined): string {
  if (!countryCode) return 'Unknown';
  return countryNames[countryCode.toUpperCase()] || countryCode.toUpperCase();
}

/**
 * Check if a country code is valid
 * @param countryCode - ISO 2-letter country code
 * @returns true if valid country code
 */
export function isValidCountryCode(countryCode: string | null | undefined): boolean {
  if (!countryCode) return false;
  return countryCode.toUpperCase() in countryNames;
}
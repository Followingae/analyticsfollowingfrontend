import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

export interface CurrencyInfo {
  code: string;
  symbol: string;
  decimal_places: number;
}

export interface CurrencySettings {
  team_id: string;
  currency_code: string;
  currency_symbol: string;
  decimal_places: number;
}

export interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
}

export const currencyService = {
  // Get current user's currency
  async getCurrentUserCurrency(): Promise<CurrencySettings> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/currency/user/current`);
    return response;
  },

  // Get team currency (superadmin)
  async getTeamCurrency(teamId: string): Promise<CurrencySettings> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/currency/team/${teamId}`);
    return response;
  },

  // Update team currency (superadmin only)
  async updateTeamCurrency(
    teamId: string,
    currencyCode: string,
    currencySymbol?: string,
    decimalPlaces: number = 2
  ): Promise<CurrencySettings> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/currency/team/${teamId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currency_code: currencyCode,
        currency_symbol: currencySymbol,
        decimal_places: decimalPlaces
      })
    });
    return response;
  },

  // Get supported currencies (superadmin)
  async getSupportedCurrencies(): Promise<SupportedCurrency[]> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/currency/supported`);
    return response;
  },

  // Format currency amount
  async formatAmount(amountCents: number, teamId?: string): Promise<{
    formatted_amount: string;
    currency_info: CurrencyInfo;
  }> {
    const response = await fetchWithAuth(`${API_CONFIG.BASE_URL}/api/v1/currency/format`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount_cents: amountCents,
        team_id: teamId
      })
    });
    return response;
  }
};
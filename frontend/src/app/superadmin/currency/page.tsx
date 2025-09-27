"use client"

import React, { useState, useEffect } from 'react';
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Pencil, Save, X, Globe } from 'lucide-react';
import { currencyService, SupportedCurrency, CurrencySettings } from '@/services/currencyService';
import { superadminApiService } from '@/services/superadminApi';

export const dynamic = 'force-dynamic'

interface TeamCurrencyRowProps {
  team: {
    id: string;
    name: string;
    subscription_tier: string;
  };
}

const TeamCurrencyRow: React.FC<TeamCurrencyRowProps> = ({ team }) => {
  const [currency, setCurrency] = useState<CurrencySettings | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    currency_code: '',
    currency_symbol: '',
    decimal_places: 2
  });
  const [supportedCurrencies, setSupportedCurrencies] = useState<SupportedCurrency[]>([]);

  useEffect(() => {
    fetchTeamCurrency();
    fetchSupportedCurrencies();
  }, [team.id]);

  const fetchTeamCurrency = async () => {
    try {
      const teamCurrency = await currencyService.getTeamCurrency(team.id);
      setCurrency(teamCurrency);
      setEditForm({
        currency_code: teamCurrency.currency_code,
        currency_symbol: teamCurrency.currency_symbol,
        decimal_places: teamCurrency.decimal_places
      });
    } catch (error) {
      console.error('Failed to fetch team currency:', error);
    }
  };

  const fetchSupportedCurrencies = async () => {
    try {
      const currencies = await currencyService.getSupportedCurrencies();
      setSupportedCurrencies(currencies);
    } catch (error) {
      console.error('Failed to fetch supported currencies:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (currency) {
      setEditForm({
        currency_code: currency.currency_code,
        currency_symbol: currency.currency_symbol,
        decimal_places: currency.decimal_places
      });
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await currencyService.updateTeamCurrency(
        team.id,
        editForm.currency_code,
        editForm.currency_symbol,
        editForm.decimal_places
      );

      await fetchTeamCurrency();
      setIsEditing(false);

      toast.success(`${team.name}'s currency has been updated to ${editForm.currency_code}`);
    } catch (error) {
      toast.error('Failed to update team currency. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrencyChange = (currencyCode: string) => {
    const selectedCurrency = supportedCurrencies.find(c => c.code === currencyCode);
    if (selectedCurrency) {
      setEditForm({
        currency_code: selectedCurrency.code,
        currency_symbol: selectedCurrency.symbol,
        decimal_places: selectedCurrency.decimal_places
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{team.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Team ID: {team.id} • {team.subscription_tier}
            </p>
          </div>
          <Badge variant="outline">{currency?.currency_code || 'Loading...'}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={editForm.currency_code}
                  onValueChange={handleCurrencyChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedCurrencies.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.symbol} {curr.code} - {curr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  value={editForm.currency_symbol}
                  onChange={(e) => setEditForm(prev => ({ ...prev, currency_symbol: e.target.value }))}
                  placeholder="$"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="decimal">Decimal Places</Label>
              <Select
                value={editForm.decimal_places.toString()}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, decimal_places: parseInt(value) }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 (¥100)</SelectItem>
                  <SelectItem value="2">2 ($1.00)</SelectItem>
                  <SelectItem value="3">3 ($1.000)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isLoading} size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Code:</span>
                <span className="ml-2 font-mono">{currency?.currency_code}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Symbol:</span>
                <span className="ml-2 font-mono">{currency?.currency_symbol}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Decimals:</span>
                <span className="ml-2 font-mono">{currency?.decimal_places}</span>
              </div>
            </div>

            <Button onClick={handleEdit} variant="outline" size="sm">
              <Pencil className="w-4 h-4 mr-2" />
              Edit Currency
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function TeamCurrencyManagement() {
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const result = await superadminApiService.getUsers({ limit: 1000 });
      if (result.success && result.data) {
        // Extract unique teams from users data
        const teamMap = new Map();
        result.data.users?.forEach((user: any) => {
          if (user.team_id && !teamMap.has(user.team_id)) {
            teamMap.set(user.team_id, {
              id: user.team_id,
              name: user.team_name || `Team ${user.team_id}`,
              subscription_tier: user.subscription_tier || 'free'
            });
          }
        });
        setTeams(Array.from(teamMap.values()));
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      toast.error('Failed to load team data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Team Currency Management</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Currency Settings Overview</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage currency settings for each team. Changes take effect immediately
              and will be reflected in all monetary displays for team members.
            </p>
          </CardHeader>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading teams...</p>
            </div>
          </div>
        ) : teams.length > 0 ? (
          <div className="space-y-4">
            {teams.map((team) => (
              <TeamCurrencyRow key={team.id} team={team} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No teams found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </SuperadminLayout>
  );
}
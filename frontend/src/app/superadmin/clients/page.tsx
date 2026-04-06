'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Building2, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { clientApi, type Client } from '@/services/clientManagementApi';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await clientApi.list({
        search: search || undefined,
        industry: industry && industry !== 'all' ? industry : undefined,
      });
      setClients(res.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [industry]);

  useEffect(() => {
    const timeout = setTimeout(fetchClients, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const formatAED = (amount: number) => {
    if (!amount) return 'AED 0';
    return `AED ${Number(amount).toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SuperadminLayout>
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage client relationships, campaigns, and deliverables
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchClients}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
            <SelectItem value="Fashion">Fashion</SelectItem>
            <SelectItem value="Technology">Technology</SelectItem>
            <SelectItem value="Entertainment">Entertainment</SelectItem>
            <SelectItem value="Beauty">Beauty</SelectItem>
            <SelectItem value="Sports">Sports</SelectItem>
            <SelectItem value="Real Estate">Real Estate</SelectItem>
            <SelectItem value="Automotive">Automotive</SelectItem>
            <SelectItem value="Travel">Travel</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Client Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-3 w-[80px]" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No clients found</h3>
          <p className="text-muted-foreground">
            Clients appear here when you create brand user accounts
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
              onClick={() => router.push(`/superadmin/clients/${client.id}`)}
            >
              <CardContent className="p-6">
                {/* Client Header */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-border">
                    <AvatarImage src={client.logo_url || undefined} alt={client.company_name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(client.company_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold group-hover:text-primary transition-colors">
                      {client.company_name}
                    </h3>
                    {client.owner_name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {client.owner_name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/70 truncate">
                      {client.industry || client.subscription_tier}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <p className="text-lg font-bold">{client.active_campaigns}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                    <p className="text-lg font-bold">{client.total_campaigns}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>

                {/* Budget */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Budget</span>
                  <span className="font-semibold text-sm">{formatAED(client.total_budget)}</span>
                </div>

                {/* Badges */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {client.pending_proposals > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {client.pending_proposals} pending
                    </Badge>
                  )}
                  {client.unpaid_campaigns > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {client.unpaid_campaigns} unpaid
                    </Badge>
                  )}
                  {client.active_campaigns > 0 && client.unpaid_campaigns === 0 && client.pending_proposals === 0 && (
                    <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </SuperadminLayout>
  );
}

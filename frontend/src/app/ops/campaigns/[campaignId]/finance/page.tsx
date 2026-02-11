/**
 * Operations OS - Finance Module (Internal Only)
 * Creator payouts, banking details, and payment tracking
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedOperationsRoute from '@/components/operations/ProtectedOperationsRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  Download,
  Upload,
  Eye,
  EyeOff,
  FileText,
  Send,
  RefreshCw,
  Banknote,
  Receipt,
  Calculator,
  User,
  Calendar,
  Lock,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { CreatorPayout, ClientPaymentMilestone, BankingDetails } from '@/types/operations';
import { operationsApi } from '@/services/operationsApi';
import { useOperations } from '@/contexts/OperationsContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function FinancePage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const {
    currentCampaign,
    selectCampaign,
    uiState,
    userAccess
  } = useOperations();

  const [payouts, setPayouts] = useState<CreatorPayout[]>([]);
  const [milestones, setMilestones] = useState<ClientPaymentMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBanking, setShowBanking] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
  const [addPayoutDialogOpen, setAddPayoutDialogOpen] = useState(false);
  const [newPayout, setNewPayout] = useState({
    creator_name: '',
    amount: 0,
    currency: 'AED',
    payment_method: 'bank_transfer',
    invoice_number: '',
    notes: ''
  });

  useEffect(() => {
    // Check access - finance is internal only
    if (!userAccess.permissions.view_finance) {
      toast.error('Access denied: Finance module is internal only');
      router.push(`/ops/campaigns/${campaignId}`);
      return;
    }

    if (campaignId && !currentCampaign) {
      selectCampaign(campaignId);
    }
    loadFinanceData();
  }, [campaignId, userAccess]);

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      const payoutsData = await operationsApi.getCreatorPayouts(campaignId);
      setPayouts(payoutsData.payouts || []);

      // Mock milestones data
      setMilestones([
        {
          id: 'm1',
          campaign_id: campaignId,
          milestone_name: 'Campaign Kickoff - 25%',
          amount: 25000,
          currency: 'AED',
          due_date: '2025-01-15',
          status: 'paid',
          invoice_number: 'INV-2025-001',
          paid_at: '2025-01-14T10:00:00Z'
        },
        {
          id: 'm2',
          campaign_id: campaignId,
          milestone_name: 'Mid-Campaign - 50%',
          amount: 50000,
          currency: 'AED',
          due_date: '2025-02-15',
          status: 'invoiced',
          invoice_number: 'INV-2025-002'
        },
        {
          id: 'm3',
          campaign_id: campaignId,
          milestone_name: 'Campaign Completion - 25%',
          amount: 25000,
          currency: 'AED',
          due_date: '2025-03-31',
          status: 'pending'
        }
      ]);
    } catch (error) {
      console.error('Failed to load finance data:', error);
      toast.error('Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayout = async () => {
    if (!newPayout.creator_name || !newPayout.amount) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      // API call would go here
      const mockPayout: CreatorPayout = {
        id: `p_${Date.now()}`,
        campaign_id: campaignId,
        creator_id: `c_${Date.now()}`,
        creator_name: newPayout.creator_name,
        amount: newPayout.amount,
        currency: newPayout.currency,
        status: 'pending',
        payment_method: newPayout.payment_method as any,
        invoice_number: newPayout.invoice_number,
        notes: newPayout.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setPayouts(prev => [...prev, mockPayout]);
      setAddPayoutDialogOpen(false);
      setNewPayout({
        creator_name: '',
        amount: 0,
        currency: 'AED',
        payment_method: 'bank_transfer',
        invoice_number: '',
        notes: ''
      });
      toast.success('Payout added');
    } catch (error) {
      toast.error('Failed to add payout');
    }
  };

  const handleUpdatePayoutStatus = async (payoutId: string, status: string) => {
    try {
      await operationsApi.updatePayoutStatus(payoutId, status);
      setPayouts(prev => prev.map(p =>
        p.id === payoutId ? { ...p, status: status as any } : p
      ));
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedPayouts.length === 0) {
      toast.error('No payouts selected');
      return;
    }

    if (action === 'approve') {
      for (const id of selectedPayouts) {
        await handleUpdatePayoutStatus(id, 'approved');
      }
    } else if (action === 'process') {
      for (const id of selectedPayouts) {
        await handleUpdatePayoutStatus(id, 'processing');
      }
    }

    setSelectedPayouts([]);
  };

  const toggleBankingDetails = () => {
    if (!userAccess.permissions.view_banking) {
      toast.error('Insufficient permissions to view banking details');
      return;
    }
    setShowBanking(!showBanking);
  };

  const exportPayouts = () => {
    // Generate CSV export
    const csv = [
      ['Creator', 'Amount', 'Currency', 'Status', 'Invoice', 'Date'],
      ...payouts.map(p => [
        p.creator_name,
        p.amount.toString(),
        p.currency,
        p.status,
        p.invoice_number || '',
        p.created_at
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts_${campaignId}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Exported to CSV');
  };

  const filteredPayouts = payouts.filter(p =>
    filterStatus === 'all' || p.status === filterStatus
  );

  const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);
  const paidPayouts = payouts
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingPayouts = payouts
    .filter(p => p.status === 'pending' || p.status === 'approved')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalMilestones = milestones.reduce((sum, m) => sum + m.amount, 0);
  const paidMilestones = milestones
    .filter(m => m.status === 'paid')
    .reduce((sum, m) => sum + m.amount, 0);

  if (!userAccess.permissions.view_finance) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Finance module is available for internal users only
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <ProtectedOperationsRoute requiredPermission="view_finance">
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <button
              onClick={() => router.push(`/ops/campaigns/${campaignId}`)}
              className="hover:underline"
            >
              {currentCampaign?.campaign_name}
            </button>
            <ChevronRight className="h-4 w-4" />
            <span>Finance</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-yellow-600" />
            Finance & Payments
          </h1>
          <p className="text-muted-foreground mt-1">
            Internal-only financial tracking and payout management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Internal Only
          </Badge>
        </div>
      </div>

      {/* Security Notice */}
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle>Secure Finance Module</AlertTitle>
        <AlertDescription>
          This module contains sensitive financial information. Banking details are masked by default.
          {userAccess.permissions.view_banking && ' You have permission to view full banking details.'}
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Creator Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPayouts.toLocaleString()} AED
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="text-green-600">
                {paidPayouts.toLocaleString()} paid
              </span>
              <span className="text-yellow-600">
                {pendingPayouts.toLocaleString()} pending
              </span>
            </div>
            <Progress
              value={(paidPayouts / totalPayouts) * 100}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Payments</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalMilestones.toLocaleString()} AED
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="text-green-600">
                {paidMilestones.toLocaleString()} received
              </span>
            </div>
            <Progress
              value={(paidMilestones / totalMilestones) * 100}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaign Margin</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((totalMilestones - totalPayouts) / totalMilestones * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {(totalMilestones - totalPayouts).toLocaleString()} AED profit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="payouts">
        <TabsList>
          <TabsTrigger value="payouts">
            Creator Payouts ({payouts.length})
          </TabsTrigger>
          <TabsTrigger value="milestones">
            Client Milestones ({milestones.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payouts" className="mt-4 space-y-4">
          {/* Payouts Toolbar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>

                  {selectedPayouts.length > 0 && (
                    <>
                      <Button
                        onClick={() => handleBulkAction('approve')}
                        size="sm"
                        variant="outline"
                      >
                        Approve {selectedPayouts.length}
                      </Button>
                      <Button
                        onClick={() => handleBulkAction('process')}
                        size="sm"
                        variant="outline"
                      >
                        Process {selectedPayouts.length}
                      </Button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleBankingDetails}
                  >
                    {showBanking ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide Banking
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Show Banking
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportPayouts}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Dialog open={addPayoutDialogOpen} onOpenChange={setAddPayoutDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Payout
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Creator Payout</DialogTitle>
                        <DialogDescription>
                          Record a new creator payout for tracking
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Creator Name</Label>
                          <Input
                            value={newPayout.creator_name}
                            onChange={(e) => setNewPayout(prev => ({
                              ...prev,
                              creator_name: e.target.value
                            }))}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Amount</Label>
                            <Input
                              type="number"
                              value={newPayout.amount}
                              onChange={(e) => setNewPayout(prev => ({
                                ...prev,
                                amount: parseFloat(e.target.value)
                              }))}
                            />
                          </div>
                          <div>
                            <Label>Currency</Label>
                            <Select
                              value={newPayout.currency}
                              onValueChange={(v) => setNewPayout(prev => ({
                                ...prev,
                                currency: v
                              }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AED">AED</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label>Payment Method</Label>
                          <Select
                            value={newPayout.payment_method}
                            onValueChange={(v) => setNewPayout(prev => ({
                              ...prev,
                              payment_method: v
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="paypal">PayPal</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Invoice Number</Label>
                          <Input
                            value={newPayout.invoice_number}
                            onChange={(e) => setNewPayout(prev => ({
                              ...prev,
                              invoice_number: e.target.value
                            }))}
                          />
                        </div>
                        <div>
                          <Label>Notes</Label>
                          <Input
                            value={newPayout.notes}
                            onChange={(e) => setNewPayout(prev => ({
                              ...prev,
                              notes: e.target.value
                            }))}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddPayoutDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddPayout}>Add Payout</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payouts Table */}
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedPayouts.length === filteredPayouts.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPayouts(filteredPayouts.map(p => p.id));
                            } else {
                              setSelectedPayouts([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      {showBanking && <TableHead>Banking</TableHead>}
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayouts.map(payout => (
                      <TableRow key={payout.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedPayouts.includes(payout.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPayouts(prev => [...prev, payout.id]);
                              } else {
                                setSelectedPayouts(prev =>
                                  prev.filter(id => id !== payout.id)
                                );
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {payout.creator_name}
                        </TableCell>
                        <TableCell>
                          {payout.amount.toLocaleString()} {payout.currency}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={payout.status}
                            onValueChange={(v) => handleUpdatePayoutStatus(payout.id, v)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {payout.payment_method?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        {showBanking && (
                          <TableCell>
                            {payout.banking_details ? (
                              <div className="text-xs">
                                <p>{payout.banking_details.account_number_masked}</p>
                                <p className="text-muted-foreground">
                                  {payout.banking_details.bank_name}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          {payout.invoice_number || '-'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(payout.created_at), 'MMM d')}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Payment Milestones</CardTitle>
              <CardDescription>
                Track client payments for the campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestones.map(milestone => (
                  <div
                    key={milestone.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        milestone.status === 'paid' ? 'bg-green-100' :
                        milestone.status === 'invoiced' ? 'bg-yellow-100' :
                        'bg-gray-100'
                      }`}>
                        {milestone.status === 'paid' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : milestone.status === 'invoiced' ? (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <Calendar className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{milestone.milestone_name}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>Due: {format(new Date(milestone.due_date), 'MMM d, yyyy')}</span>
                          {milestone.invoice_number && (
                            <span>Invoice: {milestone.invoice_number}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {milestone.amount.toLocaleString()} {milestone.currency}
                      </p>
                      <Badge
                        variant={
                          milestone.status === 'paid' ? 'default' :
                          milestone.status === 'invoiced' ? 'secondary' :
                          'outline'
                        }
                      >
                        {milestone.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </ProtectedOperationsRoute>
  );
}
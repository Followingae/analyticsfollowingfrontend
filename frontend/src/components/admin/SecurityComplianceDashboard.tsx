'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import {
  Shield,
  AlertTriangle,
  Lock,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Zap,
  FileText,
  Users,
  Globe,
  Server,
  Database,
  Key,
  Fingerprint,
  Bug,
  Target,
  Loader2,
  RefreshCcw,
  Download,
  Filter,
  Search,
  Bell,
  Settings,
  PlayCircle,
  PauseCircle,
  StopCircle
} from 'lucide-react';
import { superadminApi } from '@/services/superadminApi';

interface SecurityThreat {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  source_ip: string;
  target_resource: string;
  status: string;
  detected_at: string;
  resolved_at?: string;
  affected_users: number;
  mitigation_actions: string[];
  risk_score: number;
  false_positive: boolean;
}

interface ComplianceReport {
  id: string;
  framework: string;
  version: string;
  status: string;
  compliance_score: number;
  total_controls: number;
  passed_controls: number;
  failed_controls: number;
  pending_controls: number;
  last_assessment: string;
  next_assessment: string;
  assessor: string;
  findings: Array<{
    control_id: string;
    control_name: string;
    status: string;
    severity: string;
    description: string;
    remediation: string;
  }>;
}

interface SecurityRule {
  id: string;
  name: string;
  description: string;
  type: string;
  enabled: boolean;
  sensitivity: string;
  conditions: Record<string, any>;
  actions: string[];
  created_at: string;
  updated_at: string;
  triggered_count: number;
  false_positive_rate: number;
}

interface EmergencyControl {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
  impact_level: string;
  activation_trigger: string;
  activated_at?: string;
  activated_by?: string;
  affected_services: string[];
  rollback_plan: string;
  estimated_duration: number;
}

interface SecurityComplianceDashboardProps {}

const SecurityComplianceDashboard: React.FC<SecurityComplianceDashboardProps> = () => {
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [securityRules, setSecurityRules] = useState<SecurityRule[]>([]);
  const [emergencyControls, setEmergencyControls] = useState<EmergencyControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [threatFilter, setThreatFilter] = useState('all');
  const [newSecurityRule, setNewSecurityRule] = useState({
    name: '',
    description: '',
    type: 'ip_blocking',
    sensitivity: 'medium',
    conditions: {} as Record<string, any>,
    actions: ['log', 'alert'] as string[]
  });
  const [selectedEmergencyControl, setSelectedEmergencyControl] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadSecurityData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedTimeRange, threatFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [
        threatsData,
        complianceData,
        rulesData,
        controlsData
      ] = await Promise.all([
        superadminApi.getSecurityThreats({
          time_range: selectedTimeRange,
          severity: threatFilter !== 'all' ? threatFilter : undefined
        }),
        superadminApi.getComplianceReports(),
        superadminApi.getSecurityRules(),
        superadminApi.getEmergencyControls()
      ]);

      setThreats(threatsData);
      setComplianceReports(complianceData);
      setSecurityRules(rulesData);
      setEmergencyControls(controlsData);
      setError(null);
    } catch (err) {
      setError('Failed to load security dashboard');
      console.error('Security dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityData = async () => {
    try {
      const threatsData = await superadminApi.getSecurityThreats({
        time_range: selectedTimeRange,
        severity: threatFilter !== 'all' ? threatFilter : undefined
      });
      setThreats(threatsData);
    } catch (err) {
      console.error('Failed to refresh security data:', err);
    }
  };

  const handleCreateSecurityRule = async () => {
    try {
      await superadminApi.createSecurityRule(newSecurityRule);
      setShowRuleDialog(false);
      setNewSecurityRule({
        name: '',
        description: '',
        type: 'ip_blocking',
        sensitivity: 'medium',
        conditions: {},
        actions: ['log', 'alert']
      });
      loadDashboardData();
    } catch (err) {
      console.error('Failed to create security rule:', err);
    }
  };

  const handleActivateEmergencyControl = async (controlId: string) => {
    try {
      await superadminApi.activateEmergencyControl(controlId);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to activate emergency control:', err);
    }
  };

  const handleDeactivateEmergencyControl = async (controlId: string) => {
    try {
      await superadminApi.deactivateEmergencyControl(controlId);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to deactivate emergency control:', err);
    }
  };

  const handleThreatAction = async (threatId: string, action: string) => {
    try {
      if (action === 'resolve') {
        await superadminApi.resolveThreat(threatId);
      } else if (action === 'false_positive') {
        await superadminApi.markThreatAsFalsePositive(threatId);
      } else if (action === 'escalate') {
        await superadminApi.escalateThreat(threatId);
      }
      loadSecurityData();
    } catch (err) {
      console.error(`Failed to ${action} threat:`, err);
    }
  };

  const handleToggleSecurityRule = async (ruleId: string) => {
    try {
      await superadminApi.toggleSecurityRule(ruleId);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to toggle security rule:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
      case 'passed':
      case 'compliant':
      case 'active':
        return 'bg-green-500';
      case 'investigating':
      case 'pending':
      case 'warning':
        return 'bg-yellow-500';
      case 'open':
      case 'failed':
      case 'non-compliant':
      case 'inactive':
        return 'bg-red-500';
      case 'mitigated':
      case 'monitoring':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const securityOverview = useMemo(() => {
    const activeThreatCount = threats.filter(t => t.status === 'open' || t.status === 'investigating').length;
    const criticalThreatCount = threats.filter(t => t.severity === 'critical' && (t.status === 'open' || t.status === 'investigating')).length;
    const avgRiskScore = threats.length > 0 ? threats.reduce((sum, t) => sum + t.risk_score, 0) / threats.length : 0;
    const enabledRulesCount = securityRules.filter(r => r.enabled).length;

    return {
      activeThreats: activeThreatCount,
      criticalThreats: criticalThreatCount,
      avgRiskScore: Math.round(avgRiskScore),
      enabledRules: enabledRulesCount,
      totalRules: securityRules.length
    };
  }, [threats, securityRules]);

  const complianceOverview = useMemo(() => {
    if (complianceReports.length === 0) return { avgScore: 0, totalControls: 0, passedControls: 0 };

    const totalScore = complianceReports.reduce((sum, report) => sum + report.compliance_score, 0);
    const totalControls = complianceReports.reduce((sum, report) => sum + report.total_controls, 0);
    const passedControls = complianceReports.reduce((sum, report) => sum + report.passed_controls, 0);

    return {
      avgScore: Math.round(totalScore / complianceReports.length),
      totalControls,
      passedControls
    };
  }, [complianceReports]);

  const threatTrendData = useMemo(() => {
    const threatsByDay = threats.reduce((acc, threat) => {
      const date = new Date(threat.detected_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, critical: 0, high: 0, medium: 0, low: 0 };
      }
      acc[date][threat.severity.toLowerCase()]++;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(threatsByDay).slice(-30);
  }, [threats]);

  const complianceStatusData = useMemo(() => {
    return complianceReports.map(report => ({
      framework: report.framework,
      score: report.compliance_score,
      passed: report.passed_controls,
      failed: report.failed_controls,
      pending: report.pending_controls
    }));
  }, [complianceReports]);

  if (loading && threats.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading security dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Security Dashboard</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadDashboardData}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Security & Compliance</h2>
          <p className="text-muted-foreground">Threat detection, compliance monitoring, and emergency response controls</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="6h">6 Hours</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={threatFilter} onValueChange={setThreatFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Threats</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadDashboardData} size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Threats</p>
                <p className="text-2xl font-bold mt-2">{securityOverview.activeThreats}</p>
              </div>
              <Shield className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold mt-2 text-red-600">{securityOverview.criticalThreats}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risk Score</p>
                <p className="text-2xl font-bold mt-2">{securityOverview.avgRiskScore}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Rules</p>
                <p className="text-2xl font-bold mt-2">{securityOverview.enabledRules}/{securityOverview.totalRules}</p>
              </div>
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance</p>
                <p className="text-2xl font-bold mt-2">{complianceOverview.avgScore}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {securityOverview.criticalThreats > 0 && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertTitle className="text-red-700 dark:text-red-400">Critical Security Alert</AlertTitle>
          <AlertDescription className="text-red-600 dark:text-red-300">
            {securityOverview.criticalThreats} critical security threat{securityOverview.criticalThreats !== 1 ? 's' : ''} detected requiring immediate attention.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="threats" className="space-y-6">
        <TabsList>
          <TabsTrigger value="threats">Threat Detection</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="rules">Security Rules</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Controls</TabsTrigger>
        </TabsList>

        {/* Threat Detection Tab */}
        <TabsContent value="threats" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Threat Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Threat Detection Trends
                </CardTitle>
                <CardDescription>Security threats detected over time by severity</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    critical: {
                      label: "Critical",
                      color: "#ef4444",
                    },
                    high: {
                      label: "High",
                      color: "#f97316",
                    },
                    medium: {
                      label: "Medium",
                      color: "#eab308",
                    },
                    low: {
                      label: "Low",
                      color: "#3b82f6",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={threatTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="critical"
                        stackId="1"
                        stroke="var(--color-critical)"
                        fill="var(--color-critical)"
                      />
                      <Area
                        type="monotone"
                        dataKey="high"
                        stackId="1"
                        stroke="var(--color-high)"
                        fill="var(--color-high)"
                      />
                      <Area
                        type="monotone"
                        dataKey="medium"
                        stackId="1"
                        stroke="var(--color-medium)"
                        fill="var(--color-medium)"
                      />
                      <Area
                        type="monotone"
                        dataKey="low"
                        stackId="1"
                        stroke="var(--color-low)"
                        fill="var(--color-low)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Threat Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Threat Sources
                </CardTitle>
                <CardDescription>Geographic distribution of threat sources</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {threats
                      .reduce((acc, threat) => {
                        const country = threat.source_ip.split('.')[0]; // Simplified for demo
                        if (!acc[country]) {
                          acc[country] = { count: 0, severity: 'low' };
                        }
                        acc[country].count++;
                        if (threat.severity === 'critical' || threat.severity === 'high') {
                          acc[country].severity = threat.severity;
                        }
                        return acc;
                      }, {} as Record<string, any>)
                      && Object.entries(
                        threats.reduce((acc, threat) => {
                          const country = `Country ${threat.source_ip.split('.')[0]}`; // Simplified for demo
                          if (!acc[country]) {
                            acc[country] = { count: 0, severity: 'low' };
                          }
                          acc[country].count++;
                          if (threat.severity === 'critical' || threat.severity === 'high') {
                            acc[country].severity = threat.severity;
                          }
                          return acc;
                        }, {} as Record<string, any>)
                      ).slice(0, 10).map(([country, data]: [string, any]) => (
                        <div key={country} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${getSeverityColor(data.severity)}`} />
                            <span className="font-medium">{country}</span>
                          </div>
                          <Badge variant="outline">{data.count} threats</Badge>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Threat List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Threats
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Recent security threats and incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Threat</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {threats.map((threat) => (
                    <TableRow key={threat.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{threat.title}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">{threat.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getSeverityIcon(threat.severity)}
                          <Badge
                            variant={threat.severity === 'critical' || threat.severity === 'high' ? 'destructive' : 'default'}
                            className="capitalize"
                          >
                            {threat.severity}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{threat.type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{threat.source_ip}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(threat.status)}`} />
                          <span className="capitalize">{threat.status.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={threat.risk_score} className="w-16 h-2" />
                          <span className="text-sm font-medium">{threat.risk_score}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(threat.detected_at).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">{new Date(threat.detected_at).toLocaleTimeString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {threat.status === 'open' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleThreatAction(threat.id, 'resolve')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleThreatAction(threat.id, 'false_positive')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleThreatAction(threat.id, 'escalate')}
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Compliance Score Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Compliance Scores
                </CardTitle>
                <CardDescription>Compliance status across frameworks</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    score: {
                      label: "Compliance Score",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={complianceStatusData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="framework" type="category" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="score" fill="var(--color-score)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Controls Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Controls Summary
                </CardTitle>
                <CardDescription>Status of compliance controls</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Controls</span>
                    <span className="font-medium">{complianceOverview.totalControls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Passed</span>
                    <span className="font-medium text-green-600">{complianceOverview.passedControls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Failed</span>
                    <span className="font-medium text-red-600">
                      {complianceOverview.totalControls - complianceOverview.passedControls}
                    </span>
                  </div>
                  <div className="pt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Compliance</span>
                      <span>{complianceOverview.avgScore}%</span>
                    </div>
                    <Progress value={complianceOverview.avgScore} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Compliance Reports
              </CardTitle>
              <CardDescription>Detailed compliance assessment reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Framework</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Controls</TableHead>
                    <TableHead>Last Assessment</TableHead>
                    <TableHead>Next Assessment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complianceReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="font-medium">{report.framework}</div>
                      </TableCell>
                      <TableCell>{report.version}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(report.status)}`} />
                          <span className="capitalize">{report.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={report.compliance_score} className="w-16 h-2" />
                          <span className="font-medium">{report.compliance_score}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="text-green-600">{report.passed_controls}</span>
                          <span className="text-muted-foreground"> / </span>
                          <span>{report.total_controls}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(report.last_assessment).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">{report.assessor}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(report.next_assessment).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Security Rules</h3>
              <p className="text-muted-foreground">Automated security monitoring and response rules</p>
            </div>
            <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Lock className="h-4 w-4 mr-2" />
                  New Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create Security Rule</DialogTitle>
                  <DialogDescription>Define automated security monitoring and response</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="rule-name">Rule Name</Label>
                    <Input
                      id="rule-name"
                      value={newSecurityRule.name}
                      onChange={(e) => setNewSecurityRule(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Suspicious login attempts"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="rule-description">Description</Label>
                    <Textarea
                      id="rule-description"
                      value={newSecurityRule.description}
                      onChange={(e) => setNewSecurityRule(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detect multiple failed login attempts from same IP"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="rule-type">Rule Type</Label>
                      <Select
                        value={newSecurityRule.type}
                        onValueChange={(value) => setNewSecurityRule(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ip_blocking">IP Blocking</SelectItem>
                          <SelectItem value="rate_limiting">Rate Limiting</SelectItem>
                          <SelectItem value="anomaly_detection">Anomaly Detection</SelectItem>
                          <SelectItem value="data_loss_prevention">Data Loss Prevention</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="rule-sensitivity">Sensitivity</Label>
                      <Select
                        value={newSecurityRule.sensitivity}
                        onValueChange={(value) => setNewSecurityRule(prev => ({ ...prev, sensitivity: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowRuleDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateSecurityRule}>Create Rule</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sensitivity</TableHead>
                    <TableHead>Triggered</TableHead>
                    <TableHead>False Positives</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">{rule.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{rule.type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => handleToggleSecurityRule(rule.id)}
                          />
                          <span>{rule.enabled ? 'Active' : 'Inactive'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={rule.sensitivity === 'high' ? 'destructive' : rule.sensitivity === 'medium' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {rule.sensitivity}
                        </Badge>
                      </TableCell>
                      <TableCell>{rule.triggered_count}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{(rule.false_positive_rate * 100).toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(rule.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Controls Tab */}
        <TabsContent value="emergency" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Emergency Controls</h3>
              <p className="text-muted-foreground">Critical system controls for emergency response</p>
            </div>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Emergency Protocols
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {emergencyControls.map((control) => (
              <Card key={control.id} className={control.status === 'active' ? 'border-red-500' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        {control.type === 'lockdown' && <Lock className="h-5 w-5 mr-2" />}
                        {control.type === 'isolation' && <Shield className="h-5 w-5 mr-2" />}
                        {control.type === 'throttling' && <Zap className="h-5 w-5 mr-2" />}
                        {control.name}
                      </CardTitle>
                      <CardDescription className="mt-2">{control.description}</CardDescription>
                    </div>
                    <Badge
                      variant={control.status === 'active' ? 'destructive' : 'outline'}
                      className="capitalize"
                    >
                      {control.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Impact Level</span>
                      <Badge
                        variant={control.impact_level === 'high' ? 'destructive' : control.impact_level === 'medium' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {control.impact_level}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Affected Services</span>
                      <span>{control.affected_services.length}</span>
                    </div>
                    {control.status === 'active' && control.activated_at && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">Activated</p>
                        <p className="font-medium">{new Date(control.activated_at).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">by {control.activated_by}</p>
                      </div>
                    )}
                    <div className="flex space-x-2 pt-2">
                      {control.status === 'inactive' ? (
                        <Dialog open={showEmergencyDialog && selectedEmergencyControl === control.id}
                               onOpenChange={(open) => {
                                 setShowEmergencyDialog(open);
                                 if (!open) setSelectedEmergencyControl(null);
                               }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => setSelectedEmergencyControl(control.id)}
                            >
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Activate
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Activate Emergency Control</DialogTitle>
                              <DialogDescription>
                                This will activate "{control.name}" which may impact system availability.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <Alert className="border-red-200 bg-red-50">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <AlertTitle>High Impact Action</AlertTitle>
                                <AlertDescription>
                                  This emergency control affects {control.affected_services.length} services
                                  and has a {control.impact_level} impact level. Please confirm this action.
                                </AlertDescription>
                              </Alert>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => {
                                setShowEmergencyDialog(false);
                                setSelectedEmergencyControl(null);
                              }}>
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  handleActivateEmergencyControl(control.id);
                                  setShowEmergencyDialog(false);
                                  setSelectedEmergencyControl(null);
                                }}
                              >
                                Confirm Activation
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleDeactivateEmergencyControl(control.id)}
                        >
                          <StopCircle className="h-4 w-4 mr-2" />
                          Deactivate
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityComplianceDashboard;
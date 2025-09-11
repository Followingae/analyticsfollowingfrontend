'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Download,
  FileText,
  FileSpreadsheet,
  Calendar as CalendarIcon,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Brain,
  BarChart3,
  Shield,
  Users,
  MessageSquare,
  Target,
  Star
} from 'lucide-react'
import { format } from 'date-fns'
import { ExportRequest } from '@/types/comprehensiveAnalytics'
import { comprehensiveAnalyticsApi } from '@/services/comprehensiveAnalyticsApi'

interface ExportReportDialogProps {
  username: string
  trigger?: React.ReactNode
}

interface ExportSection {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  enabled: boolean
}

export function ExportReportDialog({ username, trigger }: ExportReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [exportType, setExportType] = useState<'complete' | 'custom'>('complete')
  const [format, setFormat] = useState<'json' | 'csv' | 'pdf'>('pdf')
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({})
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportResult, setExportResult] = useState<{ success: boolean; url?: string; error?: string } | null>(null)

  const [sections, setSections] = useState<ExportSection[]>([
    {
      id: 'ai_intelligence',
      name: 'AI Intelligence Analysis',
      description: '10-model comprehensive AI insights and behavioral patterns',
      icon: <Brain className="h-4 w-4 text-purple-600" />,
      enabled: true
    },
    {
      id: 'performance_analytics',
      name: 'Performance Analytics',
      description: 'Content performance metrics and AI recommendations',
      icon: <BarChart3 className="h-4 w-4 text-blue-600" />,
      enabled: true
    },
    {
      id: 'post_analytics',
      name: 'Individual Post Analytics',
      description: 'Per-post AI analysis with sentiment and categorization',
      icon: <MessageSquare className="h-4 w-4 text-green-600" />,
      enabled: true
    },
    {
      id: 'safety_assessment',
      name: 'Safety & Risk Assessment',
      description: 'Brand safety scores and compliance analysis',
      icon: <Shield className="h-4 w-4 text-red-600" />,
      enabled: true
    },
    {
      id: 'audience_insights',
      name: 'Audience Intelligence',
      description: 'Demographic predictions and engagement quality',
      icon: <Users className="h-4 w-4 text-orange-600" />,
      enabled: true
    },
    {
      id: 'competitive_analysis',
      name: 'Competitive Intelligence',
      description: 'Market positioning and benchmarking data',
      icon: <Target className="h-4 w-4 text-teal-600" />,
      enabled: false
    }
  ])

  const handleSectionToggle = (sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, enabled: !section.enabled }
        : section
    ))
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      setExportProgress(0)
      setExportResult(null)

      const enabledSections = sections.filter(section => section.enabled).map(section => section.id)

      const exportRequest: ExportRequest = {
        username,
        export_type: exportType,
        format,
        include_sections: enabledSections,
        ...(exportType === 'custom' && dateRange.start && dateRange.end ? {
          date_range: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString()
          }
        } : {})
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const response = await comprehensiveAnalyticsApi.exportAnalytics(exportRequest)
      
      clearInterval(progressInterval)
      setExportProgress(100)

      if (response.success) {
        setExportResult({ success: true, url: response.export.download_url })
        
        // Auto-download the file
        const link = document.createElement('a')
        link.href = response.export.download_url
        link.download = `${username}_analytics_report.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        setExportResult({ success: false, error: 'Export failed' })
      }
    } catch (error) {
      console.error('Export error:', error)
      setExportResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Export failed' 
      })
    } finally {
      setIsExporting(false)
      setTimeout(() => {
        setExportProgress(0)
        setExportResult(null)
      }, 5000)
    }
  }

  const getFormatIcon = (fmt: string) => {
    switch (fmt) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />
      case 'csv': return <FileSpreadsheet className="h-4 w-4 text-green-500" />
      case 'json': return <FileText className="h-4 w-4 text-blue-500" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-blue-600" />
            <span>Export Analytics Report</span>
          </DialogTitle>
          <DialogDescription>
            Generate a comprehensive analytics report for @{username} with AI insights and performance data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Export Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div 
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    exportType === 'complete' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setExportType('complete')}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-sm">Complete Report</span>
                    {exportType === 'complete' && <CheckCircle className="h-4 w-4 text-blue-600" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Full analytics report with all available AI insights and data
                  </p>
                </div>
                
                <div 
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    exportType === 'custom' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setExportType('custom')}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-sm">Custom Report</span>
                    {exportType === 'custom' && <CheckCircle className="h-4 w-4 text-blue-600" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose specific sections and date range for your report
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Export Format</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={format} onValueChange={(value: any) => setFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <div className="flex items-center space-x-2">
                      {getFormatIcon('pdf')}
                      <span>PDF Report (Recommended)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center space-x-2">
                      {getFormatIcon('csv')}
                      <span>CSV Data</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center space-x-2">
                      {getFormatIcon('json')}
                      <span>JSON Data</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Custom Export Options */}
          {exportType === 'custom' && (
            <>
              {/* Date Range */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Date Range (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.start ? format(dateRange.start, 'PPP') : 'Start date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.start}
                          onSelect={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <span className="text-sm text-muted-foreground">to</span>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.end ? format(dateRange.end, 'PPP') : 'End date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.end}
                          onSelect={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>

              {/* Section Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Include Sections</CardTitle>
                  <CardDescription>
                    Choose which analytics sections to include in your report
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sections.map((section) => (
                      <div
                        key={section.id}
                        className="flex items-start space-x-3 p-3 rounded-lg border bg-card"
                      >
                        <Checkbox
                          id={section.id}
                          checked={section.enabled}
                          onCheckedChange={() => handleSectionToggle(section.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {section.icon}
                            <label 
                              htmlFor={section.id} 
                              className="text-sm font-medium cursor-pointer"
                            >
                              {section.name}
                            </label>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {section.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Export Progress */}
          {isExporting && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Generating Analytics Report...</p>
                    <p className="text-xs text-muted-foreground">
                      Processing AI insights and compiling data
                    </p>
                  </div>
                  <span className="text-sm font-medium">{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} className="mt-3 h-2" />
              </CardContent>
            </Card>
          )}

          {/* Export Result */}
          {exportResult && (
            <Alert>
              {exportResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>
                {exportResult.success ? (
                  <div className="flex items-center justify-between">
                    <span>Report exported successfully! Download should start automatically.</span>
                    {exportResult.url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(exportResult.url, '_blank')}
                      >
                        Download Again
                      </Button>
                    )}
                  </div>
                ) : (
                  <span>Export failed: {exportResult.error}</span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {exportType === 'complete' ? 'Full report' : `${sections.filter(s => s.enabled).length} sections selected`}
              {' • '}{format.toUpperCase()} format
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={isExporting || (exportType === 'custom' && sections.filter(s => s.enabled).length === 0)}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
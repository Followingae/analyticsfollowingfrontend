'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  ChevronDown,
  ChevronUp,
  Coins,
  Edit,
  Shield,
  Tag,
  StickyNote,
} from 'lucide-react'
import type { MasterInfluencer } from '@/types/influencerDatabase'
import {
  DELIVERABLES,
  formatCents,
  computeMarginPercent,
} from '@/types/influencerDatabase'
import { InfluencerDetailSheet } from '@/components/superadmin/influencer-database/InfluencerDetailSheet'
import { superadminApi } from '@/services/superadminApi'
import { toast } from 'sonner'

interface SuperadminIMDPanelProps {
  influencer: MasterInfluencer
  onUpdated: () => void
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  blacklisted: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
}

const tierColors: Record<string, string> = {
  standard: 'bg-gray-100 text-gray-700',
  premium: 'bg-purple-100 text-purple-700',
  exclusive: 'bg-amber-100 text-amber-700',
}

export function SuperadminIMDPanel({ influencer, onUpdated }: SuperadminIMDPanelProps) {
  const [open, setOpen] = useState(true)
  const [editSheetOpen, setEditSheetOpen] = useState(false)

  const hasPricing = DELIVERABLES.some(
    d => influencer[d.costKey] !== null || influencer[d.sellKey] !== null
  )

  const handleSave = async (id: string, data: any) => {
    try {
      await superadminApi.updateInfluencerMetadata(id, data)
      toast.success('Influencer updated')
      setEditSheetOpen(false)
      onUpdated()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update')
    }
  }

  const handleRefresh = async (id: string) => {
    try {
      toast.info('Refreshing analytics...')
      onUpdated()
    } catch (error) {
      console.error('Failed to refresh analytics:', error)
    }
  }

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Master Database</span>
                <Badge variant="outline" className={statusColors[influencer.status] || ''}>
                  {influencer.status}
                </Badge>
                {influencer.tier && (
                  <Badge variant="secondary" className={tierColors[influencer.tier] || ''}>
                    {influencer.tier}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditSheetOpen(true)
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-4 px-4 space-y-4">
              <Separator />

              {/* Pricing Table */}
              {hasPricing ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Pricing per Deliverable
                    </h4>
                  </div>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-2 font-medium text-xs">Deliverable</th>
                          <th className="text-right p-2 font-medium text-xs">Cost</th>
                          <th className="text-right p-2 font-medium text-xs">Sell</th>
                          <th className="text-right p-2 font-medium text-xs">Margin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {DELIVERABLES.map(d => {
                          const cost = influencer[d.costKey]
                          const sell = influencer[d.sellKey]
                          if (cost === null && sell === null) return null
                          const margin = computeMarginPercent(cost, sell)
                          return (
                            <tr key={d.label} className="border-b last:border-0">
                              <td className="p-2 text-xs font-medium">{d.label}</td>
                              <td className="p-2 text-xs text-right">{formatCents(cost)}</td>
                              <td className="p-2 text-xs text-right">{formatCents(sell)}</td>
                              <td className="p-2 text-xs text-right">
                                {margin !== null ? (
                                  <span className={
                                    margin >= 20 ? 'text-green-600' :
                                    margin >= 0 ? 'text-yellow-600' : 'text-red-600'
                                  }>
                                    {margin.toFixed(1)}%
                                  </span>
                                ) : '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Coins className="h-3.5 w-3.5" />
                  No pricing set.
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setEditSheetOpen(true)}
                  >
                    Set pricing
                  </Button>
                </div>
              )}

              {/* Tags */}
              {influencer.tags && influencer.tags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Tags
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {influencer.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories */}
              {influencer.categories && influencer.categories.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Categories
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {influencer.categories.map(cat => (
                      <Badge key={cat} variant="outline" className="text-xs capitalize">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Internal Notes */}
              {influencer.internal_notes && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Internal Notes
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                    {influencer.internal_notes}
                  </p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <InfluencerDetailSheet
        influencer={influencer}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        onSave={(id, data) => handleSave(id, data)}
        onRefresh={(id) => handleRefresh(id)}
      />
    </>
  )
}

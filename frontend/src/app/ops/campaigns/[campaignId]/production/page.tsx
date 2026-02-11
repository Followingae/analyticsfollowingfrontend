/**
 * Operations OS - Global Production Management
 * Cross-workstream production scheduling and tracking
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import {
  Film,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Plus,
  Camera,
  Video
} from 'lucide-react';
import { ProductionBatch, ProductionChecklistStatus } from '@/types/operations';
import { operationsApi } from '@/services/operationsApi';
import { useOperations } from '@/contexts/OperationsContext';
import { toast } from 'sonner';
import { format, isToday, isTomorrow, isThisWeek, addDays } from 'date-fns';

export default function GlobalProductionPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const {
    currentCampaign,
    workstreams,
    selectCampaign,
    userAccess
  } = useOperations();

  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');

  useEffect(() => {
    if (campaignId && !currentCampaign) {
      selectCampaign(campaignId);
    }
    loadAllBatches();
  }, [campaignId]);

  const loadAllBatches = async () => {
    setLoading(true);
    try {
      const allBatches: ProductionBatch[] = [];
      for (const ws of workstreams) {
        const data = await operationsApi.getProductionBatches(ws.id);
        allBatches.push(...(data.batches || []));
      }
      setBatches(allBatches.sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ));
    } catch (error) {
      toast.error('Failed to load production batches');
    } finally {
      setLoading(false);
    }
  };

  const todayBatches = batches.filter(b => isToday(new Date(b.date)));
  const tomorrowBatches = batches.filter(b => isTomorrow(new Date(b.date)));
  const thisWeekBatches = batches.filter(b => isThisWeek(new Date(b.date)));
  const upcomingBatches = batches.filter(b =>
    new Date(b.date) > addDays(new Date(), 7)
  );

  const getBatchStatusCounts = (batch: ProductionBatch) => {
    const counts = {
      QUEUED: 0,
      FILMING: 0,
      DONE: 0,
      MISSING: 0,
      RESHOOT: 0
    };

    batch.checklist_items?.forEach(item => {
      counts[item.status]++;
    });

    return counts;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
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
            <span>Production</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Production Schedule</h1>
          <p className="text-muted-foreground mt-1">
            Manage shoots and production across all workstreams
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List View
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            Calendar View
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{batches.length}</p>
                <p className="text-xs text-muted-foreground">Total Shoots</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={todayBatches.length > 0 ? 'border-primary' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{todayBatches.length}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{thisWeekBatches.length}</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">
                  {batches.reduce((sum, b) => sum + b.deliverable_ids.length, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Deliverables</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-6">
          {/* Today's Shoots */}
          {todayBatches.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Badge variant="destructive">Today</Badge>
                {format(new Date(), 'EEEE, MMM d')}
              </h2>
              <div className="space-y-4">
                {todayBatches.map(batch => {
                  const counts = getBatchStatusCounts(batch);
                  const ws = workstreams.find(w => w.id === batch.workstream_id);
                  return (
                    <Card key={batch.id} className="border-primary">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{batch.name}</CardTitle>
                            <CardDescription>
                              {ws?.name} • {batch.location || 'No location set'}
                            </CardDescription>
                          </div>
                          <Badge variant="destructive">Live</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {batch.call_time && (
                            <div>
                              <p className="text-sm text-muted-foreground">Call Time</p>
                              <p className="font-medium">{batch.call_time}</p>
                            </div>
                          )}
                          {batch.wrap_time && (
                            <div>
                              <p className="text-sm text-muted-foreground">Wrap Time</p>
                              <p className="font-medium">{batch.wrap_time}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-muted-foreground">Deliverables</p>
                            <p className="font-medium">{batch.deliverable_ids.length}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Progress</p>
                            <p className="font-medium">
                              {counts.DONE}/{batch.deliverable_ids.length} done
                            </p>
                          </div>
                        </div>

                        {/* Quick Status */}
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {counts.QUEUED} queued
                          </Badge>
                          <Badge variant="secondary">
                            {counts.FILMING} filming
                          </Badge>
                          <Badge className="bg-green-100">
                            {counts.DONE} done
                          </Badge>
                          {counts.MISSING > 0 && (
                            <Badge variant="destructive">
                              {counts.MISSING} missing
                            </Badge>
                          )}
                          {counts.RESHOOT > 0 && (
                            <Badge className="bg-orange-100">
                              {counts.RESHOOT} reshoot
                            </Badge>
                          )}
                        </div>

                        <Button
                          className="mt-4"
                          onClick={() => router.push(
                            `/ops/campaigns/${campaignId}/workstreams/${batch.workstream_id}`
                          )}
                        >
                          Open Production Board
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tomorrow */}
          {tomorrowBatches.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Tomorrow • {format(addDays(new Date(), 1), 'EEEE, MMM d')}
              </h2>
              <div className="space-y-4">
                {tomorrowBatches.map(batch => {
                  const ws = workstreams.find(w => w.id === batch.workstream_id);
                  return (
                    <Card key={batch.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{batch.name}</CardTitle>
                            <CardDescription>
                              {ws?.name} • {batch.location || 'No location set'}
                            </CardDescription>
                          </div>
                          <Badge variant="outline">
                            {batch.deliverable_ids.length} deliverables
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {batch.call_time && (
                          <p className="text-sm">
                            Call time: {batch.call_time}
                            {batch.wrap_time && ` • Wrap: ${batch.wrap_time}`}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* This Week */}
          {thisWeekBatches.filter(b => !isToday(new Date(b.date)) && !isTomorrow(new Date(b.date))).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">This Week</h2>
              <div className="space-y-4">
                {thisWeekBatches
                  .filter(b => !isToday(new Date(b.date)) && !isTomorrow(new Date(b.date)))
                  .map(batch => {
                    const ws = workstreams.find(w => w.id === batch.workstream_id);
                    return (
                      <Card key={batch.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{batch.name}</CardTitle>
                              <CardDescription>
                                {format(new Date(batch.date), 'EEEE, MMM d')} • {ws?.name}
                              </CardDescription>
                            </div>
                            <Badge variant="outline">
                              {batch.deliverable_ids.length} deliverables
                            </Badge>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingBatches.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Upcoming</h2>
              <div className="space-y-4">
                {upcomingBatches.map(batch => {
                  const ws = workstreams.find(w => w.id === batch.workstream_id);
                  return (
                    <Card key={batch.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{batch.name}</CardTitle>
                            <CardDescription>
                              {format(new Date(batch.date), 'EEEE, MMM d, yyyy')} • {ws?.name}
                            </CardDescription>
                          </div>
                          <Badge variant="outline">
                            {batch.deliverable_ids.length} deliverables
                          </Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {batches.length === 0 && (
            <Alert>
              <Film className="h-4 w-4" />
              <AlertDescription>
                No production batches scheduled. Create batches in individual workstreams.
              </AlertDescription>
            </Alert>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  modifiers={{
                    shoot: batches.map(b => new Date(b.date))
                  }}
                  modifiersStyles={{
                    shoot: {
                      backgroundColor: 'rgb(147 51 234)',
                      color: 'white',
                      borderRadius: '4px'
                    }
                  }}
                />
              </div>
              <div>
                <h3 className="font-semibold mb-4">
                  {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
                </h3>
                {selectedDate && (
                  <div className="space-y-2">
                    {batches
                      .filter(b => format(new Date(b.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
                      .map(batch => {
                        const ws = workstreams.find(w => w.id === batch.workstream_id);
                        return (
                          <Card key={batch.id}>
                            <CardContent className="pt-4">
                              <p className="font-medium">{batch.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {ws?.name} • {batch.deliverable_ids.length} deliverables
                              </p>
                              {batch.location && (
                                <div className="flex items-center gap-1 mt-2 text-sm">
                                  <MapPin className="h-3 w-3" />
                                  {batch.location}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    {batches.filter(b =>
                      format(new Date(b.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                    ).length === 0 && (
                      <Alert>
                        <AlertDescription>
                          No shoots scheduled for this date
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
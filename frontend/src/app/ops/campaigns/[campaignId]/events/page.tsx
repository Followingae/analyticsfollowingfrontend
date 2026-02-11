/**
 * Operations OS - Events & Enrollment Management
 * Complete event activation and barter management system
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Plus,
  Calendar,
  MapPin,
  Users,
  Gift,
  Ticket,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  ExternalLink,
  ChevronRight,
  UserCheck,
  UserX,
  CalendarCheck,
  Video,
  Link2,
  Edit,
  Trash,
  Download,
  Upload,
  Filter
} from 'lucide-react';
import {
  CampaignEvent,
  EventShortlist,
  EventEnrollment,
  EventEnrollmentStatus
} from '@/types/operations';
import { operationsApi } from '@/services/operationsApi';
import { useOperations } from '@/contexts/OperationsContext';
import { toast } from 'sonner';
import { format, isAfter, isBefore } from 'date-fns';

// Shortlist Management Component
const ShortlistTab = ({ event, isInternal, onUpdate }: any) => {
  const [shortlist, setShortlist] = useState<EventShortlist[]>(event.shortlist || []);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newShortlist, setNewShortlist] = useState({
    creator_username: '',
    creator_name: '',
    tickets_requested: 1,
    products_requested: '',
    internal_notes: ''
  });
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  const handleAddToShortlist = async () => {
    if (!newShortlist.creator_username) {
      toast.error('Please enter creator username');
      return;
    }

    try {
      await operationsApi.shortlistCreatorForEvent(event.id, {
        creator_username: newShortlist.creator_username,
        creator_name: newShortlist.creator_name,
        tickets_requested: newShortlist.tickets_requested,
        products_requested: newShortlist.products_requested.split(',').filter(Boolean),
        internal_notes: newShortlist.internal_notes
      });
      toast.success('Added to shortlist');
      onUpdate();
      setAddDialogOpen(false);
      setNewShortlist({
        creator_username: '',
        creator_name: '',
        tickets_requested: 1,
        products_requested: '',
        internal_notes: ''
      });
    } catch (error) {
      toast.error('Failed to add to shortlist');
    }
  };

  const handleSelection = async (creatorId: string, selected: boolean) => {
    try {
      // Update selection status locally
      setShortlist(prev => prev.map(item =>
        item.creator_id === creatorId
          ? { ...item, selection_status: selected ? 'selected' : 'pending' }
          : item
      ));
      toast.success(selected ? 'Creator selected' : 'Selection removed');
    } catch (error) {
      toast.error('Failed to update selection');
    }
  };

  const handleBulkSelection = async () => {
    if (!bulkAction || selectedCreators.length === 0) {
      toast.error('Select creators and an action');
      return;
    }

    if (bulkAction === 'select') {
      selectedCreators.forEach(id => handleSelection(id, true));
    } else if (bulkAction === 'reject') {
      selectedCreators.forEach(id => handleSelection(id, false));
    } else if (bulkAction === 'enroll') {
      // Move selected creators to enrollment
      for (const creatorId of selectedCreators) {
        const creator = shortlist.find(s => s.creator_id === creatorId);
        if (creator && creator.selection_status === 'selected') {
          try {
            await operationsApi.enrollCreatorInEvent(event.id, {
              creator_id: creatorId,
              creator_username: creator.creator_username,
              creator_name: creator.creator_name,
              status: 'SELECTED',
              barter_given: {
                tickets: creator.tickets_requested,
                products: creator.products_requested
              }
            });
          } catch (error) {
            console.error('Failed to enroll creator:', error);
          }
        }
      }
      toast.success('Creators enrolled');
      onUpdate();
    }

    setSelectedCreators([]);
    setBulkAction('');
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedCreators.length > 0 && (
            <>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Bulk actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Mark as Selected</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="enroll">Create Enrollments</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleBulkSelection} size="sm">
                Apply to {selectedCreators.length}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCreators([])}
              >
                Clear
              </Button>
            </>
          )}
        </div>

        {isInternal && (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add to Shortlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Creator to Shortlist</DialogTitle>
                <DialogDescription>
                  Add a creator to the event shortlist for consideration
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Creator Username</Label>
                  <Input
                    value={newShortlist.creator_username}
                    onChange={(e) => setNewShortlist(prev => ({
                      ...prev,
                      creator_username: e.target.value
                    }))}
                    placeholder="@username"
                  />
                </div>
                <div>
                  <Label>Creator Name</Label>
                  <Input
                    value={newShortlist.creator_name}
                    onChange={(e) => setNewShortlist(prev => ({
                      ...prev,
                      creator_name: e.target.value
                    }))}
                    placeholder="Full name"
                  />
                </div>
                {event.barter_type === 'tickets' || event.barter_type === 'both' ? (
                  <div>
                    <Label>Tickets Requested</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newShortlist.tickets_requested}
                      onChange={(e) => setNewShortlist(prev => ({
                        ...prev,
                        tickets_requested: parseInt(e.target.value)
                      }))}
                    />
                  </div>
                ) : null}
                {event.barter_type === 'products' || event.barter_type === 'both' ? (
                  <div>
                    <Label>Products Requested</Label>
                    <Input
                      value={newShortlist.products_requested}
                      onChange={(e) => setNewShortlist(prev => ({
                        ...prev,
                        products_requested: e.target.value
                      }))}
                      placeholder="Product 1, Product 2..."
                    />
                  </div>
                ) : null}
                <div>
                  <Label>Internal Notes</Label>
                  <Textarea
                    value={newShortlist.internal_notes}
                    onChange={(e) => setNewShortlist(prev => ({
                      ...prev,
                      internal_notes: e.target.value
                    }))}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddToShortlist}>Add to Shortlist</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Shortlist Table */}
      {shortlist.length === 0 ? (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            No creators shortlisted yet. Add creators to begin the selection process.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {isInternal && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedCreators.length === shortlist.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCreators(shortlist.map(s => s.creator_id));
                        } else {
                          setSelectedCreators([]);
                        }
                      }}
                    />
                  </TableHead>
                )}
                <TableHead>Creator</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Selection</TableHead>
                {isInternal && <TableHead>Internal Notes</TableHead>}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shortlist.map((item) => (
                <TableRow key={item.id}>
                  {isInternal && (
                    <TableCell>
                      <Checkbox
                        checked={selectedCreators.includes(item.creator_id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCreators(prev => [...prev, item.creator_id]);
                          } else {
                            setSelectedCreators(prev =>
                              prev.filter(id => id !== item.creator_id)
                            );
                          }
                        }}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.creator_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.creator_username}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {item.tickets_requested && (
                        <Badge variant="outline">
                          <Ticket className="h-3 w-3 mr-1" />
                          {item.tickets_requested} ticket(s)
                        </Badge>
                      )}
                      {item.products_requested && item.products_requested.length > 0 && (
                        <Badge variant="outline">
                          <Package className="h-3 w-3 mr-1" />
                          {item.products_requested.length} product(s)
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.selection_status === 'selected' ? 'default' :
                        item.selection_status === 'rejected' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {item.selection_status === 'selected' && <UserCheck className="h-3 w-3 mr-1" />}
                      {item.selection_status === 'rejected' && <UserX className="h-3 w-3 mr-1" />}
                      {item.selection_status}
                    </Badge>
                  </TableCell>
                  {isInternal && (
                    <TableCell>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.internal_notes || '-'}
                      </p>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {isInternal && item.selection_status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSelection(item.creator_id, true)}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSelection(item.creator_id, false)}
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary */}
      {shortlist.length > 0 && (
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="font-medium">{shortlist.length}</span>
            <span className="text-muted-foreground ml-1">total shortlisted</span>
          </div>
          <div>
            <span className="font-medium text-green-600">
              {shortlist.filter(s => s.selection_status === 'selected').length}
            </span>
            <span className="text-muted-foreground ml-1">selected</span>
          </div>
          <div>
            <span className="font-medium text-yellow-600">
              {shortlist.filter(s => s.selection_status === 'pending').length}
            </span>
            <span className="text-muted-foreground ml-1">pending</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Enrollment Management Component
const EnrollmentTab = ({ event, isInternal, onUpdate }: any) => {
  const [enrollments, setEnrollments] = useState<EventEnrollment[]>(event.enrollments || []);
  const [filterStatus, setFilterStatus] = useState<EventEnrollmentStatus | 'all'>('all');

  const handleStatusUpdate = async (enrollmentId: string, status: EventEnrollmentStatus) => {
    try {
      // Update status locally
      setEnrollments(prev => prev.map(e =>
        e.id === enrollmentId ? { ...e, status } : e
      ));
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handlePostingUrlAdd = async (enrollmentId: string) => {
    const url = prompt('Enter posting URL:');
    if (url) {
      try {
        setEnrollments(prev => prev.map(e =>
          e.id === enrollmentId
            ? { ...e, posting_urls: [...(e.posting_urls || []), url] }
            : e
        ));
        toast.success('Posting URL added');
      } catch (error) {
        toast.error('Failed to add posting URL');
      }
    }
  };

  const filteredEnrollments = enrollments.filter(e =>
    filterStatus === 'all' || e.status === filterStatus
  );

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600';
      case 'overdue': return 'text-red-600';
      case 'violation': return 'text-red-800';
      default: return 'text-yellow-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Enrollments</SelectItem>
            <SelectItem value="SELECTED">Selected</SelectItem>
            <SelectItem value="INVITED">Invited</SelectItem>
            <SelectItem value="ATTENDED">Attended</SelectItem>
            <SelectItem value="CONTENT_READY">Content Ready</SelectItem>
            <SelectItem value="POSTED">Posted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Enrollments Table */}
      {filteredEnrollments.length === 0 ? (
        <Alert>
          <UserCheck className="h-4 w-4" />
          <AlertDescription>
            {enrollments.length === 0
              ? 'No enrollments yet. Select creators from the shortlist to create enrollments.'
              : 'No enrollments match your filter.'}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Barter Given</TableHead>
                <TableHead>Visit Schedule</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{enrollment.creator_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {enrollment.creator_username}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isInternal ? (
                      <Select
                        value={enrollment.status}
                        onValueChange={(v: EventEnrollmentStatus) =>
                          handleStatusUpdate(enrollment.id, v)
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SELECTED">Selected</SelectItem>
                          <SelectItem value="INVITED">Invited</SelectItem>
                          <SelectItem value="ATTENDED">Attended</SelectItem>
                          <SelectItem value="CONTENT_READY">Content Ready</SelectItem>
                          <SelectItem value="POSTED">Posted</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge>{enrollment.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {enrollment.barter_given?.tickets && (
                        <Badge variant="outline" className="text-xs">
                          <Ticket className="h-3 w-3 mr-1" />
                          {enrollment.barter_given.tickets}
                        </Badge>
                      )}
                      {enrollment.barter_given?.products && (
                        <Badge variant="outline" className="text-xs">
                          <Package className="h-3 w-3 mr-1" />
                          {enrollment.barter_given.products.length}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {enrollment.visit_date ? (
                      <div className="text-sm">
                        <p>{format(new Date(enrollment.visit_date), 'MMM d')}</p>
                        {enrollment.visit_time && (
                          <p className="text-muted-foreground">{enrollment.visit_time}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not scheduled</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {enrollment.posting_urls && enrollment.posting_urls.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <Link2 className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">
                            {enrollment.posting_urls.length} posted
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No content
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm font-medium ${getComplianceColor(enrollment.compliance_status)}`}>
                      {enrollment.compliance_status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {isInternal && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePostingUrlAdd(enrollment.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                      {enrollment.posting_urls && enrollment.posting_urls.length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(enrollment.posting_urls![0], '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Compliance Summary */}
      {enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compliance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {enrollments.filter(e => e.compliance_status === 'compliant').length}
                </p>
                <p className="text-sm text-muted-foreground">Compliant</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {enrollments.filter(e => e.compliance_status === 'pending').length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {enrollments.filter(e => e.compliance_status === 'overdue').length}
                </p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {enrollments.filter(e => e.attendance_confirmed).length}
                </p>
                <p className="text-sm text-muted-foreground">Attended</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Main Events Page
export default function EventsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const {
    currentCampaign,
    selectCampaign,
    uiState,
    userAccess
  } = useOperations();

  const [events, setEvents] = useState<CampaignEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CampaignEvent | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CampaignEvent>>({
    name: '',
    date: '',
    venue: '',
    type: 'activation',
    barter_type: 'tickets',
    barter_inventory: 0,
    status: 'planning'
  });

  useEffect(() => {
    if (campaignId && !currentCampaign) {
      selectCampaign(campaignId);
    }
    loadEvents();
  }, [campaignId]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await operationsApi.getEvents(campaignId);
      setEvents(data.events || []);
      if (data.events && data.events.length > 0 && !selectedEvent) {
        setSelectedEvent(data.events[0]);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.date) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const created = await operationsApi.createEvent(campaignId, newEvent);
      setEvents(prev => [...prev, created]);
      setCreateDialogOpen(false);
      setNewEvent({
        name: '',
        date: '',
        venue: '',
        type: 'activation',
        barter_type: 'tickets',
        barter_inventory: 0,
        status: 'planning'
      });
      toast.success('Event created');
      if (!selectedEvent) {
        setSelectedEvent(created);
      }
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  const isInternal = userAccess.permissions.view_internal_notes;
  const canCreate = userAccess.permissions.manage_events;

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
            <span>Events</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Events & Activations</h1>
          <p className="text-muted-foreground mt-1">
            Manage event activations and barter enrollments
          </p>
        </div>

        {canCreate && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Event</DialogTitle>
                <DialogDescription>
                  Create a new event activation for this campaign
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Event Name</Label>
                  <Input
                    value={newEvent.name}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Ramadan Activation"
                  />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Venue</Label>
                  <Input
                    value={newEvent.venue}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, venue: e.target.value }))}
                    placeholder="e.g., Dubai Mall"
                  />
                </div>
                <div>
                  <Label>Event Type</Label>
                  <Select
                    value={newEvent.type}
                    onValueChange={(v) => setNewEvent(prev => ({ ...prev, type: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activation">Activation</SelectItem>
                      <SelectItem value="shoot">Shoot</SelectItem>
                      <SelectItem value="experience">Experience</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Barter Type</Label>
                  <Select
                    value={newEvent.barter_type}
                    onValueChange={(v) => setNewEvent(prev => ({ ...prev, barter_type: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tickets">Tickets</SelectItem>
                      <SelectItem value="products">Products</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Barter Inventory</Label>
                  <Input
                    type="number"
                    value={newEvent.barter_inventory}
                    onChange={(e) => setNewEvent(prev => ({
                      ...prev,
                      barter_inventory: parseInt(e.target.value)
                    }))}
                    placeholder="Total tickets/products available"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEvent}>Create Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="font-semibold">No events scheduled</h3>
              <p className="text-sm text-muted-foreground">
                Create your first event to manage activations and enrollments
              </p>
              {canCreate && (
                <Button onClick={() => setCreateDialogOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Event
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Events List */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="font-semibold mb-2">Events</h3>
            {events.map((event) => (
              <Card
                key={event.id}
                className={`cursor-pointer transition-all ${
                  selectedEvent?.id === event.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedEvent(event)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.date), 'MMM d, yyyy')}
                    </p>
                    {event.venue && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {event.venue}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {event.barter_type === 'tickets' && <Ticket className="h-3 w-3" />}
                        {event.barter_type === 'products' && <Package className="h-3 w-3" />}
                        {event.barter_type === 'both' && <Gift className="h-3 w-3" />}
                      </Badge>
                      <Badge
                        variant={event.status === 'confirmed' ? 'default' : 'secondary'}
                      >
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Event Details */}
          <div className="lg:col-span-3">
            {selectedEvent ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedEvent.name}</CardTitle>
                      <CardDescription>
                        {format(new Date(selectedEvent.date), 'EEEE, MMMM d, yyyy')}
                        {selectedEvent.venue && ` • ${selectedEvent.venue}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {selectedEvent.type}
                      </Badge>
                      <Badge
                        variant={selectedEvent.status === 'confirmed' ? 'default' : 'secondary'}
                      >
                        {selectedEvent.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Barter Inventory */}
                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <p className="font-medium mb-2">Barter Inventory</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">
                          {selectedEvent.barter_type?.replace('_', ' ') || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Inventory</p>
                        <p className="font-medium">{selectedEvent.barter_inventory || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Allocated</p>
                        <p className="font-medium">
                          {selectedEvent.enrollments?.reduce((sum, e) =>
                            sum + (e.barter_given?.tickets || 0), 0
                          ) || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tabs for Shortlist and Enrollment */}
                  <Tabs defaultValue="shortlist">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="shortlist">
                        Shortlist ({selectedEvent.shortlist?.length || 0})
                      </TabsTrigger>
                      <TabsTrigger value="enrollment">
                        Enrollments ({selectedEvent.enrollments?.length || 0})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="shortlist" className="mt-4">
                      <ShortlistTab
                        event={selectedEvent}
                        isInternal={isInternal}
                        onUpdate={loadEvents}
                      />
                    </TabsContent>

                    <TabsContent value="enrollment" className="mt-4">
                      <EnrollmentTab
                        event={selectedEvent}
                        isInternal={isInternal}
                        onUpdate={loadEvents}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Select an event to view details
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
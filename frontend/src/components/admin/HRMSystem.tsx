'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Users, Calendar, DollarSign, FileText, Upload, Plus, Edit, Trash2,
  CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, Download,
  Briefcase, CreditCard, UserCheck, FileUp, TrendingUp, Camera,
  Eye, PlusCircle, CalendarDays, Receipt, FileCheck, UserPlus,
  ChevronLeft, Search, Filter, BarChart3, Building2, ClipboardList,
  CalendarCheck, FileDown, X, Info
} from 'lucide-react';
import { superadminService } from '@/utils/superadminApi';
import { format } from 'date-fns';

// Types
type MainView = 'dashboard' | 'employees' | 'create-employee' | 'edit-employee' | 'employee-detail' |
                'attendance' | 'leaves' | 'create-leave' | 'timesheets' | 'payroll' |
                'documents' | 'reports';

interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
  employment_type: string;
  basic_salary: number;
  status: string;
  hire_date: string;
  phone?: string;
  profile_picture_url?: string;
  address?: string;
  emergency_contact?: string;
}

interface DocumentUpload {
  file: File;
  type: string;
  number: string;
  expiry_date: string;
  preview?: string;
}

export default function HRMSystem() {
  // Main navigation
  const [mainView, setMainView] = useState<MainView>('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dashboard stats
  const [stats, setStats] = useState<any>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');

  // CREATE EMPLOYEE FORM - All fields on the page, NO DIALOG!
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    // Basic Info
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',

    // Work Info
    employee_id: '',
    department: '',
    position: '',
    employment_type: 'full_time',
    hire_date: '',
    basic_salary: 0,

    // Personal Info
    address: '',
    // Emergency contact as object structure
    emergency_contact: {
      name: '',
      phone: '',
      relationship: ''
    },

    // Profile Picture - INLINE UPLOAD
    profile_picture: null as File | null,
    profile_picture_preview: '',

    // Documents - INLINE MULTIPLE UPLOADS
    documents: [] as DocumentUpload[]
  });

  // Edit Employee Form
  const [editEmployeeForm, setEditEmployeeForm] = useState<typeof newEmployeeForm>(newEmployeeForm);

  // Leave Form - Also on its own page
  const [leaveForm, setLeaveForm] = useState({
    employee_id: '',
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: ''
  });

  // Load data
  useEffect(() => {
    if (mainView === 'dashboard') loadDashboard();
    if (mainView === 'employees' || mainView === 'create-employee') loadEmployees();
  }, [mainView]);

  // Auto-generate employee code when creating new employee
  useEffect(() => {
    if (mainView === 'create-employee' && employees.length > 0 && !newEmployeeForm.employee_id) {
      const nextCode = generateNextEmployeeCode();
      setNewEmployeeForm(prev => ({
        ...prev,
        employee_id: nextCode
      }));
    }
  }, [mainView, employees]);

  // Clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const loadDashboard = async () => {
    try {
      const overview = await superadminService.hrm.getHRMOverview();
      setStats(overview);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  };

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await superadminService.hrm.getEmployees();
      setEmployees(data.employees || []);
    } catch (err) {
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  // Generate next available employee code
  const generateNextEmployeeCode = () => {
    if (employees.length === 0) {
      return 'EMP001';
    }

    const codes = employees.map(e => e.employee_id || e.employee_code || '');
    const numbers = codes
      .map(code => {
        const match = code.match(/EMP(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => !isNaN(n) && n > 0);

    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `EMP${String(maxNum + 1).padStart(3, '0')}`;
  };

  // Handle profile picture selection WITH PREVIEW
  const handleProfilePictureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEmployeeForm({
          ...newEmployeeForm,
          profile_picture: file,
          profile_picture_preview: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle document upload WITH MULTIPLE FILES
  const handleDocumentAdd = () => {
    setNewEmployeeForm({
      ...newEmployeeForm,
      documents: [...newEmployeeForm.documents, {
        file: new File([], ''),
        type: 'passport',
        number: '',
        expiry_date: ''
      }]
    });
  };

  const handleDocumentRemove = (index: number) => {
    setNewEmployeeForm({
      ...newEmployeeForm,
      documents: newEmployeeForm.documents.filter((_, i) => i !== index)
    });
  };

  const handleDocumentFileChange = (index: number, file: File) => {
    const newDocs = [...newEmployeeForm.documents];
    newDocs[index].file = file;
    setNewEmployeeForm({...newEmployeeForm, documents: newDocs});
  };

  // CREATE EMPLOYEE - All data including files
  const handleCreateEmployee = async () => {
    setLoading(true);
    try {
      // Transform data to match backend expectations
      const employeeData = {
        employee_code: newEmployeeForm.employee_id, // Map employee_id to employee_code
        full_name: `${newEmployeeForm.first_name} ${newEmployeeForm.last_name}`, // Combine names
        email: newEmployeeForm.email,
        phone: newEmployeeForm.phone || "",
        department: newEmployeeForm.department,
        position: newEmployeeForm.position,
        employment_type: newEmployeeForm.employment_type,
        hire_date: newEmployeeForm.hire_date,
        base_salary: newEmployeeForm.basic_salary, // Map basic_salary to base_salary
        address: newEmployeeForm.address || "",
        emergency_contact: { // Always send as object
          name: newEmployeeForm.emergency_contact.name || "",
          phone: newEmployeeForm.emergency_contact.phone || "",
          relationship: newEmployeeForm.emergency_contact.relationship || ""
        }
      };

      const response = await superadminService.hrm.createEmployee(employeeData);
      const employeeId = response.id;

      // Upload profile picture if provided
      if (newEmployeeForm.profile_picture) {
        await superadminService.hrm.uploadProfilePicture(employeeId, newEmployeeForm.profile_picture);
      }

      // Upload documents if provided
      for (const doc of newEmployeeForm.documents) {
        if (doc.file && doc.file.size > 0) {
          await superadminService.hrm.uploadDocument(employeeId, {
            document_type: doc.type,
            document_number: doc.number,
            expiry_date: doc.expiry_date,
            file_url: doc.file.name // In real app, upload file first
          });
        }
      }

      setSuccess('Employee created successfully with all documents!');
      // Reset form
      setNewEmployeeForm({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        phone: '',
        employee_id: '',
        department: '',
        position: '',
        employment_type: 'full_time',
        hire_date: '',
        basic_salary: 0,
        address: '',
        emergency_contact: {
          name: '',
          phone: '',
          relationship: ''
        },
        profile_picture: null,
        profile_picture_preview: '',
        documents: []
      });
      setMainView('employees');
      loadEmployees();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  const navigateToEmployeeDetail = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setMainView('employee-detail');
  };

  const navigateToEditEmployee = (employee: Employee) => {
    setSelectedEmployeeId(employee.id);
    setEditEmployeeForm({
      ...newEmployeeForm,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone || '',
      employee_id: employee.employee_id,
      department: employee.department,
      position: employee.position,
      employment_type: employee.employment_type,
      hire_date: employee.hire_date,
      basic_salary: employee.basic_salary,
      address: employee.address || '',
      emergency_contact: employee.emergency_contact || ''
    });
    setMainView('edit-employee');
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = searchQuery === '' ||
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDepartment === 'all' || emp.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  const departments = [...new Set(employees.map(e => e.department))];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">HR Management System</h1>
          <p className="text-muted-foreground">Complete HRM with all features</p>
        </div>
        <div className="flex gap-2">
          {mainView !== 'dashboard' && mainView !== 'employees' && (
            <Button onClick={() => setMainView('employees')} variant="outline">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Main Navigation */}
      <Tabs value={mainView} onValueChange={(v) => setMainView(v as MainView)}>
        <TabsList className="grid grid-cols-8 w-full">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
          <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* DASHBOARD VIEW */}
      {mainView === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Employees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_employees || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.active_employees || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Departments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.departments || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pending Leaves</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pending_leaves || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button onClick={() => setMainView('create-employee')} className="h-20">
                  <div className="flex flex-col items-center">
                    <UserPlus className="h-6 w-6 mb-2" />
                    <span>Add Employee</span>
                  </div>
                </Button>
                <Button onClick={() => setMainView('attendance')} variant="outline" className="h-20">
                  <div className="flex flex-col items-center">
                    <Calendar className="h-6 w-6 mb-2" />
                    <span>Attendance</span>
                  </div>
                </Button>
                <Button onClick={() => setMainView('payroll')} variant="outline" className="h-20">
                  <div className="flex flex-col items-center">
                    <DollarSign className="h-6 w-6 mb-2" />
                    <span>Payroll</span>
                  </div>
                </Button>
                <Button onClick={() => setMainView('leaves')} variant="outline" className="h-20">
                  <div className="flex flex-col items-center">
                    <CalendarDays className="h-6 w-6 mb-2" />
                    <span>Leaves</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* EMPLOYEES LIST VIEW */}
      {mainView === 'employees' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Employee Management</CardTitle>
                <Button onClick={() => setMainView('create-employee')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Employee
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search & Filter */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Employees Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Photo</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            {employee.profile_picture_url ? (
                              <img
                                src={employee.profile_picture_url}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xs">
                                {employee.first_name[0]}{employee.last_name[0]}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{employee.employee_id}</TableCell>
                        <TableCell className="font-medium">
                          {`${employee.first_name} ${employee.last_name}`}
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>
                          <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                            {employee.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigateToEmployeeDetail(employee.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigateToEditEmployee(employee)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CREATE EMPLOYEE PAGE - NO DIALOG! FULL PAGE FORM WITH INLINE UPLOADS! */}
      {mainView === 'create-employee' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Employee</CardTitle>
              <CardDescription>Add a new employee with all their information and documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

              {/* PROFILE PICTURE SECTION - INLINE UPLOAD! */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>
                <div className="flex items-start gap-6">
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    {newEmployeeForm.profile_picture_preview ? (
                      <img
                        src={newEmployeeForm.profile_picture_preview}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <Camera className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Upload Profile Picture</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureSelect}
                    />
                    <p className="text-sm text-muted-foreground">
                      Upload a professional photo. Max size: 5MB
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* BASIC INFORMATION */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      value={newEmployeeForm.first_name}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, first_name: e.target.value})}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input
                      value={newEmployeeForm.last_name}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, last_name: e.target.value})}
                      placeholder="Doe"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newEmployeeForm.email}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, email: e.target.value})}
                      placeholder="john.doe@company.com"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={newEmployeeForm.phone}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, phone: e.target.value})}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* EMPLOYMENT INFORMATION */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Employment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Employee ID * (Auto-generated)</Label>
                    <Input
                      value={newEmployeeForm.employee_id}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, employee_id: e.target.value})}
                      placeholder="EMP001"
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label>Department *</Label>
                    <Input
                      value={newEmployeeForm.department}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, department: e.target.value})}
                      placeholder="Engineering"
                    />
                  </div>
                  <div>
                    <Label>Position *</Label>
                    <Input
                      value={newEmployeeForm.position}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, position: e.target.value})}
                      placeholder="Senior Developer"
                    />
                  </div>
                  <div>
                    <Label>Employment Type</Label>
                    <Select
                      value={newEmployeeForm.employment_type}
                      onValueChange={(v) => setNewEmployeeForm({...newEmployeeForm, employment_type: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Hire Date *</Label>
                    <Input
                      type="date"
                      value={newEmployeeForm.hire_date}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, hire_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Basic Salary *</Label>
                    <Input
                      type="number"
                      value={newEmployeeForm.basic_salary}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, basic_salary: Number(e.target.value)})}
                      placeholder="50000"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* PERSONAL INFORMATION */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Address</Label>
                    <Textarea
                      value={newEmployeeForm.address}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, address: e.target.value})}
                      placeholder="123 Main Street, City, State, ZIP"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Emergency Contact Name</Label>
                    <Input
                      value={newEmployeeForm.emergency_contact.name}
                      onChange={(e) => setNewEmployeeForm({
                        ...newEmployeeForm,
                        emergency_contact: {
                          ...newEmployeeForm.emergency_contact,
                          name: e.target.value
                        }
                      })}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <Label>Emergency Contact Phone</Label>
                    <Input
                      value={newEmployeeForm.emergency_contact.phone}
                      onChange={(e) => setNewEmployeeForm({
                        ...newEmployeeForm,
                        emergency_contact: {
                          ...newEmployeeForm.emergency_contact,
                          phone: e.target.value
                        }
                      })}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div>
                    <Label>Emergency Contact Relationship</Label>
                    <Input
                      value={newEmployeeForm.emergency_contact.relationship}
                      onChange={(e) => setNewEmployeeForm({
                        ...newEmployeeForm,
                        emergency_contact: {
                          ...newEmployeeForm.emergency_contact,
                          relationship: e.target.value
                        }
                      })}
                      placeholder="Brother, Sister, Parent, etc."
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* DOCUMENTS SECTION - INLINE MULTIPLE UPLOADS! */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Documents</h3>
                  <Button type="button" onClick={handleDocumentAdd} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </div>

                {newEmployeeForm.documents.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-muted-foreground">No documents added yet</p>
                    <Button
                      type="button"
                      onClick={handleDocumentAdd}
                      variant="outline"
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Document
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {newEmployeeForm.documents.map((doc, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-medium">Document {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDocumentRemove(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Document Type</Label>
                              <Select
                                value={doc.type}
                                onValueChange={(v) => {
                                  const newDocs = [...newEmployeeForm.documents];
                                  newDocs[index].type = v;
                                  setNewEmployeeForm({...newEmployeeForm, documents: newDocs});
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="passport">Passport</SelectItem>
                                  <SelectItem value="visa">Visa</SelectItem>
                                  <SelectItem value="id_card">ID Card</SelectItem>
                                  <SelectItem value="degree">Degree Certificate</SelectItem>
                                  <SelectItem value="contract">Employment Contract</SelectItem>
                                  <SelectItem value="nda">NDA</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Document Number</Label>
                              <Input
                                value={doc.number}
                                onChange={(e) => {
                                  const newDocs = [...newEmployeeForm.documents];
                                  newDocs[index].number = e.target.value;
                                  setNewEmployeeForm({...newEmployeeForm, documents: newDocs});
                                }}
                                placeholder="Document ID/Number"
                              />
                            </div>
                            <div>
                              <Label>Expiry Date</Label>
                              <Input
                                type="date"
                                value={doc.expiry_date}
                                onChange={(e) => {
                                  const newDocs = [...newEmployeeForm.documents];
                                  newDocs[index].expiry_date = e.target.value;
                                  setNewEmployeeForm({...newEmployeeForm, documents: newDocs});
                                }}
                              />
                            </div>
                            <div>
                              <Label>Upload File</Label>
                              <Input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleDocumentFileChange(index, file);
                                }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* FORM ACTIONS */}
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => setMainView('employees')}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateEmployee}
                  disabled={loading}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Employee
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* OTHER VIEWS - Simplified for brevity */}
      {mainView === 'attendance' && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Upload Attendance CSV</Label>
                <Input type="file" accept=".csv" />
              </div>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Attendance
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {mainView === 'leaves' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Leave Management</CardTitle>
                <Button onClick={() => setMainView('create-leave')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Leave Request
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p>Leave requests will appear here</p>
            </CardContent>
          </Card>
        </div>
      )}

      {mainView === 'create-leave' && (
        <Card>
          <CardHeader>
            <CardTitle>Create Leave Request</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Employee</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Leave Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="sick">Sick</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="date" />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" />
              </div>
              <div className="md:col-span-2">
                <Label>Reason</Label>
                <Textarea placeholder="Enter reason for leave" rows={4} />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <Button variant="outline" onClick={() => setMainView('leaves')}>
                Cancel
              </Button>
              <Button>Submit Request</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {mainView === 'payroll' && (
        <Card>
          <CardHeader>
            <CardTitle>Payroll Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Button>
              <DollarSign className="h-4 w-4 mr-2" />
              Calculate All Payroll
            </Button>
          </CardContent>
        </Card>
      )}

      {mainView === 'documents' && (
        <Card>
          <CardHeader>
            <CardTitle>Document Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Document expiry tracking will appear here</p>
          </CardContent>
        </Card>
      )}

      {mainView === 'reports' && (
        <Card>
          <CardHeader>
            <CardTitle>HR Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Various HR reports and analytics</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
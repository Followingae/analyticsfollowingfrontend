'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { cn } from '@/lib/utils';
import {
  Users, Calendar, DollarSign, FileText, Upload, Plus, Edit, Trash2,
  CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, Download,
  Briefcase, CreditCard, UserCheck, FileUp, TrendingUp, Camera,
  Eye, PlusCircle, CalendarDays, Receipt, FileCheck, UserPlus,
  ChevronLeft, Search, Filter, BarChart3, Building2, ClipboardList,
  CalendarCheck, FileDown, X, Info, Loader2, Check
} from 'lucide-react';
import { superadminService } from '@/utils/superadminApi';
import { format } from 'date-fns';
import { debounce } from 'lodash';
import { toast } from 'sonner';

// Types
type MainView = 'dashboard' | 'employees' | 'create-employee' | 'edit-employee' | 'employee-detail' |
                'attendance' | 'leaves' | 'create-leave' | 'timesheets' | 'payroll' |
                'documents' | 'reports';

interface Employee {
  id: string;
  employee_id: string;
  employee_code?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  department: string;
  position: string;
  employment_type: string;
  basic_salary: number;
  base_salary?: number;
  status: string;
  hire_date: string;
  phone?: string;
  profile_picture_url?: string;
  address?: string;
  emergency_contact?: any;
}

interface DocumentUpload {
  file: File | null;
  type: string;
  number: string;
  expiry_date: string;
  preview?: string;
}

interface ValidationState {
  employee_code?: { valid?: boolean; error?: string; checking?: boolean };
  email?: { valid?: boolean; error?: string; checking?: boolean };
}

export default function HRMSystemEnhanced() {
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

  // Validation states
  const [validationState, setValidationState] = useState<ValidationState>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // File input refs for better control
  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const documentFileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // CREATE EMPLOYEE FORM
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
    emergency_contact: {
      name: '',
      phone: '',
      relationship: ''
    },

    // Profile Picture
    profile_picture: null as File | null,
    profile_picture_preview: '',

    // Documents
    documents: [] as DocumentUpload[]
  });

  // Edit Employee Form
  const [editEmployeeForm, setEditEmployeeForm] = useState<typeof newEmployeeForm>(newEmployeeForm);

  // Debounced validation functions
  const checkEmployeeCode = useCallback(
    debounce(async (code: string) => {
      if (!code || code.trim() === '') {
        setValidationState(prev => ({
          ...prev,
          employee_code: { error: 'Employee code is required', checking: false }
        }));
        return;
      }

      setValidationState(prev => ({
        ...prev,
        employee_code: { ...prev.employee_code, checking: true, error: undefined }
      }));

      try {
        const result = await superadminService.hrm.checkEmployeeCode(code);

        if (result.exists) {
          setValidationState(prev => ({
            ...prev,
            employee_code: { valid: false, error: 'This employee code already exists', checking: false }
          }));
        } else {
          setValidationState(prev => ({
            ...prev,
            employee_code: { valid: true, error: undefined, checking: false }
          }));
        }
      } catch (error) {
        console.error('Error checking employee code:', error);
        setValidationState(prev => ({
          ...prev,
          employee_code: { error: 'Unable to validate employee code', checking: false }
        }));
      }
    }, 500),
    []
  );

  const checkEmployeeEmail = useCallback(
    debounce(async (email: string) => {
      if (!email || !email.includes('@')) {
        setValidationState(prev => ({
          ...prev,
          email: { error: 'Valid email is required', checking: false }
        }));
        return;
      }

      setValidationState(prev => ({
        ...prev,
        email: { ...prev.email, checking: true, error: undefined }
      }));

      try {
        const result = await superadminService.hrm.checkEmployeeEmail(email);

        if (result.exists) {
          setValidationState(prev => ({
            ...prev,
            email: { valid: false, error: 'This email is already registered', checking: false }
          }));
        } else {
          setValidationState(prev => ({
            ...prev,
            email: { valid: true, error: undefined, checking: false }
          }));
        }
      } catch (error) {
        console.error('Error checking email:', error);
        setValidationState(prev => ({
          ...prev,
          email: { error: 'Unable to validate email', checking: false }
        }));
      }
    }, 500),
    []
  );

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
      // Validate the generated code
      checkEmployeeCode(nextCode);
    }
  }, [mainView, employees, checkEmployeeCode]);

  // Form validation check
  useEffect(() => {
    const hasRequiredFields =
      newEmployeeForm.first_name.trim() !== '' &&
      newEmployeeForm.last_name.trim() !== '' &&
      newEmployeeForm.email.trim() !== '' &&
      newEmployeeForm.employee_id.trim() !== '' &&
      newEmployeeForm.department.trim() !== '' &&
      newEmployeeForm.position.trim() !== '' &&
      newEmployeeForm.hire_date !== '' &&
      newEmployeeForm.basic_salary > 0;

    const hasNoValidationErrors =
      (!validationState.employee_code?.error && !validationState.email?.error) &&
      (!validationState.employee_code?.checking && !validationState.email?.checking);

    setIsFormValid(hasRequiredFields && hasNoValidationErrors);
  }, [newEmployeeForm, validationState]);

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
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEmployeeForm({
          ...newEmployeeForm,
          profile_picture: file,
          profile_picture_preview: reader.result as string
        });
        toast.success('Profile picture selected');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle document upload WITH MULTIPLE FILES
  const handleDocumentAdd = () => {
    setNewEmployeeForm({
      ...newEmployeeForm,
      documents: [...newEmployeeForm.documents, {
        file: null,
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
    // Clean up ref
    delete documentFileInputRefs.current[index];
  };

  const handleDocumentFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Document size must be less than 10MB');
        return;
      }

      const newDocs = [...newEmployeeForm.documents];
      newDocs[index].file = file;

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newDocs[index].preview = reader.result as string;
          setNewEmployeeForm({...newEmployeeForm, documents: newDocs});
        };
        reader.readAsDataURL(file);
      } else {
        setNewEmployeeForm({...newEmployeeForm, documents: newDocs});
      }

      toast.success(`Document ${index + 1} selected`);
    }
  };

  // Handle input changes with validation
  const handleEmployeeIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewEmployeeForm({...newEmployeeForm, employee_id: value});

    // Trigger validation
    if (value) {
      checkEmployeeCode(value);
    } else {
      setValidationState(prev => ({
        ...prev,
        employee_code: { error: 'Employee code is required', checking: false }
      }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewEmployeeForm({...newEmployeeForm, email: value});

    // Trigger validation
    if (value) {
      checkEmployeeEmail(value);
    } else {
      setValidationState(prev => ({
        ...prev,
        email: { error: 'Valid email is required', checking: false }
      }));
    }
  };

  // CREATE EMPLOYEE - All data including files
  const handleCreateEmployee = async () => {
    if (!isFormValid) {
      toast.error('Please fix validation errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const employeeData = {
        employee_code: newEmployeeForm.employee_id,
        full_name: `${newEmployeeForm.first_name} ${newEmployeeForm.last_name}`,
        email: newEmployeeForm.email,
        phone: newEmployeeForm.phone || "",
        department: newEmployeeForm.department,
        position: newEmployeeForm.position,
        employment_type: newEmployeeForm.employment_type,
        hire_date: newEmployeeForm.hire_date,
        base_salary: newEmployeeForm.basic_salary,
        address: newEmployeeForm.address || "",
        emergency_contact: {
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
            file_url: doc.file.name
          });
        }
      }

      toast.success('Employee created successfully with all documents!');
      setSuccess('Employee created successfully!');

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
      setValidationState({});
      setMainView('employees');
      loadEmployees();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to create employee';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Get input validation class
  const getInputClassName = (field: 'employee_code' | 'email') => {
    const state = validationState[field];
    if (state?.checking) return 'border-yellow-500 focus:ring-yellow-500';
    if (state?.error) return 'border-red-500 focus:ring-red-500';
    if (state?.valid) return 'border-green-500 focus:ring-green-500';
    return '';
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = searchQuery === '' ||
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.employee_id || '').toLowerCase().includes(searchQuery.toLowerCase());
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
          <p className="text-muted-foreground">Enhanced HRM with Real-time Validation</p>
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
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
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
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">No employees found</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery ? 'Try adjusting your search' : 'Add your first employee to get started'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setMainView('create-employee')}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add First Employee
                    </Button>
                  )}
                </div>
              ) : (
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
                                  alt={`${employee.first_name} ${employee.last_name}`}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-medium">
                                  {employee.first_name?.[0]}{employee.last_name?.[0]}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{employee.employee_id || employee.employee_code}</TableCell>
                          <TableCell className="font-medium">
                            {employee.full_name || `${employee.first_name} ${employee.last_name}`}
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
                                onClick={() => {
                                  setSelectedEmployeeId(employee.id);
                                  setMainView('employee-detail');
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedEmployeeId(employee.id);
                                  setMainView('edit-employee');
                                }}
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
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* CREATE EMPLOYEE PAGE - ENHANCED WITH VALIDATION */}
      {mainView === 'create-employee' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Employee</CardTitle>
              <CardDescription>Add a new employee with all their information and documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

              {/* PROFILE PICTURE SECTION - ENHANCED UI */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>
                <div className="flex items-start gap-6">
                  <div className="relative group">
                    <div className={cn(
                      "w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors",
                      newEmployeeForm.profile_picture_preview
                        ? "border-primary"
                        : "border-gray-300 hover:border-primary"
                    )}>
                      {newEmployeeForm.profile_picture_preview ? (
                        <img
                          src={newEmployeeForm.profile_picture_preview}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="h-8 w-8 text-gray-400 group-hover:text-primary transition-colors" />
                      )}
                    </div>
                    {newEmployeeForm.profile_picture_preview && (
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => {
                          setNewEmployeeForm({
                            ...newEmployeeForm,
                            profile_picture: null,
                            profile_picture_preview: ''
                          });
                          if (profilePictureInputRef.current) {
                            profilePictureInputRef.current.value = '';
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="profile-picture">Upload Profile Picture</Label>
                    <div className="flex gap-2">
                      <input
                        ref={profilePictureInputRef}
                        id="profile-picture"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePictureSelect}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => profilePictureInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Upload a professional photo. Max size: 5MB. Supported formats: JPG, PNG, GIF
                    </p>
                    {newEmployeeForm.profile_picture && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        {newEmployeeForm.profile_picture.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* BASIC INFORMATION WITH VALIDATION */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="first_name"
                      value={newEmployeeForm.first_name}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, first_name: e.target.value})}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="last_name"
                      value={newEmployeeForm.last_name}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, last_name: e.target.value})}
                      placeholder="Doe"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={newEmployeeForm.email}
                        onChange={handleEmailChange}
                        placeholder="john.doe@company.com"
                        className={cn("pr-10", getInputClassName('email'))}
                        required
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {validationState.email?.checking && (
                          <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                        )}
                        {validationState.email?.valid && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {validationState.email?.error && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    {validationState.email?.error && (
                      <p className="text-sm text-red-500 mt-1">{validationState.email.error}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newEmployeeForm.phone}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, phone: e.target.value})}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* EMPLOYMENT INFORMATION WITH VALIDATION */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Employment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employee_id">
                      Employee Code <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="employee_id"
                        value={newEmployeeForm.employee_id}
                        onChange={handleEmployeeIdChange}
                        placeholder="EMP001"
                        className={cn("pr-10", getInputClassName('employee_code'))}
                        required
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {validationState.employee_code?.checking && (
                          <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                        )}
                        {validationState.employee_code?.valid && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {validationState.employee_code?.error && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    {validationState.employee_code?.error && (
                      <p className="text-sm text-red-500 mt-1">{validationState.employee_code.error}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Auto-generated or enter custom code
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="department">
                      Department <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="department"
                      value={newEmployeeForm.department}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, department: e.target.value})}
                      placeholder="Engineering"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">
                      Position <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="position"
                      value={newEmployeeForm.position}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, position: e.target.value})}
                      placeholder="Senior Developer"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="employment_type">Employment Type</Label>
                    <Select
                      value={newEmployeeForm.employment_type}
                      onValueChange={(v) => setNewEmployeeForm({...newEmployeeForm, employment_type: v})}
                    >
                      <SelectTrigger id="employment_type">
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
                    <Label htmlFor="hire_date">
                      Hire Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="hire_date"
                      type="date"
                      value={newEmployeeForm.hire_date}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, hire_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="basic_salary">
                      Base Salary <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="basic_salary"
                      type="number"
                      value={newEmployeeForm.basic_salary}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, basic_salary: Number(e.target.value)})}
                      placeholder="50000"
                      min="0"
                      required
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
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={newEmployeeForm.address}
                      onChange={(e) => setNewEmployeeForm({...newEmployeeForm, address: e.target.value})}
                      placeholder="123 Main Street, City, State, ZIP"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergency_name">Emergency Contact Name</Label>
                    <Input
                      id="emergency_name"
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
                    <Label htmlFor="emergency_phone">Emergency Contact Phone</Label>
                    <Input
                      id="emergency_phone"
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
                    <Label htmlFor="emergency_relationship">Emergency Contact Relationship</Label>
                    <Input
                      id="emergency_relationship"
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

              {/* DOCUMENTS SECTION - ENHANCED FILE UPLOAD */}
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
                      <Card key={index} className="relative">
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
                              <Label htmlFor={`doc-type-${index}`}>Document Type</Label>
                              <Select
                                value={doc.type}
                                onValueChange={(v) => {
                                  const newDocs = [...newEmployeeForm.documents];
                                  newDocs[index].type = v;
                                  setNewEmployeeForm({...newEmployeeForm, documents: newDocs});
                                }}
                              >
                                <SelectTrigger id={`doc-type-${index}`}>
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
                              <Label htmlFor={`doc-number-${index}`}>Document Number</Label>
                              <Input
                                id={`doc-number-${index}`}
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
                              <Label htmlFor={`doc-expiry-${index}`}>Expiry Date</Label>
                              <Input
                                id={`doc-expiry-${index}`}
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
                              <Label htmlFor={`doc-file-${index}`}>Upload File</Label>
                              <div className="flex gap-2">
                                <input
                                  ref={el => documentFileInputRefs.current[index] = el}
                                  id={`doc-file-${index}`}
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                  className="hidden"
                                  onChange={(e) => handleDocumentFileChange(index, e)}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => documentFileInputRefs.current[index]?.click()}
                                  className="w-full"
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  {doc.file ? 'Change File' : 'Choose File'}
                                </Button>
                              </div>
                              {doc.file && (
                                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                                  <Check className="h-3 w-3" />
                                  {doc.file.name}
                                </p>
                              )}
                            </div>
                          </div>
                          {doc.preview && (
                            <div className="mt-4">
                              <Label>Preview</Label>
                              <div className="mt-2 border rounded-lg overflow-hidden">
                                <img
                                  src={doc.preview}
                                  alt="Document preview"
                                  className="w-full max-h-48 object-contain"
                                />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* FORM ACTIONS WITH VALIDATION STATE */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {!isFormValid && (
                    <p className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      Please complete all required fields and fix validation errors
                    </p>
                  )}
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMainView('employees');
                      setValidationState({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateEmployee}
                    disabled={loading || !isFormValid}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create Employee
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* OTHER VIEWS - Placeholder for brevity */}
      {mainView === 'attendance' && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Attendance management features coming soon...</p>
          </CardContent>
        </Card>
      )}

      {mainView === 'leaves' && (
        <Card>
          <CardHeader>
            <CardTitle>Leave Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Leave management features coming soon...</p>
          </CardContent>
        </Card>
      )}

      {mainView === 'timesheets' && (
        <Card>
          <CardHeader>
            <CardTitle>Timesheet Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Timesheet features coming soon...</p>
          </CardContent>
        </Card>
      )}

      {mainView === 'payroll' && (
        <Card>
          <CardHeader>
            <CardTitle>Payroll Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Payroll features coming soon...</p>
          </CardContent>
        </Card>
      )}

      {mainView === 'documents' && (
        <Card>
          <CardHeader>
            <CardTitle>Document Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Document management features coming soon...</p>
          </CardContent>
        </Card>
      )}

      {mainView === 'reports' && (
        <Card>
          <CardHeader>
            <CardTitle>HR Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Report generation features coming soon...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import { useForm, FormProvider } from 'react-hook-form';
import useMemberStore from '@/stores/useMemberStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import MembershipTypeSelect from './MembershipTypeSelect';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const EditMembersPage = () => {
  const { id } = useParams();
  const {
    getMemberById,
    updateMember,
    isUpdating,
    selectedMember, // Access the member from store state
    isFetchingSingle,
    error: storeError,
    errorMessage: storeErrorMessage
  } = useMemberStore();

  const [error, setError] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [updatedMember, setUpdatedMember] = useState(null);
  const navigate = useNavigate();

  // Use only one useForm instance
  const methods = useForm({
    defaultValues: {
      name: '',
      email: '',
      contact: '',
      nric: '',
      dob: '',
      sex: '',
      address: '',
      membership_type_id: '',
      created_at: '',
      created_by: '',
      remarks: ''
    }
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors }
  } = methods;

  // Helper function to parse date strings from API
  const parseDateString = (dateStr) => {
    if (!dateStr) return '';

    try {
      // Handle different date formats
      if (dateStr.includes(',')) {
        // Format: "15 Aug 1990" or "11 Aug 2024, 08:46 PM"
        const datePart = dateStr.split(',')[0].trim();
        const date = new Date(datePart);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
        }
      } else {
        // Try parsing as regular date
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    } catch (error) {
      console.error('Date parsing error:', error);
    }

    return '';
  };

  const parseDateTimeString = (dateStr) => {
    if (!dateStr) return '';

    try {
      // Handle format: "11 Aug 2024, 08:46 PM"
      if (dateStr.includes(',')) {
        const [datePart, timePart] = dateStr.split(',').map(s => s.trim());
        const date = new Date(`${datePart} ${timePart}`);
        if (!isNaN(date.getTime())) {
          return date.toISOString().slice(0, 16); // Return YYYY-MM-DDTHH:MM format
        }
      } else {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().slice(0, 16);
        }
      }
    } catch (error) {
      console.error('DateTime parsing error:', error);
    }

    return '';
  };

  // Load member data on component mount
  useEffect(() => {
    const loadMember = async () => {
      if (!id) {
        setError('Member ID is required');
        return;
      }

      try {
        setError(null);
        await getMemberById(id);
      } catch (err) {
        setError('Failed to load member data');
        console.error('Error loading member:', err);
      }
    };

    loadMember();
  }, [id, getMemberById]);

  // Reset form when member data is loaded
  useEffect(() => {
    if (selectedMember) {
      console.log('Selected member data:', selectedMember); // Debug log

      const formattedDob = parseDateString(selectedMember.dob);
      const formattedCreatedAt = parseDateTimeString(selectedMember.created_at);

      // Reset form with member data
      reset({
        name: selectedMember.name || '',
        email: selectedMember.email || '',
        contact: selectedMember.contact || '',
        nric: selectedMember.nric || '',
        dob: formattedDob,
        sex: selectedMember.sex || '',
        address: selectedMember.address || '',
        membership_type_id: selectedMember.membership_type_id?.toString() || '',
        created_at: formattedCreatedAt,
        created_by: selectedMember.created_by?.toString() || '',
        remarks: selectedMember.remarks || ''
      });

      // Set the sex value for the Select component
      if (selectedMember.sex) {
        setValue('sex', selectedMember.sex);
      }
    }
  }, [selectedMember, reset, setValue]);

  // Handle store errors
  useEffect(() => {
    if (storeError && storeErrorMessage) {
      setError(storeErrorMessage);
    }
  }, [storeError, storeErrorMessage]);

  const onSubmit = async (data) => {
    setError(null);
    const timestamp = new Date().toISOString();

    const updateData = {
      ...data,
      id: parseInt(id),
      membership_type_id: data.membership_type_id
        ? parseInt(data.membership_type_id)
        : null,
      updated_by: data.updated_by
        ? parseInt(data.updated_by)
        : null,
      updated_at: timestamp,
    };

    const result = await updateMember(id, updateData); // Pass id as first parameter

    if (result.success) {
      setUpdatedMember(data);
      setShowSuccessDialog(true);
    } else {
      setError(result.error);
    }
  };

  const handleCloseDialog = () => {
    setShowSuccessDialog(false);
    setUpdatedMember(null);
  };

  const handleGoToMembers = () => {
    setShowSuccessDialog(false);
    navigate('/member');
  };

  const handleGoToMemberDetail = () => {
    setShowSuccessDialog(false);
    navigate(`/member/${id}`);
  };

  // Loading state
  if (isFetchingSingle) {
    return (
      <div className='[--header-height:calc(theme(spacing.14))]'>
        <SidebarProvider className='flex flex-col'>
          <SiteHeader />
          <div className='flex flex-1'>
            <AppSidebar />
            <SidebarInset>
              <div className="w-full max-w-none p-6">
                <div className="flex items-center justify-center h-64">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-lg">Loading member data...</span>
                  </div>
                </div>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  // Error state
  if (error && !selectedMember) {
    return (
      <div className='[--header-height:calc(theme(spacing.14))]'>
        <SidebarProvider className='flex flex-col'>
          <SiteHeader />
          <div className='flex flex-1'>
            <AppSidebar />
            <SidebarInset>
              <div className="w-full max-w-none p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Link to="/member">
                    <Button variant="ghost" size="sm" className="p-2">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Edit Member</h1>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
                <div className="mt-4">
                  <Link to="/member">
                    <Button variant="outline">
                      Back to Members
                    </Button>
                  </Link>
                </div>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className="w-full max-w-none p-6">
              {/* Header Section */}
              <div className="flex items-center gap-3 mb-6">
                <Link to="/member">
                  <Button variant="ghost" size="sm" className="p-2">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Edit Member</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Update member details and information for {selectedMember?.name}
                  </p>
                </div>
              </div>

              {/* Form Section */}
              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                            Full Name *
                          </Label>
                          <Input
                            id="name"
                            placeholder="Enter full name"
                            {...register("name", { required: "Name is required" })}
                            className={errors.name ? "border-red-500" : ""}
                          />
                          {errors.name && (
                            <p className="text-red-500 text-xs">{errors.name.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                            Email Address *
                          </Label>
                          <Input
                            id="email"
                            placeholder="Enter email address"
                            type="email"
                            {...register("email", {
                              required: "Email is required",
                              pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "Invalid email address"
                              }
                            })}
                            className={errors.email ? "border-red-500" : ""}
                          />
                          {errors.email && (
                            <p className="text-red-500 text-xs">{errors.email.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="contact" className="text-sm font-medium text-gray-700">
                            Contact Number *
                          </Label>
                          <Input
                            id="contact"
                            placeholder="Enter contact number"
                            {...register("contact", { required: "Contact number is required" })}
                            className={errors.contact ? "border-red-500" : ""}
                          />
                          {errors.contact && (
                            <p className="text-red-500 text-xs">{errors.contact.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="nric" className="text-sm font-medium text-gray-700">
                            NRIC/ID Number
                          </Label>
                          <Input
                            id="nric"
                            placeholder="Enter NRIC/ID number"
                            {...register("nric")}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dob" className="text-sm font-medium text-gray-700">
                            Date of Birth
                          </Label>
                          <Input
                            id="dob"
                            type="date"
                            {...register("dob")}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Gender
                          </Label>
                          <Select
                            onValueChange={(val) => setValue('sex', val)}
                            value={watch('sex')} // Use watch to get current value
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                            Address
                          </Label>
                          <Textarea
                            id="address"
                            placeholder="Enter full address"
                            {...register("address")}
                            rows={3}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Membership Information Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">Membership Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Creation Date & Time (Read-only) */}
                        <div className="space-y-2">
                          <Label htmlFor="created_at" className="text-sm font-medium text-gray-700">
                            Creation Date & Time
                          </Label>
                          <Input
                            id="created_at"
                            type="datetime-local"
                            {...register("created_at")}
                          />
                          <p className="text-xs text-gray-500">This field cannot be modified</p>
                        </div>

                        {/* Created By (Read-only display) */}
                        <div className="space-y-2">
                          <EmployeeSelect name="created_by" label="Created By *" />
                        </div>

                        {/* Membership Type */}
                        <div className="space-y-2">
                          <MembershipTypeSelect defaultValue={selectedMember?.membership_type_id?.toString()} />
                        </div>
                      </div>

                      {/* Remarks Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="remarks" className="text-sm font-medium text-gray-700">
                            Remarks
                          </Label>
                          <Textarea
                            id="remarks"
                            placeholder="Enter any additional remarks or notes"
                            {...register("remarks")}
                            rows={3}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-between items-center pt-6 border-t">
                    <div className="text-sm text-gray-500">
                      All fields marked with * are required
                    </div>
                    <div className="flex gap-3">
                      <Link to="/member">
                        <Button type="button" variant="outline">
                          Cancel
                        </Button>
                      </Link>
                      <Button
                        type="submit"
                        disabled={isUpdating}
                        className="px-12 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating Member...
                          </>
                        ) : (
                          "Update Member"
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </FormProvider>
            </div>
          </SidebarInset>
        </div>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                Member Updated Successfully!
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-4">
                The member "{updatedMember?.name}" has been updated successfully.
              </p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Full Name:</span>
                  <span className="font-medium text-gray-900">
                    {updatedMember?.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">
                    {updatedMember?.email}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Contact:</span>
                  <span className="font-medium text-gray-900">
                    {updatedMember?.contact}
                  </span>
                </div>
                {updatedMember?.sex && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Gender:</span>
                    <span className="font-medium text-gray-900">
                      {updatedMember?.sex}
                    </span>
                  </div>
                )}
                {updatedMember?.dob && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date of Birth:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(updatedMember?.dob).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={handleGoToMemberDetail}>
                View Member Details
              </Button>
              <Button onClick={handleGoToMembers} className="bg-blue-600 hover:bg-blue-700">
                View All Members
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarProvider>
    </div>
  );
};

export default EditMembersPage;
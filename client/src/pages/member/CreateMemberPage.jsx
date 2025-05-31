import { useForm } from 'react-hook-form';
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
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

const CreateMembersPage = () => {
  const { createMember, isCreating } = useMemberStore();
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    setError(null);
    const timestamp = new Date().toISOString();

    const result = await createMember({
      ...data,
      membership_type_id: data.membership_type_id
        ? parseInt(data.membership_type_id)
        : null,
      created_at: timestamp,
      updated_at: timestamp,
      role_id: 4,
    });

    if (result.success) {
      reset();
    } else {
      setError(result.error);
    }
  };

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
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Create New Member</h1>
                  <p className="text-sm text-gray-600 mt-1">Add member details and information</p>
                </div>
              </div>

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
                        <Select onValueChange={(val) => setValue('sex', val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
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
                      <div className="space-y-2">
                        <Label htmlFor="membership_type_id" className="text-sm font-medium text-gray-700">
                          Membership Type ID
                        </Label>
                        <Input
                          id="membership_type_id"
                          placeholder="Enter membership type ID"
                          type="number"
                          {...register("membership_type_id")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="created_by" className="text-sm font-medium text-gray-700">
                          Created By *
                        </Label>
                        <Input
                          id="created_by"
                          placeholder="Enter creator name"
                          {...register("created_by", { required: "Created by is required" })}
                          className={errors.created_by ? "border-red-500" : ""}
                        />
                        {errors.created_by && (
                          <p className="text-red-500 text-xs">{errors.created_by.message}</p>
                        )}
                      </div>
                    </div>

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
                  <Button 
                    type="submit" 
                    disabled={isCreating} 
                    className="px-12 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base"
                  >
                    {isCreating ? "Creating Member..." : "Create Member"}
                  </Button>
                </div>
              </form>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default CreateMembersPage;
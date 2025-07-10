import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, UserCog, AlertCircle, Shield, Mail, User as UserIcon, Key } from 'lucide-react';
import useUsersStore from '@/stores/users/useUsersStore';
import useAuth from '@/hooks/useAuth';
import api from '@/services/api';

// Form validation schema
const updateUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  role_name: z.string().optional(),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 8, {
      message: 'Password must be at least 8 characters long or empty',
    }),
});

function UpdateUserPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const { updateUser } = useUsersStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const form = useForm({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      username: '',
      email: '',
      role_name: '',
      password: '',
    },
  });

  // Fetch user data and roles
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch user details
        const userResponse = await api.get(`/auth/users/${id}`);
        setUser(userResponse.data);

        // Set form values
        form.reset({
          username: userResponse.data.username,
          email: userResponse.data.email,
          role_name: userResponse.data.role_name,
          password: '',
        });

        // Fetch available roles
        const rolesResponse = await api.get('/auth/roles');
        setRoles(rolesResponse.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load user data');
        console.error('Error loading user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, form]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    // Remove empty fields
    const updatedData = { ...data };
    if (!updatedData.password) delete updatedData.password;

    // Only allow super_admin to change roles
    if (currentUser.role !== 'super_admin') {
      delete updatedData.role_name;
    }

    try {
      await updateUser(id, updatedData);
      setSuccessMessage('User updated successfully');

      // Clear password field after successful update
      form.setValue('password', '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if current user can edit this user
  const canEditRole = currentUser?.role === 'super_admin';
  const isOwnAccount = currentUser?.id === id;

  if (loading) {
    return (
      <div className='[--header-height:calc(theme(spacing.14))]'>
        <SidebarProvider className='flex flex-col'>
          <SiteHeader />
          <div className='flex flex-1'>
            <AppSidebar />
            <SidebarInset>
              <div className='flex h-full items-center justify-center'>
                <div className='text-center'>
                  <div className='text-2xl font-semibold'>Loading user data...</div>
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
            <div className='container mx-auto p-6 max-w-3xl'>
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center'>
                  <Button variant='ghost' onClick={() => navigate('/users')} className='mr-4'>
                    <ArrowLeft className='h-4 w-4 mr-2' />
                    Back
                  </Button>
                  <h1 className='text-2xl font-bold'>Update User</h1>
                </div>
              </div>

              {error && (
                <Alert variant='destructive' className='mb-6'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className='mb-6 bg-green-50 border-green-200'>
                  <AlertCircle className='h-4 w-4 text-green-600' />
                  <AlertDescription className='text-green-800'>{successMessage}</AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <UserCog className='h-5 w-5 mr-2' />
                    Edit User: {user?.username}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                      <FormField
                        control={form.control}
                        name='username'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='flex items-center'>
                              <UserIcon className='h-4 w-4 mr-2 text-muted-foreground' />
                              Username
                            </FormLabel>
                            <FormControl>
                              <Input placeholder='johndoe' {...field} />
                            </FormControl>
                            <FormDescription>The username for this user account.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='email'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='flex items-center'>
                              <Mail className='h-4 w-4 mr-2 text-muted-foreground' />
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input type='email' placeholder='john.doe@example.com' {...field} />
                            </FormControl>
                            <FormDescription>
                              Changing the email will require the user to verify their new email address.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {canEditRole && (
                        <FormField
                          control={form.control}
                          name='role_name'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='flex items-center'>
                                <Shield className='h-4 w-4 mr-2 text-muted-foreground' />
                                Role
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Select a role' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.role_name}>
                                      {role.role_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                The user's role determines their permissions in the system.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name='password'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='flex items-center'>
                              <Key className='h-4 w-4 mr-2 text-muted-foreground' />
                              Password
                            </FormLabel>
                            <FormControl>
                              <Input type='password' placeholder='Leave blank to keep current password' {...field} />
                            </FormControl>
                            <FormDescription>Enter a new password only if you want to change it.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className='flex justify-end space-x-4 pt-4'>
                        <Button type='button' variant='outline' onClick={() => navigate('/users')}>
                          Cancel
                        </Button>
                        <Button type='submit' disabled={isSubmitting}>
                          {isSubmitting ? 'Saving...' : 'Update User'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

export default UpdateUserPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowLeft, UserPlus, LinkIcon, Copy, AlertCircle } from 'lucide-react';
import useUsersStore from '@/stores/users/useUsersStore';
import api from '@/services/api';

// Form validation schema
const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.email('Invalid email address'),
  role_name: z.string().min(1, 'Role is required'),
});

function CreateUserPage() {
  const navigate = useNavigate();
  const { createUser } = useUsersStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');

  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      email: '',
      role_name: '',
    },
  });

  // Fetch available roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get('/auth/roles');
        setRoles(response.data);
      } catch (err) {
        setError('Failed to load roles. Please try again.');
        console.error('Error loading roles:', err);
      }
    };

    fetchRoles();
  }, []);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError('');

    try {
      const result = await createUser(data);
      setSuccess(true);
      setInviteUrl(result.inviteUrl);
      form.reset();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyInviteUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
  };

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
                  <Button variant='ghost' onClick={() => navigate(-1)} className='mr-4'>
                    <ArrowLeft className='h-4 w-4 mr-2' />
                    Back
                  </Button>
                  <h1 className='text-2xl font-bold'>Create User</h1>
                </div>
              </div>

              {error && (
                <Alert variant='destructive' className='mb-6'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <UserPlus className='h-5 w-5 mr-2' />
                    New User Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {success && inviteUrl ? (
                    <div className='space-y-4'>
                      <Alert className='bg-green-50 border-green-200'>
                        <AlertDescription className='text-green-800'>
                          User created successfully! Share the invitation link below with the user.
                        </AlertDescription>
                      </Alert>

                      <div className='p-4 border rounded-md'>
                        <h3 className='text-lg font-semibold mb-2'>Invitation Link</h3>
                        <div className='flex items-center gap-2 p-2 bg-muted rounded-md'>
                          <LinkIcon className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                          <div className='text-sm flex-1 overflow-x-auto whitespace-nowrap'>{inviteUrl}</div>
                          <Button variant='outline' size='sm' onClick={handleCopyInviteUrl} className='flex-shrink-0'>
                            <Copy className='h-4 w-4 mr-2' />
                            Copy
                          </Button>
                        </div>
                      </div>

                      <div className='flex justify-between mt-4'>
                        <Button variant='outline' onClick={() => navigate('/users')}>
                          Return to Users
                        </Button>
                        <Button onClick={() => setSuccess(false)}>Create Another User</Button>
                      </div>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                        <FormField
                          control={form.control}
                          name='username'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
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
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type='email' placeholder='john.doe@example.com' {...field} />
                              </FormControl>
                              <FormDescription>
                                The email address for this user account. This will be used for login and verification.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='role_name'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                        <div className='flex justify-end space-x-4 pt-4'>
                          <Button type='button' variant='outline' onClick={() => navigate('/users')}>
                            Cancel
                          </Button>
                          <Button type='submit' disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create User'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

export default CreateUserPage;

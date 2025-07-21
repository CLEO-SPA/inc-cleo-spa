'use client';

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { toast } from 'sonner';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
  Card, CardHeader, CardTitle, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft, AlertCircle, CheckCircle, Shield,
} from 'lucide-react';
import useUsersStore from '@/stores/users/useUsersStore';
import useAuth from '@/hooks/useAuth';
import api from '@/services/api';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';

const updateUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  role_name: z.string().optional(),
});

export default function UpdateUserPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const { updateUser } = useUsersStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const form = useForm({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      username: '',
      email: '',
      role_name: '',
    },
  });

  const { control, handleSubmit, reset, formState: { errors } } = form;
  const canEditRole = currentUser?.role === 'super_admin';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get(`/auth/users/${id}`);
        setUser(userRes.data);
        reset({
          username: userRes.data.username,
          email: userRes.data.email,
          role_name: userRes.data.role_name,
        });

        const rolesRes = await api.get('/auth/roles');
        setRoles(rolesRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load user data');
      }
    };
    fetchData();
  }, [id, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError('');
    setSuccess(false);
    const updatedData = { ...data };
    if (!canEditRole) delete updatedData.role_name;

    try {
      await updateUser(id, updatedData);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-col gap-4 p-4 max-w-2xl'>
              <div className='flex items-center'>
                <Button variant='ghost' onClick={() => navigate(-1)} className='mr-4'>
                  <ArrowLeft className='h-4 w-4 mr-2' /> Back
                </Button>
                <h1 className='text-2xl font-bold'>Update User</h1>
              </div>

              {error && (
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert variant='success'>
                  <CheckCircle className='h-4 w-4' />
                  <AlertDescription>User updated successfully.</AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Edit User Details</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                      <div>
                        <Label htmlFor='username'>Username *</Label>
                        <Input id='username' {...form.register('username')} />
                        {errors.username && (
                          <p className='text-red-500 text-xs mt-1'>{errors.username.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor='email'>Email *</Label>
                        <Input id='email' type='email' {...form.register('email')} />
                        {errors.email && (
                          <p className='text-red-500 text-xs mt-1'>{errors.email.message}</p>
                        )}
                      </div>

                      {canEditRole && (
                        <FormField
                          control={control}
                          name='role_name'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel htmlFor='role_name' className='flex items-center'>
                                <Shield className='h-4 w-4 mr-2 text-muted-foreground' />
                                Role
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Select role' />
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
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </CardContent>
                  </Card>

                  <Button type='submit' disabled={isSubmitting} className='w-full'>
                    {isSubmitting ? 'Updating...' : 'Update User'}
                  </Button>
                </form>
              </Form>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowLeft, LinkIcon, Copy,
  AlertCircle, CheckCircle, Loader2,
} from 'lucide-react';
import useUsersStore from '@/stores/users/useUsersStore';
import api from '@/services/api';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';

const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  role_name: z.string().min(1, 'Role is required'),
});

export default function CreateUserPage() {
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

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = form;

  useEffect(() => {
    // Reset state on mount
    setSuccess(false);
    setInviteUrl('');
    setError('');
    reset();

    const fetchRoles = async () => {
      try {
        const res = await api.get('/auth/roles');
        setRoles(res.data);
      } catch (err) {
        setError('Failed to load roles. Please try again.');
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
      setInviteUrl(result.inviteUrl); // ✅ must match returned key
      reset();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast('Invitation link copied', {
      description: 'The link has been copied to your clipboard.',
    });
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
                <h1 className='text-2xl font-bold'>Add New User</h1>
              </div>

              {error && (
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && inviteUrl && (
                <Alert variant='success'>
                  <CheckCircle className='h-4 w-4' />
                  <AlertDescription>
                    User created successfully. Share the link below.
                  </AlertDescription>
                </Alert>
              )}

              {success && inviteUrl ? (
                <div className='space-y-6'>
                  <div className='p-4 border rounded-md'>
                    <h3 className='text-lg font-semibold mb-2'>Invitation Link</h3>
                    <div className='flex items-center gap-2 p-2 bg-muted rounded-md'>
                      <LinkIcon className='h-4 w-4 text-muted-foreground' />
                      <div className='text-sm flex-1 overflow-x-auto whitespace-nowrap'>{inviteUrl}</div>
                      <Button variant='outline' size='sm' onClick={handleCopy}>
                        <Copy className='h-4 w-4 mr-1' /> Copied
                      </Button>
                    </div>
                  </div>
                  <div className='flex justify-between'>
                    <Button variant='outline' onClick={() => navigate('/users')}>
                      Return to Users
                    </Button>
                    <Button onClick={() => {
                      setSuccess(false);
                      setInviteUrl('');
                    }}>
                      Create Another User
                    </Button>
                  </div>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
                    <Card>
                      <CardHeader>
                        <CardTitle>User Details</CardTitle>
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

                        <FormField
                          control={control}
                          name='role_name'
                          render={({ field }) => (
                            <FormItem>
                              <Label htmlFor='role_name'>Role *</Label>
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
                      </CardContent>
                    </Card>

                    <Button type='submit' disabled={isSubmitting} className='w-full'>
                      {isSubmitting ? (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      ) : (
                        'Create User'
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

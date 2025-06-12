import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function PositionForm({
  mode = 'create',
  formData,
  setFormData,
  isActive,
  setIsActive,
  onSubmit,
  loading,
  error,
  success,
}) {
  return (
    <form onSubmit={onSubmit} className='w-full max-w-2xl mx-auto space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'edit' ? 'Edit Position' : 'Create Position'}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className='border-green-200 bg-green-50'>
              <CheckCircle className='h-4 w-4 text-green-600' />
              <AlertDescription className='text-green-800'>{success}</AlertDescription>
            </Alert>
          )}

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <Label htmlFor='position_name'>Position Name</Label>
              <Input
                name='position_name'
                value={formData.position_name}
                onChange={(e) => setFormData({ ...formData, position_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor='position_description'>Description</Label>
              <Input
                name='position_description'
                value={formData.position_description}
                onChange={(e) => setFormData({ ...formData, position_description: e.target.value })}
                required
              />
            </div>
            <div className='md:col-span-2'>
              <Label htmlFor='status'>Status</Label>
              <div className='flex items-center gap-3'>
                <Switch id='status' checked={isActive} onCheckedChange={setIsActive} />
                <span>{isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>

          <div className='flex justify-end pt-4'>
            <Button type='submit' disabled={loading} className='h-12 px-8 bg-black hover:bg-gray-800 text-white'>
              {loading ? (
                <div className='flex items-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  {mode === 'edit' ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                mode === 'edit' ? 'Update Position' : 'Create Position'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
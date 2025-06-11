import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function PositionForm({
  initialValues = { position_name: '', position_description: '', position_is_active: true },
  onSubmit,
  formTitle = 'Create Position',
  submitLabel = 'Create',
}) {
  const [formData, setFormData] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await onSubmit(formData);
      setSuccess(`${submitLabel}d successfully`);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{formTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-200 bg-green-50 mt-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label>Position Name</Label>
            <Input
              value={formData.position_name}
              onChange={(e) => handleChange('position_name', e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={formData.position_description}
              onChange={(e) => handleChange('position_description', e.target.value)}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.position_is_active}
              onCheckedChange={(val) => handleChange('position_is_active', val)}
            />
            <Label>{formData.position_is_active ? 'Active' : 'Inactive'}</Label>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
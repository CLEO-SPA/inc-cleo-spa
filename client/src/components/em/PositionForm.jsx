import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function PositionForm({ mode = 'create' }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    position_name: '',
    position_description: '',
  });
  const [isActive, setIsActive] = useState(true);
  const [positionData, setPositionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch existing data for edit mode
  useEffect(() => {
    if (mode === 'edit' && id) {
      setLoading(true);
      fetch(`/api/positions/${id}`)
        .then((res) => res.json())
        .then((data) => setPositionData(data))
        .catch((err) => setError('Error fetching position data'))
        .finally(() => setLoading(false));
    }
  }, [mode, id]);

  // Populate form when data is loaded
  useEffect(() => {
    if (mode === 'edit' && positionData) {
      setFormData({
        position_name: positionData.position_name,
        position_description: positionData.position_description,
      });
      setIsActive(positionData.position_is_active);
    }
  }, [mode, positionData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        position_is_active: isActive,
      };
      const url = mode === 'edit' ? `/api/positions/${id}` : '/api/positions';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Something went wrong');

      setSuccess(result.message);
      setTimeout(() => navigate('/positions'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'edit' ? 'Edit' : 'Create'} Position</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 mb-4">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="position_name">Position Name</Label>
                <Input
                  name="position_name"
                  value={formData.position_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="position_description">Description</Label>
                <Input
                  name="position_description"
                  value={formData.position_description}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="status" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="status">Active</Label>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {mode === 'edit' ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    mode === 'edit' ? 'Update Position' : 'Create Position'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

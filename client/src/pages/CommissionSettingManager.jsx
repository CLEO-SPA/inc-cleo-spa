import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, Edit3, AlertCircle, CheckCircle2 } from 'lucide-react';

import useCommissionSettingsStore from '@/stores/useCommissionSettingsStore';

const CommissionSettingsManager = () => {
  const {
    // Data
    settings,
    
    // States  
    loading,
    saving,
    isEditing,
    success,
    error,
    errorMessage,
    hasChanges,
    validationErrors,
    
    // Actions
    fetchCommissionSettings,
    updateCommissionSettings,
    updateSetting,
    startEditing,
    cancelEditing,
    clearError
  } = useCommissionSettingsStore();

  // Load settings on component mount
  useEffect(() => {
    fetchCommissionSettings();
  }, [fetchCommissionSettings]);

  // Commission types configuration - simplified
  const commissionTypes = [
    { 
      key: 'service', 
      label: 'Service Commission', 
      description: 'Commission rate for individual service transactions'
    },
    { 
      key: 'product', 
      label: 'Product Commission', 
      description: 'Commission rate for product sales'
    },
    { 
      key: 'package', 
      label: 'Package Purchase', 
      description: 'Commission rate for care package purchases'
    },
    { 
      key: 'member-voucher', 
      label: 'Voucher Purchase', 
      description: 'Commission rate for voucher purchases'
    },
    { 
      key: 'mcpConsumption', 
      label: 'Package Consumption', 
      description: 'Commission rate for care package usage'
    },
    { 
      key: 'mvConsumption', 
      label: 'Voucher Consumption', 
      description: 'Commission rate for voucher usage'
    }
  ];

  const handleSave = async () => {
    clearError();
    await updateCommissionSettings();
  };

  const handleCancel = () => {
    clearError();
    cancelEditing();
  };

  const handleInputChange = (key, value) => {
    clearError();
    updateSetting(key, value);
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading commission settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Settings</h1>
          <p className="text-gray-600 mt-1">Manage commission rates for different transaction types</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {!isEditing ? (
            <Button onClick={startEditing} className="flex items-center space-x-2">
              <Edit3 className="h-4 w-4" />
              <span>Edit Settings</span>
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving || !hasChanges}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Commission settings updated successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage || 'An error occurred while processing your request.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Changes Indicator */}
      {isEditing && hasChanges && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            You have unsaved changes. Don't forget to save!
          </AlertDescription>
        </Alert>
      )}

      {/* Commission Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {commissionTypes.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <Label className="text-base font-medium text-gray-900">{label}</Label>
                <p className="text-sm text-gray-600 mt-1">{description}</p>
                {validationErrors[key] && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors[key]}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-3 min-w-[120px]">
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={settings[key] || '0.00'}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    disabled={!isEditing}
                    className={`w-24 text-right ${validationErrors[key] ? 'border-red-300' : ''}`}
                    placeholder="0.00"
                  />
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Info Footer */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-gray-900">Important Notes</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Commission rates are percentages (0-100%)</li>
                <li>• Changes affect new transactions only</li>
                <li>• Existing records are not modified</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionSettingsManager;
// pages/ViewVoucherTemplatePage.jsx
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ArrowLeft, Loader2, Edit, Eye, Calendar, User, DollarSign, FileText, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '@/services/api';

const ViewVoucherTemplatePage = () => {
  // URL params
  const { id } = useParams();
  const navigate = useNavigate();

  // Local state
  const [templateData, setTemplateData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load template data
  const loadTemplate = useCallback(async () => {
    if (!id) {
      setError('No template ID provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get(`/voucher-template/${id}`);
      setTemplateData(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading template:', error);
      setError(error.response?.data?.message || 'Failed to load template');
      setIsLoading(false);
    }
  }, [id]);

  // Effects
  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  // Format currency helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Status badge variant
  const getStatusVariant = (status) => {
    switch (status) {
      case 'is_enabled':
        return 'default';
      case 'disabled':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className='[--header-height:calc(theme(spacing.14))]'>
        <SidebarProvider className='flex flex-col'>
          <SiteHeader />
          <div className='flex flex-1'>
            <AppSidebar />
            <SidebarInset>
              <div className="w-full max-w-none p-4">
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading template...</p>
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
  if (error) {
    return (
      <div className='[--header-height:calc(theme(spacing.14))]'>
        <SidebarProvider className='flex flex-col'>
          <SiteHeader />
          <div className='flex flex-1'>
            <AppSidebar />
            <SidebarInset>
              <div className="w-full max-w-none p-4">
                <div className="flex items-center gap-3 mb-6">
                  <Link to="/voucher-template">
                    <Button variant="ghost" size="sm" className="p-2">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      View Voucher Template
                    </h1>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800">{error}</p>
                  <Button
                    onClick={loadTemplate}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    Try Again
                  </Button>
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
            <div className="w-full max-w-none p-4">
              {/* Header Section */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Link to="/voucher-template">
                    <Button variant="ghost" size="sm" className="p-2">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      View Voucher Template
                    </h1>
                    <p className="text-sm text-gray-600">
                      {templateData?.voucher_template_name || 'Template Details'}
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Link to={`/voucher-template/edit/${id}`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Template
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="container mx-auto p-4 space-y-6">
                {/* Template Overview Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Template Information
                      </CardTitle>
                      <Badge variant={getStatusVariant(templateData?.status)}>
                        {templateData?.status === 'is_enabled' ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* First row of fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Template Name
                        </Label>
                        <div className="p-2 bg-gray-50 rounded-md border">
                          <p className="text-sm text-gray-900">
                            {templateData?.voucher_template_name || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Creation Date
                        </Label>
                        <div className="p-2 bg-gray-50 rounded-md border">
                          <p className="text-sm text-gray-900">
                            {formatDate(templateData?.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Status
                        </Label>
                        <div className="p-2 bg-gray-50 rounded-md border">
                          <Badge variant={getStatusVariant(templateData?.status)}>
                            {templateData?.status === 'is_enabled' ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Last Updated By
                        </Label>
                        <div className="p-2 bg-gray-50 rounded-md border">
                          <p className="text-sm text-gray-900">
                            {templateData?.last_updated_by || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Second row - Financial Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Starting Balance
                        </Label>
                        <div className="p-2 bg-blue-50 rounded-md border border-blue-200">
                          <p className="text-sm font-semibold text-blue-900">
                            {formatCurrency(templateData?.default_starting_balance)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Free of Charge Amount
                        </Label>
                        <div className="p-2 bg-green-50 rounded-md border border-green-200">
                          <p className="text-sm font-semibold text-green-900">
                            {formatCurrency(templateData?.default_free_of_charge)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Total Price
                        </Label>
                        <div className="p-2 bg-purple-50 rounded-md border border-purple-200">
                          <p className="text-sm font-semibold text-purple-900">
                            {formatCurrency(templateData?.default_total_price)}
                          </p>
                          <p className="text-xs text-purple-600 mt-1">
                            (Starting Balance - Free Charge)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Remarks Section */}
                    {templateData?.remarks && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Remarks
                        </Label>
                        <div className="p-3 bg-gray-50 rounded-md border">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {templateData.remarks}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Last Updated Information */}
                    {templateData?.updated_at && (
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Last updated: {formatDate(templateData.updated_at)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Services Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">
                      Template Services
                    </CardTitle>
                    <p className="text-xs text-gray-600">
                      Services associated with this voucher template
                    </p>
                  </CardHeader>
                  <CardContent>
                    {templateData?.details && templateData.details.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 font-medium text-gray-700">Service Name</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-700">Category</th>
                              <th className="text-right py-2 px-3 font-medium text-gray-700">Original Price</th>
                              <th className="text-right py-2 px-3 font-medium text-gray-700">Custom Price</th>
                              <th className="text-right py-2 px-3 font-medium text-gray-700">Discount </th>
                              <th className="text-right py-2 px-3 font-medium text-gray-700">Final Price</th>
                              <th className="text-center py-2 px-3 font-medium text-gray-700">Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {templateData.details.map((service, index) => (
                              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-3">
                                  <div className="font-medium text-gray-900">
                                    {service.service_name || 'N/A'}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-gray-600">
                                  {service.service_category_name || 'N/A'}
                                </td>
                                <td className="py-3 px-3 text-right text-gray-600">
                                  {formatCurrency(service.original_price)}
                                </td>
                                <td className="py-3 px-3 text-right font-medium text-blue-600">
                                  {formatCurrency(service.custom_price)}
                                </td>
                                <td className="py-3 px-3 text-right text-orange-600">
                                  {service.discount || 0}
                                </td>
                                <td className="py-3 px-3 text-right font-semibold text-green-600">
                                  {formatCurrency(service.final_price)}
                                </td>
                                <td className="py-3 px-3 text-center text-gray-600">
                                  {service.duration ? `${service.duration} min` : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Services Summary */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Total Services:</span>
                            <span className="font-medium">{templateData.details.length}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm mt-1">
                            
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-2">
                          <FileText className="h-8 w-8 mx-auto" />
                        </div>
                        <p className="text-gray-600">No services added to this template</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default ViewVoucherTemplatePage;
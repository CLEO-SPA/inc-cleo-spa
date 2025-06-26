import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import CreateCategoryInlineForm from '@/components/category/CreateCategoryInlineForm';
import CategoryTableEditable from '@/components/category/CategoryTableEditable';
import ReorderCategoryPanel from '@/components/category/ReorderCategoryPanel';

export default function ManageServiceCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReorderPanel, setShowReorderPanel] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/service/service-cat');
      if (response.status === 200) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch service categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-col p-6 gap-6'>
              <div className='flex items-center space-x-4'>
                <CreateCategoryInlineForm apiEndpoint='/service/create-service-cat' onCreate={fetchCategories} />
                <Button onClick={() => setShowReorderPanel((prev) => !prev)} className='rounded-xl'>
                  {showReorderPanel ? 'Back to List' : 'Reorder Categories'}
                </Button>
              </div>

              {showReorderPanel ? (
                <ReorderCategoryPanel categoryType='service' categories={categories} onSave={fetchCategories} />
              ) : (
                <CategoryTableEditable
                  title='Service Categories'
                  data={categories}
                  loading={loading}
                  onRefresh={fetchCategories}
                  categoryType='service'
                />
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

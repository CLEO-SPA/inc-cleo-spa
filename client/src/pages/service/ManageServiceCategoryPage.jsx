import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import CreateCategoryInlineForm from '@/components/category/CreateCategoryInlineForm';
import CategoryTableEditable from '@/components/category/CategoryTableEditable';
import ReorderCategoryPanel from '@/components/category/ReorderCategoryPanel';
import useAuth from '@/hooks/useAuth';

export default function ManageServiceCategoriesPage() {
  const [allCategories, setAllCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [showReorderPanel, setShowReorderPanel] = useState(false);

  // --- Role-based access ---
  const { user } = useAuth();
  const canCreate = user?.role === 'super_admin' || user?.role === 'data_admin';

  // Pagination + Search
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      if (searchQuery.trim() !== '') {
        params.append('search', searchQuery);
      }

      const response = await api.get(`/service/service-cat/page-filter?${params.toString()}`);
      if (response.status === 200) {
        setCategories(response.data.serviceCategories);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch service categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAllCategories = async () => {
    try {
      const response = await api.get('/service/service-cat');
      if (response.status === 200) {
        setAllCategories(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch all categories for reorder panel:', err);
    }
  };

  // Refetch on filter or page change
  useEffect(() => {
    fetchCategories();
  }, [searchQuery, currentPage, itemsPerPage]);

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-col p-6 gap-6'>
              {canCreate && (
              <div className='flex items-center space-x-4'>
                <CreateCategoryInlineForm apiEndpoint='/service/create-service-cat' onCreate={fetchCategories} />
                <Button
                 onClick={async () => {
                    if (!showReorderPanel) {
                      setReorderLoading(true);
                      setShowReorderPanel(true); 
                      await getAllCategories();
                      setReorderLoading(false);
                    } else {
                      setShowReorderPanel(false);
                    }
                  }}
                  className='rounded-xl'
                >
                  {showReorderPanel ? 'Back to List' : 'Reorder Categories'}
                </Button>
              </div>
              )}

              {showReorderPanel ? (
                reorderLoading ? (
                  <div className="text-center text-gray-600">Loading categories for reorder...</div>
                ) : (
                  <ReorderCategoryPanel categoryType='service' categories={allCategories} onSave={fetchCategories} />
                )
              ) : (
                <CategoryTableEditable
                  title='Service Categories'
                  data={categories}
                  loading={loading}
                  onRefresh={fetchCategories}
                  categoryType='service'
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  itemsPerPage={itemsPerPage}
                  setItemsPerPage={setItemsPerPage}
                />
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

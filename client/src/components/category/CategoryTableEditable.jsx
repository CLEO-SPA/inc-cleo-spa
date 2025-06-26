import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FilePenLine, Check, X, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import api from '@/services/api';
import useAuth from '@/hooks/useAuth';

export default function CategoryTableEditable({ 
  data = [],
  loading = false,
  onRefresh,
  categoryType = 'service',
  currentPage,
  totalPages,
  onPageChange,
  searchQuery,
  setSearchQuery,
  itemsPerPage,
  setItemsPerPage
 }) {
  const inputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState('');

  // --- Role-based access ---
  const { user } = useAuth();
  const canEdit = user?.role === 'super_admin' || user?.role === 'data_admin';


  const startEditing = (cat) => {
    setEditingId(cat.id);
    setEditedName(cat.service_category_name || cat.product_category_name);
  };

  useEffect(() => {
    if (editingId !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  const cancelEditing = () => {
    setEditingId(null);
    setEditedName('');
  };

  const saveEditing = async (id) => {
    const trimmedName = editedName.trim();
    if (!trimmedName) return;

    setSaving(true);
    setSaveError(''); // reset error state
    try {
      await api.put(`/${categoryType}/update-${categoryType}-cat/${id}`, { name: trimmedName });
      setEditingId(null);
      setEditedName('');
      onRefresh();
    } catch (err) {
      console.error('Update failed:', err);
      const message = err?.response?.data?.message || 'Something went wrong while updating.';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='rounded-xl bg-muted/50 p-4 shadow-md overflow-x-auto'>
      <h2 className='text-2xl font-bold mb-4'>Categories</h2>

      {/* Search */}
      <div className='flex flex-wrap items-center justify-between mb-4'>
        <div className='flex items-center space-x-2'>
          <Input
            type='text'
            placeholder='Search categories...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onPageChange(1);
              }
            }}
            className='w-[250px]'
          />
        </div>
      </div>

      {/* Table */}
      <table className='table-auto w-full border-collapse border border-gray-300 text-left'>
        <thead className='bg-black text-white'>
          <tr>
            <th className='px-4 py-2 border border-gray-300'>ID</th>
            <th className='px-4 py-2 border border-gray-300'>Name</th>
            <th className='px-4 py-2 border border-gray-300'># of Items</th>
            {canEdit && (
            <th className='px-4 py-2 border border-gray-300'>Actions</th>
            )}
            </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan='4' className='text-center py-4 text-gray-500'>
                Loading categories...
              </td>
            </tr>
          ) : data.length > 0 ? (
            data.map((cat) => (
              <tr key={cat.id} className='bg-white hover:bg-gray-100'>
                <td className='px-4 py-2 border border-gray-300'>{cat.id}</td>
                <td className='px-4 py-2 border border-gray-300'>
                  {editingId === cat.id ? (
                    <div className='flex flex-col'>
                      <Input
                        ref={inputRef}
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className='w-60'
                      />
                      {saveError && <p className='text-red-500 text-sm mt-1'>{saveError}</p>}
                    </div>
                  ) : (
                    cat.service_category_name || cat.product_category_name
                  )}
                </td>
                <td className='px-4 py-2 border border-gray-300'>{cat.total_services || cat.total_products || 0}</td>
                {canEdit && (
                <td className='px-4 py-2 border border-gray-300 space-x-2'>
                  {editingId === cat.id ? (
                    <>
                      <Button
                        className='p-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                        onClick={() => saveEditing(cat.id)}
                        disabled={!editedName.trim() || saving}
                      >
                        <Check className='inline-block mr-1' size={16} />
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        className='p-1 text-sm bg-gray-400 text-white rounded-lg hover:bg-gray-500'
                        onClick={cancelEditing}
                      >
                        <X className='inline-block mr-1' size={16} />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      className='p-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700'
                      onClick={() => startEditing(cat)}
                    >
                      <FilePenLine className='inline-block mr-1' size={16} />
                      Update
                    </Button>
                  )}
                </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan='4' className='text-center py-4 text-gray-500'>
                No categories found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-2 space-x-4 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <label htmlFor="itemsPerPage" className="text-sm">Items per page:</label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              onPageChange(1);
            }}
            className="border rounded p-1"
          >
            {[5, 10, 20, 50, 100].map((num) => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => onPageChange(1)}
            >
              <ChevronsLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft />
            </Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(totalPages)}
            >
              <ChevronsRight />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

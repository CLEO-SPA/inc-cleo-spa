import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import {
  FilePenLine,
  Check,
  X,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react';
import api from '@/services/api';
import useAuth from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

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
  setItemsPerPage,
}) {
  const inputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState('');
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
    setSaveError('');
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
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Input
          type='text'
          placeholder='Search categories...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onPageChange(1);
          }}
          className='w-[250px]'
        />

        <div className='rounded-md border overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='px-4 py-2'>ID</TableHead>
                <TableHead className='px-4 py-2'>Name</TableHead>
                <TableHead className='px-4 py-2'># of Items</TableHead>
                {canEdit && <TableHead className='px-4 py-2 text-right'>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan='4' className='text-center py-4 text-gray-500'>Loading categories...</TableCell>
                </TableRow>
              ) : data.length > 0 ? (
                data.map((cat) => (
                  <TableRow key={cat.id} className='bg-white hover:bg-gray-50'>
                    <TableCell className='px-4 py-2'>{cat.id}</TableCell>
                    <TableCell className='px-4 py-2'>
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
                    </TableCell>
                    <TableCell className='px-4 py-2'>{cat.total_services || cat.total_products || 0}</TableCell>
                    {canEdit && (
                      <TableCell className='px-4 py-2 text-right'>
                        {editingId === cat.id ? (
                          <div className='space-x-2'>
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
                          </div>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' className='h-8 w-8 p-0'>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem onClick={() => startEditing(cat)}>
                                <FilePenLine className='mr-2 h-4 w-4' />
                                Update
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan='4' className='text-center py-4 text-gray-500'>No categories found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className='flex justify-between flex-wrap gap-4'>
        <div className='flex items-center space-x-2'>
          <label htmlFor='itemsPerPage' className='text-sm'>Items per page:</label>
          <select
            id='itemsPerPage'
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              onPageChange(1);
            }}
            className='border rounded p-1'
          >
            {[5, 10, 20, 50, 100].map((num) => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        {totalPages > 1 && (
          <div className='flex items-center space-x-2'>
            <Button variant='outline' size='icon' disabled={currentPage === 1} onClick={() => onPageChange(1)}>
              <ChevronsLeft />
            </Button>
            <Button variant='outline' size='icon' disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
              <ChevronLeft />
            </Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button variant='outline' size='icon' disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
              <ChevronRight />
            </Button>
            <Button variant='outline' size='icon' disabled={currentPage === totalPages} onClick={() => onPageChange(totalPages)}>
              <ChevronsRight />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
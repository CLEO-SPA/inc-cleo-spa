import React from 'react';
import { Button } from '@/components/ui/button';
import { FilePenLine } from 'lucide-react';

export default function CategoryTable({ data = [], onUpdate, loading = false }) {
  return (
    <div className='rounded-xl bg-muted/50 p-4 shadow-md overflow-x-auto'>
      <h2 className='text-2xl font-bold mb-4'>Categories</h2>
      <table className='table-auto w-full border-collapse border border-gray-300 text-left'>
        <thead className='bg-black text-white'>
          <tr>
            <th className='px-4 py-2 border border-gray-300'>ID</th>
            <th className='px-4 py-2 border border-gray-300'>Name</th>
            <th className='px-4 py-2 border border-gray-300'># of Items</th>
            <th className='px-4 py-2 border border-gray-300'>Actions</th>
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
                  {cat.service_category_name || cat.product_category_name}
                </td>
                <td className='px-4 py-2 border border-gray-300'>{cat.total_services || cat.total_products || 0}</td>
                <td className='px-4 py-2 border border-gray-300'>
                  <Button
                    className='p-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700'
                    onClick={() => onUpdate(cat.id)}
                  >
                    <FilePenLine className='inline-block mr-1' size={16} />
                    Update
                  </Button>
                </td>
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
    </div>
  );
}

import React, { useState } from 'react';
import { GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/services/api';

export default function ReorderCategoryPanel({ categories = [], onSave, categoryType = 'service' }) {
  const [items, setItems] = useState([...categories]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleDragStart = (e, index) => {
    setDraggedItem(items[index]);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (!draggedItem) return;

    const draggedOverItem = items[index];
    if (draggedOverItem === draggedItem) return;

    const reordered = items.filter(item => item !== draggedItem);
    reordered.splice(index, 0, draggedItem);

    setItems(reordered);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSave = async () => {
    const updatedItems = items.map((item, index) => ({
      ...item,
      [`${categoryType}_category_sequence_no`]: index + 1,
    }));
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await api.put(`/${categoryType}/reorder-${categoryType}-cat`, updatedItems);
      if (response.status === 200) {
        setSuccessMsg('Changes saved successfully!');
        onSave?.();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='p-4 bg-muted/50 rounded-xl flex flex-col gap-4'>
      {errorMsg && <div className='text-red-600'>{errorMsg}</div>}
      {successMsg && <div className='text-green-600'>{successMsg}</div>}

      <div className='flex flex-col gap-2'>
        {items.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className='flex items-center gap-3 p-2 bg-white border rounded cursor-move hover:bg-gray-50'
          >
            <span className='text-sm text-gray-500'>#{index + 1}</span>
            <span className='text-sm'>{item[`${categoryType}_category_name`]}</span>
            <GripVertical className='ml-auto text-gray-400' size={16} />
          </div>
        ))}
      </div>

      <div className='pt-4 border-t border-gray-200 flex justify-end space-x-2'>
        <Button onClick={() => setItems(categories)} variant='outline'>
          Reset
        </Button>
        <Button onClick={handleSave} disabled={saving} className='bg-blue-600 hover:bg-blue-500'>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

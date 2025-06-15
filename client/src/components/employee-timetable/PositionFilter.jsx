// client/src/components/employee-timetable/PositionFilter.jsx
import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import useEmployeeTimetableStore from '@/stores/useEmployeeTimetableStore';

export default function PositionFilter() {
  const {
    positions,
    selectedPosition,
    setSelectedPosition,
    loadTimetableData,
    currentMonth,
    loading
  } = useEmployeeTimetableStore();

  const handlePositionChange = async (value) => {
    if (value === 'all') {
      setSelectedPosition(null);
    } else {
      const position = positions.find(p => p.position_id.toString() === value);
      setSelectedPosition(position);
    }
    
    // Reload timetable data with new filter
    await loadTimetableData(currentMonth);
  };

  return (
    <div className="min-w-[200px]">
      <Label htmlFor="position-filter" className="text-sm font-medium mb-2 block">
        Position Dropdown
      </Label>
      
      <Select
        value={selectedPosition ? selectedPosition.position_id.toString() : 'all'}
        onValueChange={handlePositionChange}
        disabled={loading.positions}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select position..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Positions</SelectItem>
          {positions.map((position) => (
            <SelectItem 
              key={position.id} 
              value={position.id.toString()}
            >
              {position.position_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
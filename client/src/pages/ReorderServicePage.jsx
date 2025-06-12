import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { GripVertical } from "lucide-react";
import { AppSidebar } from '@/components/app-sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function ReorderService() {
  // For categories
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('0');

  // Services associated with selected category
  const [services, setServices] = useState([]);

  const [draggedItem, setDraggedItem] = useState(null);

  const navigate = useNavigate();

  // Drag handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(services[index]);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (!draggedItem) return;

    const draggedOverItem = services[index];
    if (draggedOverItem === draggedItem) return;

    const items = services.filter(item => item !== draggedItem);
    items.splice(index, 0, draggedItem);

    setServices(items);
  };

  const handleDragEnd = async () => {
    const updatedServices = services.map((service, index) => ({
      ...service,
      service_sequence_no: index + 1
    }));

    setServices(updatedServices);
    setDraggedItem(null);

    try {
      // update order api
    } catch (error) {
      console.error('Error updating service order:', error);
      // fetch updated service sequence
    }
  };

  // get Categories
  const getCategories = async () => {
    try {
      const response = await api.get('/service/service-cat');
      if (response.status === 200) {
        setCategories(response.data);
      } else {
        console.error('Failed to fetch service categories:', response.statusText);
      }
    } catch (err) {
      console.error('Error fetching service categories:', err);
    }
  }

  const getServices = async (category_id) => {
    try {
      const response = await api.get(`/service/all-by-cat/${category_id}`);
      if (response.status === 200) {
        setServices(response.data);
      } else {
        console.error('Failed to fetch service:', response.statusText);
      }
    } catch (err) {
      console.error('Error fetching service:', err);
    }
  }

  useEffect(() => {
    try {
      getCategories();
    } catch (err) {
      console.error('Error fetching categories:' + err);
    }
  }, [])

  useEffect(() => {
    try {
      getServices(selectedCategory);
    } catch (err) {
      console.error('Error fetching services:' + err);
    }
  }, [selectedCategory])

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              {/* Select row */}
              <div className="flex space-x-4 p-4 bg-gray-100 rounded-lg">
                {/* Back button */}
                <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl">
                  Back
                </Button>
                {/* Select Category */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0" selected>Select a Category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.service_category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Services list container - grows to fill available space */}
              <div className="flex-1 rounded-xl bg-muted/50 p-4 flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  {selectedCategory === '0' ? (
                    <div className="flex text-xl text-gray-500 justify-center items-center gap-3 p-2 bg-white border rounded">
                      Please Select a Category
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {services.map((service, serviceIndex) => (
                        <div
                          key={service.service_id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, serviceIndex)}
                          onDragOver={(e) => handleDragOver(e, serviceIndex)}
                          onDragEnd={handleDragEnd}
                          className="flex items-center gap-3 p-2 bg-white border rounded cursor-move hover:bg-gray-50"
                        >
                          <GripVertical className="text-gray-400" size={16} />
                          <span className="text-sm">{service.service_name}</span>
                          <span className="ml-auto text-sm text-gray-500">
                            #{service.service_sequence_no}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save button - positioned at bottom, only shown when category is selected */}
                {selectedCategory !== '0' && (
                  <div className="mt-4 ml-auto pt-4 border-t border-gray-200">
                    <Button className="bg-blue-600 rounded-md hover:bg-blue-500">
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider >
    </div >
  );
}

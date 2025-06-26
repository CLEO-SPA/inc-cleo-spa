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
import { useAuth } from '@/context/AuthContext';

export default function ReorderService() {
  //Role-based access
    const { user } = useAuth();
    const allowedRoles = ['super_admin', 'data_admin'];
  
  // loading
  const [loading, setLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(false);
  // For modal
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // For categories
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('0');

  // Services associated with selected category
  const [services, setServices] = useState([]);

  const navigate = useNavigate();

  // For dragging
  const [draggedItem, setDraggedItem] = useState(null);
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
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // update order api
      const response = await api.put(`/service/reorder-service`, services, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (response.status === 200) {
        getServices(selectedCategory);
        setErrorMsg("");
      }
    } catch (err) {
      console.error('Error updating service order:', err);
      setErrorMsg(err.response.data.message);

    } finally {
      setLoading(false);
      setModalOpen(true);
    }
  }

  // get Categories
  const getCategories = async () => {
    setCatLoading(true);
    try {
      const response = await api.get(`/service/service-cat`);
      if (response.status === 200) {
        setCategories(response.data);
      } else {
        console.error('Failed to fetch service categories:', response.statusText);
      }
    } catch (err) {
      console.error('Error fetching service categories:', err);
    } finally {
      setCatLoading(false);
    }
  }

  // get services in the category
  const getServices = async (category_id) => {
    setLoading(true);
    try {
      const response = await api.get(`/service/all-by-cat/${category_id}`);
      if (response.status === 200) {
        setServices(response.data);
      } else {
        console.error('Failed to fetch service:', response.statusText);
      }
    } catch (err) {
      console.error('Error fetching service:', err);
    } finally {
      setLoading(false);
    }
  }

  // upon page load
  useEffect(() => {
    try {
      getCategories();
    } catch (err) {
      console.error('Error fetching categories:' + err);
    }
  }, [])

  useEffect(() => {
      if (!user || !allowedRoles.includes(user.role)) {
        navigate('*'); 
      }
    }, [user, navigate]);

  // upon category being selected
  useEffect(() => {
    try {
      getServices(selectedCategory);
    } catch (err) {
      console.error('Error fetching services:' + err);
    }
  }, [selectedCategory])

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      {/* modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-opacity-80 z-50">
          <div className="bg-white border p-6 rounded-md shadow-lg w-full max-w-lg">
            <div className="flex justify-between items-center">
              {errorMsg ? (
                <h3 className="text-xl font-semibold">Error</h3>
              ) :
                (
                  <h3 className="text-xl font-semibold">Reorder Service Page</h3>
                )}
              <button
                onClick={() => { setModalOpen(false) }}
                className="text-xl"
                aria-label="Close"
              >
                X
              </button>
            </div>
            <div className="mt-4">
              {errorMsg ? (
                <p className="text-xl text-red-500">{errorMsg}</p>
              ) : (
                <p className="text-xl text-green-600">Changes were saved!</p>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              {errorMsg ? "" : (
                <Button
                  onClick={() => navigate('/manage-service')}
                  className="bg-blue-600 rounded-md hover:bg-blue-500"
                >
                  View Services
                </Button>
              )}
              <Button
                onClick={() => { setModalOpen(false); }}
                className="text-white py-2 px-4 rounded-md hover:bg-gray-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              {/* Select row */}
              <div className="flex space-x-4 p-4 bg-muted/50 rounded-lg">
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
                    <div className="max-h-60 overflow-y-auto">
                      <SelectItem value="0" selected>{catLoading ? ("Loading...") : ("Select a Category")}</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.service_category_name}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>

              {/* Services list container - grows to fill available space */}
              <div className="p-4 h-[75vh] flex flex-col rounded-xl bg-muted/50">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <span className="text-xl text-gray-500">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto">

                      {selectedCategory === '0' ? (
                        <div className="flex justify-center text-xl text-gray-500 items-center gap-3 p-2 bg-white border rounded">
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
                              <span className="text-sm text-gray-500">
                                #{service.service_sequence_no}
                              </span>
                              <span className="text-sm">{service.service_name}</span>
                              <GripVertical className="ml-auto text-gray-400" size={16} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Save button - positioned at bottom, only shown when category is selected */}
                    {selectedCategory !== '0' && (
                      <div className="mt-4 ml-auto pt-4 border-t border-gray-200 space-x-4">
                        <Button onClick={() => getServices(selectedCategory)} className="rounded-md">
                          Reset Order
                        </Button>
                        <Button onClick={handleSave} className="bg-blue-600 rounded-md hover:bg-blue-500">
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>
          </SidebarInset>
        </div>
      </SidebarProvider >
    </div >
  );
}

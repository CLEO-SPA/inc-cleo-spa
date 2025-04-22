import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/interceptors/axios';
import { ChevronLeft, GripVertical } from 'lucide-react';

const ServiceSequence = () => {
  const [data, setData] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedService, setDraggedService] = useState(null);
  const [dragLevel, setDragLevel] = useState(null); // 'category' or 'service'

  // useEffect(() => {
  //   fetchData();
  // }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      let raw_data = [];
      const response = await api.get('/service/getSerCat');
      const categories = response.data;
      for (const category of categories) {
        const id = category.service_category_id;
        const serviceResponse = await api.get(`/service/getAllSerC/${id}`);
        const services = serviceResponse.data;
        const data = { ...category, services: services };
        raw_data.push(data);
      }
      setData(raw_data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Category drag handlers
  const handleCategoryDragStart = (e, index) => {
    setDraggedItem(data[index]);
    setDragLevel('category');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDragOver = (e, index) => {
    e.preventDefault();
    if (!draggedItem || dragLevel !== 'category') return;

    const draggedOverItem = data[index];
    if (draggedOverItem === draggedItem) return;

    const items = data.filter((item) => item !== draggedItem);
    items.splice(index, 0, draggedItem);

    setData(items);
  };

  const handleCategoryDragEnd = async () => {
    if (dragLevel !== 'category') return;

    const updatedCategories = data.map((category, index) => ({
      ...category,
      service_category_sequence_no: index + 1,
    }));

    setData(updatedCategories);
    setDraggedItem(null);
    setDragLevel(null);

    try {
      await api.put('/service/updateSerCatSeq', {
        categories: updatedCategories.map((cat) => ({
          service_category_id: cat.service_category_id,
          service_category_sequence_no: cat.service_category_sequence_no,
        })),
      });
    } catch (error) {
      console.error('Error updating category order:', error);
      fetchData();
    }
  };

  // Service drag handlers
  const handleServiceDragStart = (e, categoryIndex, serviceIndex) => {
    e.stopPropagation(); // Prevents the category drag from also triggering
    setDraggedService({
      service: data[categoryIndex].services[serviceIndex], // Store the service being dragged
      fromCategoryId: data[categoryIndex].service_category_id, // Remember its original category
    });
    setDragLevel('service'); // Tell the app we're dragging a service, not a category
    e.dataTransfer.effectAllowed = 'move'; // Set cursor to move style
  };

  const handleServiceDragOver = (e, categoryIndex, serviceIndex) => {
    e.preventDefault(); // Required for drag and drop to work
    e.stopPropagation(); // Prevents category drag events
    if (!draggedService || dragLevel !== 'service') return; // Exit if not dragging a service

    // Only allow reordering within the same category
    if (draggedService.fromCategoryId !== data[categoryIndex].service_category_id) {
      return; // Exit if trying to drag to a different category
    }

    const newCategories = [...data]; // Create copy of all categories
    const currentCategory = newCategories[categoryIndex];
    //  // Get current category
    // const draggedOverService = currentCategory.services[serviceIndex];  // Get service being dragged over

    // Remove dragged service from list
    currentCategory.services = currentCategory.services.filter((s) => s !== draggedService.service);

    // Add to new position
    // const serviceIndex2 = currentCategory.services.indexOf(draggedOverService);
    // currentCategory.services.splice(serviceIndex2, 0, draggedService.service);

    currentCategory.services.splice(serviceIndex, 0, draggedService.service);
    setData(newCategories);
  };

  const handleServiceDragEnd = async () => {
    if (dragLevel !== 'service') return;

    // Update sequence numbers for all services
    const updatedCategories = data.map((category) => ({
      ...category,
      services: category.services.map((service, index) => ({
        ...service,
        service_sequence_no: index + 1,
      })),
    }));

    setData(updatedCategories);
    setDraggedService(null);
    setDragLevel(null);
    try {
      const allServices = updatedCategories.flatMap((cat) => cat.services);
      await api.put('/service/updateSerSeq', {
        services: allServices.map((service) => ({
          service_id: service.service_id,
          service_sequence_no: service.service_sequence_no,
          service_category_id: service.service_category_id,
        })),
      });
    } catch (error) {
      console.error('Error updating service order:', error);
      fetchData();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4" onDragOver={(e) => e.preventDefault()}>
      <a href="/sm" className="inline-flex items-center mb-4 hover:text-blue-700">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back
      </a>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Reorder Categories and Services</h2>
      </div>

      <div className="space-y-4">
        {data.map((category, categoryIndex) => (
          <div key={category.service_category_id} className="border rounded-lg bg-gray-50 p-4">
            <div
              draggable
              onDragStart={(e) => handleCategoryDragStart(e, categoryIndex)}
              onDragOver={(e) => handleCategoryDragOver(e, categoryIndex)}
              onDragEnd={handleCategoryDragEnd}
              className="flex items-center gap-3 p-2 bg-white border rounded mb-3 cursor-move hover:bg-gray-50"
            >
              <GripVertical className="text-gray-400" size={20} />
              <span className="font-medium">{category.service_category_name}</span>
              <span className="ml-auto text-sm text-gray-500">#{category.service_category_sequence_no}</span>
            </div>

            {category.services ? (
              <div className="pl-4 space-y-2">
                {category.services.map((service, serviceIndex) => (
                  <div
                    key={service.service_id}
                    draggable
                    onDragStart={(e) => handleServiceDragStart(e, categoryIndex, serviceIndex)}
                    onDragOver={(e) => handleServiceDragOver(e, categoryIndex, serviceIndex)}
                    onDragEnd={handleServiceDragEnd}
                    className="flex items-center gap-3 p-2 bg-white border rounded cursor-move hover:bg-gray-50"
                  >
                    <GripVertical className="text-gray-400" size={16} />
                    <span className="text-sm">{service.service_name}</span>
                    <span className="ml-auto text-sm text-gray-500">#{service.service_sequence_no}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pl-4 space-y-2">No Services Available in this Category</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceSequence;

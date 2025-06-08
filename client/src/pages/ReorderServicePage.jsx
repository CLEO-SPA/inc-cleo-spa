import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

export default function ManageService() {
  // For select categories
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

  useEffect(() => {
    // Test data
    try {
      setServices([
        {
          "service_id": "1",
          "service_name": "Face Treatment A1",
          "service_description": "Premium facial treatment",
          "service_remarks": "Signature facial treatment",
          "service_estimated_duration": "60",
          "service_default_price": "100",
          "service_is_enabled": true,
          "service_created_at": "02/05/2024, 19:00:00",
          "service_updated_at": "02/05/2024, 19:00:00",
          "service_category_id": "1",
          "service_sequence_no": 1,
          "cs_service_categories": {
            "service_category_name": "Facial Treatments"
          },
          "service_category_name": "Facial Treatments"
        },
        {
          "service_id": "3",
          "service_name": "Deep Cleansing Facial",
          "service_description": "A thorough facial treatment that removes dirt, oil, and impurities from the skin while unclogging pores.",
          "service_remarks": "Ideal for acne-prone and oily skin.",
          "service_estimated_duration": "60",
          "service_default_price": "80",
          "service_is_enabled": false,
          "service_created_at": "12/02/2025, 14:20:40",
          "service_updated_at": "12/02/2025, 14:20:40",
          "service_category_id": "1",
          "service_sequence_no": 2,
          "cs_service_categories": {
            "service_category_name": "Facial Treatments"
          },
          "service_category_name": "Facial Treatments"
        },
        {
          "service_id": "4",
          "service_name": "Hydrating Facial",
          "service_description": "A moisturizing facial that deeply hydrates the skin, leaving it soft and glowing.",
          "service_remarks": "Suitable for dry and sensitive skin.",
          "service_estimated_duration": "45",
          "service_default_price": "95",
          "service_is_enabled": true,
          "service_created_at": "12/02/2025, 15:28:48",
          "service_updated_at": "12/02/2025, 15:28:48",
          "service_category_id": "1",
          "service_sequence_no": 3,
          "cs_service_categories": {
            "service_category_name": "Facial Treatments"
          },
          "service_category_name": "Facial Treatments"
        },
        {
          "service_id": "38",
          "service_name": "Anti-Aging Facial",
          "service_description": "A rejuvenating treatment that helps reduce fine lines, wrinkles, and improves skin elasticity.",
          "service_remarks": "Uses collagen-boosting serums and LED therapy.",
          "service_estimated_duration": "75",
          "service_default_price": "119",
          "service_is_enabled": true,
          "service_created_at": "14/02/2025, 19:50:08",
          "service_updated_at": "14/02/2025, 19:50:08",
          "service_category_id": "1",
          "service_sequence_no": 4,
          "cs_service_categories": {
            "service_category_name": "Facial Treatments"
          },
          "service_category_name": "Facial Treatments"
        },
        {
          "service_id": "42",
          "service_name": "Gold Facial",
          "service_description": "A luxurious facial using gold-infused skincare products to enhance skin radiance and firmness.",
          "service_remarks": "Includes a gold mask for extra glow",
          "service_estimated_duration": "60",
          "service_default_price": "100",
          "service_is_enabled": true,
          "service_created_at": "01/02/2025, 00:00:00",
          "service_updated_at": "18/02/2025, 14:34:21",
          "service_category_id": "1",
          "service_sequence_no": 10,
          "cs_service_categories": {
            "service_category_name": "Facial Treatments"
          },
          "service_category_name": "Facial Treatments"
        },
        {
          "service_id": "45",
          "service_name": "A1 Basic Facial",
          "service_description": "Basic",
          "service_remarks": "Good",
          "service_estimated_duration": "58",
          "service_default_price": "110",
          "service_is_enabled": true,
          "service_created_at": "01/02/2025, 16:26:00",
          "service_updated_at": "20/02/2025, 16:21:13",
          "service_category_id": "1",
          "service_sequence_no": 13,
          "cs_service_categories": {
            "service_category_name": "Facial Treatments"
          },
          "service_category_name": "Facial Treatments"
        },
        {
          "service_id": "46",
          "service_name": "REFRESHING FACIAL TREATMENT",
          "service_description": "NIL",
          "service_remarks": "NIL",
          "service_estimated_duration": "0",
          "service_default_price": "78",
          "service_is_enabled": false,
          "service_created_at": "01/12/2023, 14:09:00",
          "service_updated_at": "16/04/2025, 14:12:17",
          "service_category_id": "1",
          "service_sequence_no": 14,
          "cs_service_categories": {
            "service_category_name": "Facial Treatments"
          },
          "service_category_name": "Facial Treatments"
        },
        {
          "service_id": "49",
          "service_name": "REFRESHING FACIAL TREATMENT",
          "service_description": "NIL",
          "service_remarks": "NIL",
          "service_estimated_duration": "0",
          "service_default_price": "78",
          "service_is_enabled": false,
          "service_created_at": "01/12/2023, 14:09:00",
          "service_updated_at": "16/04/2025, 14:12:17",
          "service_category_id": "1",
          "service_sequence_no": 14,
          "cs_service_categories": {
            "service_category_name": "Facial Treatments"
          },
          "service_category_name": "Facial Treatments"
        },
        {
          "service_id": "48",
          "service_name": "REFRESHING FACIAL TREATMENT",
          "service_description": "NIL",
          "service_remarks": "NIL",
          "service_estimated_duration": "0",
          "service_default_price": "78",
          "service_is_enabled": false,
          "service_created_at": "01/12/2023, 14:09:00",
          "service_updated_at": "16/04/2025, 14:12:17",
          "service_category_id": "1",
          "service_sequence_no": 14,
          "cs_service_categories": {
            "service_category_name": "Facial Treatments"
          },
          "service_category_name": "Facial Treatments"
        },
        {
          "service_id": "47",
          "service_name": "REFRESHING FACIAL TREATMENT",
          "service_description": "NIL",
          "service_remarks": "NIL",
          "service_estimated_duration": "0",
          "service_default_price": "78",
          "service_is_enabled": false,
          "service_created_at": "01/12/2023, 14:09:00",
          "service_updated_at": "16/04/2025, 14:12:18",
          "service_category_id": "1",
          "service_sequence_no": 15,
          "cs_service_categories": {
            "service_category_name": "Facial Treatments"
          },
          "service_category_name": "Facial Treatments"
        }
      ])
    } catch (err) {
      console.error('Error fetching services:' + err);
    }
  }, [])
  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              {/* Filter */}
              <div class="flex space-x-4 p-4 bg-gray-100 rounded-lg">
                {/* Select Category */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0" selected>All Categories</SelectItem>
                    <SelectItem value="1">Face Care</SelectItem>
                  </SelectContent>
                </Select>

                {/* Search Button */}
                {/* <Button className="rounded-xl">Search</Button> */}
              </div>
              <div className="p-4 flex-1 rounded-xl bg-muted/50">
                <div className="overflow-y-auto max-h-[60vh]">
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
            </div>
        </div>
      </SidebarInset>
    </div>
      </SidebarProvider >
    </div >
  );
}

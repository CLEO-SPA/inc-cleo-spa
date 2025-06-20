import React, { useState, useEffect } from "react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SearchForm } from '@/components/search-form';
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
  const [services, setServices] = useState([]);
  // const [categories, setCategories] = useState([]);

  // For select categories
  const [selectedCategory, setSelectedCategory] = useState('0');

  // For select status
  const [selectedStatus, setSelectedStatus] = useState('0');
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
          "service_is_active": true,
          "service_created_at": "02/05/2024, 19:00:00",
          "service_updated_at": "02/05/2024, 19:00:00",
          "service_outlet_id": "1",
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
          "service_is_active": false,
          "service_created_at": "12/02/2025, 14:20:40",
          "service_updated_at": "12/02/2025, 14:20:40",
          "service_outlet_id": "1",
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
          "service_is_active": true,
          "service_created_at": "12/02/2025, 15:28:48",
          "service_updated_at": "12/02/2025, 15:28:48",
          "service_outlet_id": "1",
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
          "service_is_active": true,
          "service_created_at": "14/02/2025, 19:50:08",
          "service_updated_at": "14/02/2025, 19:50:08",
          "service_outlet_id": "1",
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
          "service_is_active": true,
          "service_created_at": "01/02/2025, 00:00:00",
          "service_updated_at": "18/02/2025, 14:34:21",
          "service_outlet_id": "1",
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
          "service_is_active": true,
          "service_created_at": "01/02/2025, 16:26:00",
          "service_updated_at": "20/02/2025, 16:21:13",
          "service_outlet_id": "1",
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
          "service_is_active": false,
          "service_created_at": "01/12/2023, 14:09:00",
          "service_updated_at": "16/04/2025, 14:12:17",
          "service_outlet_id": "1",
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
          "service_is_active": false,
          "service_created_at": "01/12/2023, 14:09:00",
          "service_updated_at": "16/04/2025, 14:12:17",
          "service_outlet_id": "1",
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
          "service_is_active": false,
          "service_created_at": "01/12/2023, 14:09:00",
          "service_updated_at": "16/04/2025, 14:12:17",
          "service_outlet_id": "1",
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
          "service_is_active": false,
          "service_created_at": "01/12/2023, 14:09:00",
          "service_updated_at": "16/04/2025, 14:12:18",
          "service_outlet_id": "1",
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
          {/* <AppSidebar /> */}
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              <div class="flex space-x-4 p-4 bg-gray-100 rounded-lg">
                <Button>Create Service</Button>
                <Button>Reorder Service</Button>
                <Button>View All Details</Button>
                <Button>Manage Categories</Button>
              </div>
              <div class="flex space-x-4 p-4 bg-gray-100 rounded-lg">
                <SearchForm className="flex" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0" selected>All Categories</SelectItem>
                    <SelectItem value="1">Face Care</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0" selected>All</SelectItem>
                    <SelectItem value="True">Enabled</SelectItem>
                    <SelectItem value="False">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                <Button>Search</Button>
              </div>
              <div className='min-h-[100vh] p-4 flex-1 rounded-xl bg-muted/50 md:min-h-min'>
                {/* Table */}
                <table className="w-full text-black border-collapse border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 py-2 text-left border border-gray-200 w-12">ID</th>
                      <th className="px-3 py-2 text-left border border-gray-200 w-20">Category</th>
                      <th className="px-3 py-2 text-left border border-gray-200 w-32">Name</th>
                      <th className="px-2 py-2 text-left border border-gray-200 w-16">Unit Price (SGD)</th>
                      <th className="px-2 py-2 text-left border border-gray-200 w-16">Duration (Mins)</th>
                      <th className="px-2 py-2 text-left border border-gray-200 w-12">Active</th>

                      <th className="px-4 py-2 text-left border border-gray-200 w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.length > 0 ? (
                      services.map((service, index) => (
                        <tr key={service.service_id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                          <td className="px-2 py-1 border border-gray-200">{service.service_id}</td>
                          <td className="px-2 py-1 border border-gray-200">{service.service_category_name}</td>
                  
                          <td className="px-3 py-1 border border-gray-200">{service.service_name}</td>
                          <td className="px-2 py-1 border border-gray-200">{service.service_default_price}</td>
                          <td className="px-2 py-1 border border-gray-200">{service.service_estimated_duration}</td>
                          <td className="px-2 py-1 border border-gray-200">
                            {/* <Badge bg={service.service_is_active ? "green.500" : "red.500"}>
                              {service.service_is_active ? "Active" : "Inactive"}
                            </Badge> */}
                          </td>

                          <td className="px-2 py-1 border border-gray-200">
                            <div className="flex flex-col space-y-1">
                              <Button className="px-2 py-1 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700">
                                Update
                              </Button>
                              <Button className="px-2 py-1 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                                View Sales History
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="13" className="px-4 py-2 text-center text-gray-500 border border-gray-200">
                          No services found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {/* <div className='flex flex-1 flex-col gap-4 p-4'>
              <div className='grid auto-rows-min gap-4 md:grid-cols-3'>
                <div className='aspect-video rounded-xl bg-muted/50' />
                <div className='aspect-video rounded-xl bg-muted/50' />
                <div className='aspect-video rounded-xl bg-muted/50' />
              </div>
              <div className='min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min' />
            </div> */}
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

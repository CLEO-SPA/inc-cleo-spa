import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { ToggleSwitch } from '@/components/ui/switch';
import { SearchForm } from '@/components/search-form';
import { ChevronDownCircle, ChevronUpCircle, FilePenLine } from 'lucide-react';
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
  const [categories, setCategories] = useState([]);

  // For select categories
  const [selectedCategory, setSelectedCategory] = useState('0');
  // For select status
  const [selectedStatus, setSelectedStatus] = useState('0');

  const navigate = useNavigate();

  // For Pagination
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Number of services per page

  const getServices = async () => {
    try{
      let queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage
      });
      const response = await api.get(`/service/all-page-filter?${queryParams.toString()}`);
      if (response.status === 200) {
        setServices(response.data.services);
        setTotalPages(response.data.totalPages);
      } else {
        console.error('Failed to fetch services:', response.statusText);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  }

  const getCategories = async () => {
    try{
      const response = await api.get('/service/service-cat');
      if (response.status === 200) {
        setCategories(response.data);
      } else {
        console.error('Failed to fetch service categories:', response.statusText);
      }
    }catch (err) {
      console.error('Error fetching service categories:', err);
    }
  }

  const handleSwitchChange = (serviceId, service_is_enabled) => {
    // Update the service's enabled status
    console.log(`Change Status for ${serviceId}`);
  }

  // For expanding rows
  // const [expandedIndex, setExpandedIndex] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);

  const toggleRow = async (index) => {
    //Toggled details of one row at a time
    // setExpandedIndex(prev => (prev === index ? null : index));

    //Toggle multiple rows
    if (expandedRows.includes(index)) {
      setExpandedRows(expandedRows.filter(rowIndex => rowIndex !== index));
    } else {
      setExpandedRows([...expandedRows, index]);
    }
  };

  const handleViewAllDetails = () => {
    if(expandedRows.length === services.length){
      // Collapse all rows if all are expanded
      setExpandedRows([]);
      return;
    } else {
    setExpandedRows(services.map((_, index) => index));
    }
  }

  useEffect(() => {
    // Test data
    try {
      getServices();
      getCategories();
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
              {/* Buttons for other Functionalities */}
              <div class="flex space-x-4 p-4 bg-muted/50 rounded-lg">
                <Button onClick={() => navigate("/create-service")} className="rounded-xl">Create Service</Button>
                <Button onClick={() => navigate("/reorder-service")} className="rounded-xl">Reorder Service</Button>
                <Button onClick={handleViewAllDetails} className="rounded-xl">View All Details</Button>
                <Button className="rounded-xl">Manage Categories</Button>
              </div>
              {/* Filter */}
              <div class="flex space-x-4 p-4 bg-muted/50 rounded-lg">
                {/* Search bar */}
                <SearchForm className="w-[300px]" placeholder="Search By Name" />
                {/* Select Category */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0" selected>All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.service_category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Select Status */}
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0" selected>All</SelectItem>
                    <SelectItem value="true">Enabled</SelectItem>
                    <SelectItem value="false">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                {/* Search Button */}
                <Button className="rounded-xl">Search</Button>
              </div>
              <div className="p-4 flex-1 rounded-xl bg-muted/50">
                <div className="overflow-y-auto max-h-[55vh]">
                  {/* Table */}
                  <table className="table-auto w-full text-black border-collapse border border-gray-200 border-rounded-lg">
                    {/* Table Header */}
                    <thead className="bg-black text-white sticky top-0 z-10 shadow">
                      <tr>
                        <th className="px-2 py-2 text-left border border-gray-200">ID</th>
                        <th className="px-2 py-2 text-left border border-gray-200">Name</th>
                        <th className="px-2 py-2 text-left border border-gray-200">Unit Price (SGD)</th>
                        <th className="px-2 py-2 text-left border border-gray-200">Date of Creation</th>
                        <th className="px-2 py-2 text-left border border-gray-200">Category</th>
                        <th className="px-2 py-2 text-left border border-gray-200">Status</th>
                        <th className="px-4 py-2 text-left border border-gray-200">Actions</th>
                      </tr>
                    </thead>
                    {/* Table body */}
                    <tbody>
                      {services.length > 0 ? (
                        services.map((service, index) => (
                          <>
                            <tr key={service.id}>
                              <td className="px-2 py-2 border border-gray-200">{service.id}</td>
                              <td className="px-2 py-2 border border-gray-200">{service.service_name}</td>
                              <td className="px-2 py-2 border border-gray-200">{service.service_price}</td>
                              <td className="px-2 py-2 border border-gray-200">
                                {new Date(service.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-2 py-2 border border-gray-200">{service.service_category_name}</td>
                              {/* Enabled Row */}
                              <td className="px-2 py-2 border border-gray-200">
                                <ToggleSwitch
                                  checked={service.service_is_enabled}
                                  onCheckedChange={handleSwitchChange(service.id, service.service_is_enabled)}
                                />
                              </td>
                              {/* Action Row */}
                              <td className="px-4 py-2 border border-gray-200">
                                <div className="flex space-x-2 space-y-1">
                                  <Button className="p-1 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700">
                                    <FilePenLine className="inline-block mr-1" />
                                  </Button>
                                  <Button className="px-2 py-1 bg-gray-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700">
                                    View Sales History
                                  </Button>
                                  <Button className="p-1 text-3xl text-black bg-transparent rounded-xl hover:bg-transparent hover:text-blue-700" onClick={() => toggleRow(index)}>
                                    {expandedRows.includes(index) ? <ChevronUpCircle /> : <ChevronDownCircle />}
                                  </Button>
                                </div>
                              </td>
                            </tr>

                            {expandedRows.includes(index) && (
                              <tr className="bg-gray-100">
                                <td colSpan="100%" className="px-4 py-2 border border-gray-200">
                                  <div className="grid grid-cols-2 gap-4">
                                    {/* More Details */}
                                    <div>
                                      <div>
                                        <strong>Duration:</strong> {service.service_duration} mins
                                      </div>
                                      <div>
                                        <strong>Description:</strong> {service.service_description ? service.service_description : 'No description available.'}
                                      </div>
                                      <div>
                                        <strong>Number of Care Packages with Service:</strong> {service.total_care_packages}
                                      </div>
                                      <div>
                                        <strong>Number of Sales Transactions:</strong> {service.total_sale_transactions}
                                      </div>
                                    </div>
                                    {/* Created and Updated details */}
                                    <div>
                                      <div>
                                        <strong>Created By:</strong> {service.created_by}
                                      </div>
                                      <div>
                                        <strong>Remarks:</strong> {service.service_remarks ? service.service_remarks : 'No remarks available.'}
                                      </div>
                                      <div>
                                        <strong>Last Updated At:</strong> {new Date(service.updated_at).toLocaleDateString()}
                                      </div>
                                      <div>
                                        <strong>Last Updated By:</strong> {service.updated_by}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
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
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

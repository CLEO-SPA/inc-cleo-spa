import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { SearchForm } from '@/components/search-form';
import { ChevronDownCircle, ChevronUpCircle, FilePenLine, ChevronLeft, ChevronsLeft, ChevronRight, ChevronsRight } from 'lucide-react';
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

  // For search bar
  const [searchQuery, setSearchQuery] = useState('');
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
    try {
      let queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage
      });

      if (searchQuery != '') {
        queryParams.append('search', searchQuery);
      }

      if (selectedCategory != '0') {
        queryParams.append('category', selectedCategory);
      }

      if (selectedStatus != '0') {
        queryParams.append('status', selectedStatus);
      }

      const response = await api.get(`/service/all-page-filter?${queryParams.toString()}`);
      setServices(response.data.services);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  }

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

  //for enabled and disabled service
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
    if (expandedRows.length === services.length) {
      // Collapse all rows if all are expanded
      setExpandedRows([]);
      return;
    } else {
      setExpandedRows(services.map((_, index) => index));
    }
  }

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('0');
    setSelectedStatus('0');
    setCurrentPage(1);
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

  useEffect(() => {
    // Test data
    try {
      getServices();
    } catch (err) {
      console.error('Error fetching services:' + err);
    }
  }, [searchQuery, selectedCategory, selectedStatus, currentPage, itemsPerPage]);

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              {/* Buttons for other Functionalities */}
              <div className="flex space-x-4 p-4 bg-muted/50 rounded-lg">
                <Button onClick={() => navigate("/create-service")} className="rounded-xl">Create Service</Button>
                <Button onClick={() => navigate("/reorder-service")} className="rounded-xl">Reorder Service</Button>
                <Button className="rounded-xl">Manage Categories</Button>
              </div>
              {/* Filter */}
              <div className="flex space-x-4 p-4 bg-muted/50 rounded-lg">
                {/* Search bar */}
                <input
                  type="text"
                  name="search"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[300px] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {/* Search Button */}
                {/* <Button onClick={() => getServices()} className="rounded-xl">Search</Button> */}

                {/* Select Category */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All Categories</SelectItem>
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
                    <SelectItem value="0">All</SelectItem>
                    <SelectItem value="true">Enabled</SelectItem>
                    <SelectItem value="false">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                {/* Reset Button */}
                <Button onClick={() => handleReset()} className="rounded-xl">Clear</Button>
                {/* View all details */}
                <Button onClick={handleViewAllDetails} className="rounded-xl">View All Details</Button>
              </div>
              <div className="p-4 h-[60vh] flex flex-col rounded-xl bg-muted/50">
                <div className="overflow-y-auto flex-1">
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
                                <Switch
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
                              <tr key={service.id} className="bg-gray-100">
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
                {/* Pagination */}
                <div className="flex justify-between items-center mt-2 space-x-4 flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="itemsPerPage" className="text-sm">Items per page:</label>
                    <select
                      id="itemsPerPage"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }
                      }
                      className="border rounded p-1"
                    >
                      {[5, 10, 20, 50, 100].map((num) => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                  {totalPages > 1 && (

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                      >
                        <ChevronsLeft />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        <ChevronLeft />
                      </Button>
                      <span>Page {currentPage} of {totalPages}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        <ChevronRight />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        <ChevronsRight />
                      </Button>
                    </div>

                  )}
                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

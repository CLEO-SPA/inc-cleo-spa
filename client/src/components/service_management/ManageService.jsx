import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/interceptors/axios';
import Pagination from '@/components/Pagination';
import { Badge } from '../ui/badge';

const ManageService = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    active: false,
  });
  const navigate = useNavigate();

  //For Pagination
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Number of services per page

  //get all services
  const fetchServices = async () => {
    try {
      let queryParams = new URLSearchParams({
        page: 1, // Use 1 directly instead of currentPage
        limit: itemsPerPage,
      });
      const res = await api.get('/service/getFilterPageSer?' + queryParams);
      const pages = Math.ceil(res.data.totalServices / itemsPerPage);
      setTotalPages(pages);
      setServices(res.data.services);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  //get service categories
  const fetchCategories = async () => {
    try {
      const res = await api.get('/service/getSerCat');
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchServices();
  }, []);

  // Filter handler
  const handleFilterChange = async (e) => {
    const { name, value, type, checked } = e.target;
    const newFilters = {
      ...filters,
      [name]: type === 'checkbox' ? checked : value,
    };

    // Update state
    setFilters(newFilters);

    try {
      let queryParams = new URLSearchParams({
        page: 1, // Use 1 directly instead of currentPage
        limit: itemsPerPage,
      });

      // Use the new value directly from the event for category
      if (newFilters.search) queryParams.append('search', newFilters.search);
      if (newFilters.category) queryParams.append('category', newFilters.category);
      // Only append active if it's true
      if (newFilters.active) queryParams.append('active', 'true');

      const queryString = queryParams.toString();
      const res = await api.get('/service/getFilterPageSer?' + queryString);
      //get pages
      const pages = Math.ceil(res.data.totalServices / itemsPerPage);
      setTotalPages(pages);
      //set services
      setServices(res.data.services);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Handle page change
  const handlePageChange = async (page) => {
    setCurrentPage(page);
    try {
      // Use the 'page' parameter directly instead of 'currentPage'
      let queryParams = new URLSearchParams({ page: page, limit: itemsPerPage });

      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category !== '') queryParams.append('category', filters.category);
      if (filters.active !== undefined) queryParams.append('active', filters.active);

      const queryString = queryParams.toString();
      const res = await api.get('/service/getFilterPageSer?' + queryString);
      setServices(res.data.services);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  return (
    <div className="bg-white p-2 rounded-md shadow-md">
      <div className="p-6 font-sans">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl text-black font-bold">Manage Services</h1>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => navigate('/ssq')}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
            >
              Change Display
            </button>
            <button
              onClick={() => navigate('/sc')}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
            >
              Create Service
            </button>
            <button
              onClick={() => navigate('/ssr')}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-green-700"
            >
              Service Statistics
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            name="search"
            placeholder="Search by name..."
            value={filters.search}
            onChange={handleFilterChange}
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.service_category_id} value={category.service_category_id}>
                {category.service_category_name}
              </option>
            ))}
          </select>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="active"
              checked={filters.active}
              onChange={handleFilterChange}
              className="w-4 h-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <label htmlFor="onlyActive" className="ml-2 text-sm text-gray-700">
              Show only active services
            </label>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-black border-collapse border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left border border-gray-200 w-20">Category</th>
              <th className="px-2 py-2 text-left border border-gray-200 w-6">#</th>
              <th className="px-2 py-2 text-left border border-gray-200 w-12">ID</th>
              <th className="px-3 py-2 text-left border border-gray-200 w-32">Name</th>
              <th className="px-2 py-2 text-left border border-gray-200 w-16">Unit Price (SGD)</th>
              <th className="px-2 py-2 text-left border border-gray-200 w-16">Duration (Mins)</th>
              <th className="px-2 py-2 text-left border border-gray-200 w-12">Active</th>
              <th className="px-3 py-2 text-left border border-gray-200 w-40">Description</th>
              <th className="px-3 py-2 text-left border border-gray-200 w-40">Remarks</th>
              <th className="px-3 py-2 text-left border border-gray-200 w-24">Created At</th>
              <th className="px-3 py-2 text-left border border-gray-200 w-24">Updated At</th>
              <th className="px-4 py-2 text-left border border-gray-200 w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.length > 0 ? (
              services.map((service, index) => (
                <tr key={service.service_id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-2 py-1 border border-gray-200">{service.service_category_name}</td>
                  <td className="px-2 py-1 border border-gray-200">{service.service_sequence_no}</td>
                  <td className="px-2 py-1 border border-gray-200">{service.service_id}</td>
                  <td className="px-3 py-1 border border-gray-200">{service.service_name}</td>
                  <td className="px-2 py-1 border border-gray-200">{service.service_default_price}</td>
                  <td className="px-2 py-1 border border-gray-200">{service.service_estimated_duration}</td>
                  <td className="px-2 py-1 border border-gray-200">
                    <Badge bg={service.service_is_active ? 'green.500' : 'red.500'}>
                      {service.service_is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-2 py-1 border border-gray-200">{service.service_description}</td>
                  <td className="px-2 py-1 border border-gray-200">{service.service_remarks}</td>
                  <td className="px-2 py-1 border border-gray-200">{service.service_created_at}</td>
                  <td className="px-2 py-1 border border-gray-200">{service.service_updated_at}</td>
                  <td className="px-2 py-1 border border-gray-200">
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => navigate(`/su/${service.service_id}`)}
                        className="px-2 py-1 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => navigate(`/sh/${service.service_name}`)}
                        className="px-2 py-1 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                      >
                        View Sales History
                      </button>
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

        {totalPages > 1 && (
          <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={handlePageChange} />
        )}
      </div>
    </div>
  );
};

export default ManageService;

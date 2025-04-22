import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/interceptors/axios';
import Pagination from '@/components/Pagination';
import { Badge } from '../ui/badge';

const ManageProduct = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    active: false,
  });
  const navigate = useNavigate();

  //For Pagination
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Number of products per page

  //get all products
  const fetchProducts = async () => {
    try {
      let queryParams = new URLSearchParams({
        page: 1, // Use 1 directly instead of currentPage
        limit: itemsPerPage,
      });
      const res = await api.get(`/p/getFilterPagePro?${queryParams}`);
      const pages = Math.ceil(res.data.totalProducts / itemsPerPage);
      setTotalPages(pages);
      setProducts(res.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  //get product categories
  const fetchCategories = async () => {
    try {
      const res = await api.get('/p/getProCat');
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter handler
  const handleFilterChange = async (e) => {
    const { name, value, type, checked } = e.target;
    const newFilters = {
      ...filters,
      [name]: type === 'checkbox' ? checked : value,
    };
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
      const res = await api.get('/p/getFilterPagePro?' + queryString);
      //get pages
      const pages = Math.ceil(res.data.totalProducts / itemsPerPage);
      setTotalPages(pages);
      //set products
      setProducts(res.data.products);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handlePageChange = async (page) => {
    setCurrentPage(page);
    try {
      // Use the 'page' parameter directly instead of 'currentPage'
      let queryParams = new URLSearchParams({
        page: page,
        limit: itemsPerPage,
      });

      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category !== '') queryParams.append('category', filters.category);
      if (filters.active !== undefined) queryParams.append('active', filters.active);

      const queryString = queryParams.toString();
      const res = await api.get('/p/getFilterPagePro?' + queryString);
      setProducts(res.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  return (
    <div className="bg-white p-2 rounded-md shadow-md">
      <div className="p-6 font-sans">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage Products</h1>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => navigate('/pdc')}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
            >
              Create Product
            </button>
            <button
              onClick={() => navigate('/psr')}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-green-700"
            >
              Product Statistics
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
              <option key={category.product_category_id} value={category.product_category_id}>
                {category.product_category_name}
              </option>
            ))}
          </select>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="onlyActive"
              checked={filters.onlyActive}
              onChange={handleFilterChange}
              className="w-4 h-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <label htmlFor="onlyActive" className="ml-2 text-sm text-gray-700">
              Show only active products
            </label>
          </div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-2 text-left border border-gray-200 w-4">ID</th>
              <th className="px-4 py-2 text-left border border-gray-200 w-28">Name</th>
              <th className="px-4 py-2 text-left border border-gray-200 w-8">Unit Price (SGD)</th>
              <th className="px-4 py-2 text-left border border-gray-200 w-8">Visible</th>
              <th className="px-4 py-2 text-left border border-gray-200 w-44">Description</th>
              <th className="px-4 py-2 text-left border border-gray-200 w-44">Remarks</th>
              <th className="px-4 py-2 text-left border border-gray-200 w-28">Category</th>
              <th className="px-4 py-2 text-left border border-gray-200 w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((product, index) => (
                <tr key={product.product_id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-2 py-2 border border-gray-200">{product.product_id}</td>
                  <td className="px-4 py-2 border border-gray-200">{product.product_name}</td>
                  <td className="px-4 py-2 border border-gray-200">{product.product_default_price}</td>
                  <td className="px-4 py-2 border border-gray-200">
                    <Badge bg={product.product_is_active ? 'green.500' : 'red.500'}>
                      {product.product_is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 border border-gray-200">{product.product_description}</td>
                  <td className="px-4 py-2 border border-gray-200">{product.product_remarks}</td>
                  <td className="px-4 py-2 border border-gray-200">{product.product_category_name}</td>
                  <td className="px-4 py-2 border border-gray-200">
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => navigate(`/pdu/${product.product_id}`)}
                        className="p-1 bg-green-600 text-white font-medium rounded-md hover:bg-green-700"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => navigate(`/psh/${product.product_name}`)}
                        className="p-1 bg-gray-600 text-white font-medium rounded-md hover:bg-blue-700"
                      >
                        View Monthly Sales History
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-4 py-2 text-center text-gray-500 border border-gray-200">
                  No products found.
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

export default ManageProduct;

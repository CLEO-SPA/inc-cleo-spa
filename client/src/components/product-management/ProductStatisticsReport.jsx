import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/interceptors/axios';

const ProductStatisticsReport = () => {
  const [sortOption, setSortOption] = useState('idLow');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [productStatistics, setProductStatistics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [highlightedColumn, setHighlightedColumn] = useState('id');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductStatistics = async () => {
      try {
        const res = await api.get(`/p/psr`);
        const products = res.data || [];

        const uniqueCategories = [...new Set(products.map((product) => product.category))];
        setProductStatistics(products);
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching product statistics:', error.response?.data || error.message);
      }
    };

    fetchProductStatistics();
  }, []);

  // Set the column to highlight based on sortOption
  useEffect(() => {
    let column = 'id';

    switch (sortOption) {
      case 'idHigh':
      case 'idLow':
        column = 'id';
        break;
      case 'priceHigh':
      case 'priceLow':
        column = 'price';
        break;
      case 'demandHigh':
      case 'demandLow':
        column = 'demand';
        break;
      default:
        column = 'id';
    }

    setHighlightedColumn(column);
  }, [sortOption]);

  // Sorting logic
  const sortedReports = [...productStatistics].sort((a, b) => {
    switch (sortOption) {
      case 'idHigh':
        return b.id - a.id;
      case 'idLow':
        return a.id - b.id;
      case 'priceHigh':
        return b.price - a.price;
      case 'priceLow':
        return a.price - b.price;
      case 'demandHigh':
        return b.demand - a.demand;
      case 'demandLow':
        return a.demand - b.demand;
      default:
        return 0;
    }
  });

  // Filtering logic
  const filteredReports = sortedReports.filter(
    (report) =>
      (statusFilter === 'all' || report.status === statusFilter) &&
      (categoryFilter === 'all' || report.category === categoryFilter)
  );

  return (
    <div className="p-6 bg-white rounded-md shadow-md">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-bold mb-4">Product Statistics</h2>

      {/* Sorting and Filtering */}
      <div className="flex justify-between items-center my-4 bg-gray-100 p-4 rounded-md">
        <div>
          <label className="font-bold">Sort By: </label>
          <select className="border p-2 rounded" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="idLow">Earliest Products</option>
            <option value="idHigh">Latest Products</option>
            <option value="priceHigh">Highest Price</option>
            <option value="priceLow">Lowest Price</option>
            <option value="demandHigh">Most Demand</option>
            <option value="demandLow">Least Demand</option>
          </select>
        </div>

        <div>
          <label className="font-bold">Status: </label>
          <select className="border p-2 rounded" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label className="font-bold">Category: </label>
          <select
            className="border p-2 rounded"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All</option>
            {categories.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <button
          className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          onClick={() => {
            setSortOption('idLow');
            setStatusFilter('all');
            setCategoryFilter('all');
          }}
        >
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        <table className="w-full border-collapse border text-center">
          <thead className="bg-gray-200">
            <tr>
              <th className={`border p-2 ${highlightedColumn === 'id' ? 'bg-blue-200' : ''}`}>#</th>
              <th className="border p-2">Product Name</th>
              <th className="border p-2">Category</th>
              <th className={`border p-2 ${highlightedColumn === 'price' ? 'bg-blue-200' : ''}`}>Default Price ($)</th>
              <th className={`border p-2 ${highlightedColumn === 'demand' ? 'bg-blue-200' : ''}`}>Demand</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report, index) => (
              <tr key={report.id} className="hover:bg-gray-100">
                {/* Reverse serial number if sorting by latest (idHigh) */}
                <td className={`border p-2 ${highlightedColumn === 'id' ? 'bg-blue-100' : ''}`}>
                  {sortOption === 'idHigh' ? filteredReports.length - index : index + 1}
                </td>
                <td className="border p-2">{report.name}</td>
                <td className="border p-2">{report.category}</td>
                <td className={`border p-2 ${highlightedColumn === 'price' ? 'bg-blue-100' : ''}`}>${report.price}</td>
                <td className={`border p-2 ${highlightedColumn === 'demand' ? 'bg-blue-100' : ''}`}>{report.demand}</td>
                <td className={`border p-2 ${report.status === 'Active' ? 'text-green-500' : 'text-red-500'}`}>
                  {report.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductStatisticsReport;

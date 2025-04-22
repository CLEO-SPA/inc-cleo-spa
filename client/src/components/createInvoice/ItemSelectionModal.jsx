import { useState, useEffect, useContext } from 'react';
import { api } from '../../interceptors/axios';
import { ItemContext } from '../../context/ItemContext';

const ItemSelectionModal = ({ isOpen, onClose, memberEmail, selectedMember, selectedLines }) => {
  const { addItem, selectedItems, setSelectedItems } = useContext(ItemContext);
  const [viewType, setViewType] = useState('services');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({ services: [], products: [], packages: [] });
  const [unpaidItems, setUnpaidItems] = useState({ carePackages: [] });
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch services based on search query
  useEffect(() => {
    const fetchServices = async () => {
      if (viewType === 'services') {
        try {
          setLoading(true);
          const servicesResponse = await api.get('/ci/searchServices', {
            params: {
              query: searchQuery,
            },
          });

          const servicesData = servicesResponse.data.data;

          const formattedServices = servicesData.map((service) => ({
            id: `S${service.service_id}`,
            name: service.service_name,
            category: service.service_category_name,
            price: parseFloat(service.service_default_price),
          }));

          const serviceCategories = [...new Set(servicesData.map((service) => service.service_category_name))];

          setServices(formattedServices);
          setCategories((prev) => ({
            ...prev,
            services: serviceCategories,
          }));
        } catch (error) {
          console.error('Error searching services:', error);
          console.error('Error details:', error.response?.data);
          setError('Failed to search services');
          setServices([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchServices();
  }, [searchQuery, viewType]);

  // Fetch products based on search query
  useEffect(() => {
    const fetchProducts = async () => {
      if (viewType === 'products') {
        try {
          setLoading(true);
          const productsResponse = await api.get('/ci/searchProducts', {
            params: {
              query: searchQuery,
            },
          });

          const productsData = productsResponse.data.data;

          const formattedProducts = productsData.map((product) => ({
            id: `P${product.product_id}`,
            name: product.product_name,
            category: product.product_category_name,
            price: parseFloat(product.product_default_price),
          }));

          const productCategories = [...new Set(productsData.map((product) => product.product_category_name))];

          setProducts(formattedProducts);
          setCategories((prev) => ({
            ...prev,
            products: productCategories,
          }));
        } catch (error) {
          console.error('Error searching products:', error);
          console.error('Error details:', error.response?.data);
          setError('Failed to search products');
          setProducts([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProducts();
  }, [searchQuery, viewType]);

  // Fetch unpaid care packages with search
  useEffect(() => {
    const searchPackages = async () => {
      if (!memberEmail) {
        setError('Please enter a member email first');
        return;
      }

      try {
        setLoading(true);
        console.log('Searching packages with:', {
          email: memberEmail,
          query: searchQuery,
        });

        const response = await api.post('/ci/searchPackages', {
          email: memberEmail,
          query: searchQuery,
        });

        console.log('Package search response:', response.data);

        if (response.data.success) {
          const packages = response.data.data.carePackages;
          console.log('Found packages:', packages);
          setUnpaidItems(response.data.data);
          setError('');
        } else {
          throw new Error(response.data.message || 'Failed to fetch care packages');
        }
      } catch (err) {
        console.error('Error searching packages:', err);
        console.error('Error response:', err.response?.data);
        setError(err.response?.data?.message || 'Error searching packages');
        setUnpaidItems({ carePackages: [] });
      } finally {
        setLoading(false);
      }
    };

    if (viewType === 'packages' && memberEmail && isOpen) {
      searchPackages();
    }
  }, [viewType, memberEmail, isOpen, searchQuery]);

  const handleTypeChange = (e) => {
    setViewType(e.target.value);
    setError('');
    setSearchQuery('');
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems((prev) => {
      const newSelection = prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId];

      console.log(`Item ${itemId} ${prev.includes(itemId) ? 'removed from' : 'added to'} selection`);
      console.log('Current selected items:', newSelection);
      return newSelection;
    });
  };

  const renderSelectedItemsList = () => {
    const allItems = [...services, ...products, ...unpaidItems.carePackages];
    const selectedItemsDetails = allItems.filter((item) =>
      selectedItems.includes(item.member_care_package_id || item.id || `S${item.service_id}` || `P${item.product_id}`)
    );

    if (selectedItemsDetails.length === 0) {
      return <p className="text-gray-500 text-center">No items selected</p>;
    }

    return (
      <div className="space-y-2">
        {selectedItemsDetails.map((item) => {
          const isPackage = item.care_package_name !== undefined;
          const itemId = isPackage
            ? item.member_care_package_id
            : item.id || `S${item.service_id}` || `P${item.product_id}`;

          return (
            <div key={itemId} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {isPackage ? item.care_package_name : item.name || item.service_name || item.product_name}
                </p>
                <p className="text-sm text-gray-500">
                  $
                  {Number(
                    isPackage
                      ? item.member_care_package_total_amount
                      : item.price || item.service_default_price || item.product_default_price
                  ).toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleItemSelection(itemId)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderItemsTable = () => {
    if (loading) return <div className="p-4 text-center">Loading...</div>;
    if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

    let currentItems = [];
    let currentCategories = [];

    if (viewType === 'services') {
      currentItems = services;
      currentCategories = categories.services;
    } else if (viewType === 'products') {
      currentItems = products;
      currentCategories = categories.products;
    } else if (viewType === 'packages') {
      return renderPackagesTable();
    }

    if (currentCategories.length === 0) {
      return (
        <div className="p-4 text-center text-gray-600">
          {searchQuery.trim() === ''
            ? `Enter a search term to find ${viewType}`
            : `No ${viewType} found matching "${searchQuery}"`}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {currentCategories.map((category) => (
          <div key={category}>
            <h3 className="font-semibold text-gray-700 mb-2">{category}</h3>
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems
                  .filter((item) => item.category === category)
                  .map((item) => {
                    const itemId = item.id || `S${item.service_id}` || `P${item.product_id}`;
                    const isAlreadyInInvoice = (itemId) => {
                      // Check if the item is already in selectedLines
                      return selectedLines.some((line) => line.id === itemId);
                    };
                    return (
                      <tr key={itemId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleItemSelection(itemId)}
                            className={`px-3 py-1 rounded ${
                              selectedItems.includes(itemId)
                                ? 'bg-red-100 text-red-700'
                                : isAlreadyInInvoice(itemId)
                                ? 'bg-gray-100 text-gray-500'
                                : 'bg-blue-100 text-blue-700'
                            } hover:bg-opacity-80 transition-colors`}
                            disabled={!selectedMember || isAlreadyInInvoice(itemId)}
                          >
                            {selectedItems.includes(itemId)
                              ? 'Remove'
                              : isAlreadyInInvoice(itemId)
                              ? 'Already Added'
                              : 'Add'}
                          </button>
                        </td>
                        <td className="px-4 py-3">{item.name || item.service_name || item.product_name}</td>
                        <td className="px-4 py-3">${item.price.toFixed(2)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  };

  // Update the renderPackagesTable function
  const renderPackagesTable = () => {
    if (!memberEmail) {
      return <div className="p-4 text-center text-gray-600">Please enter a member email to view unpaid packages.</div>;
    }

    if (loading) {
      return <div className="p-4 text-center">Loading...</div>;
    }

    if (!unpaidItems.carePackages || unpaidItems.carePackages.length === 0) {
      return (
        <div className="p-4 text-center text-gray-600">
          {searchQuery.trim() === '' ? 'No unpaid packages found' : `No packages found matching "${searchQuery}"`}
        </div>
      );
    }

    return (
      <div className="p-4">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Included Services</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {unpaidItems.carePackages.map((pkg) => (
              <tr key={pkg.member_care_package_id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleItemSelection(pkg.member_care_package_id)}
                    className={`px-3 py-1 rounded ${
                      selectedItems.includes(pkg.member_care_package_id)
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    } hover:bg-opacity-80 transition-colors`}
                  >
                    {selectedItems.includes(pkg.member_care_package_id) ? 'Remove' : 'Add'}
                  </button>
                </td>
                <td className="px-4 py-3">{pkg.care_package_name || 'Unnamed Package'}</td>
                <td className="px-4 py-3">${Number(pkg.member_care_package_total_amount).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    {pkg.packageDetails?.map((detail, idx) => (
                      <div key={idx} className="text-sm text-gray-600">
                        <span>{detail.service_name}</span>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleDoneSelection = () => {
    const allItems = [...services, ...products, ...unpaidItems.carePackages];

    const selectedItemsToAdd = allItems
      .filter((item) =>
        selectedItems.includes(item.member_care_package_id || item.id || `S${item.service_id}` || `P${item.product_id}`)
      )
      .map((item) => {
        if (item.member_care_package_id) {
          return {
            ...item,
            originalPrice: Number(item.member_care_package_total_amount),
            finalUnitPrice: Number(item.member_care_package_total_amount),
            quantity: 1,
            lineTotal: Number(item.member_care_package_total_amount),
            packageDetails: item.packageDetails,
          };
        }
        return item;
      });

    console.log('Final items being added to invoice:', selectedItemsToAdd);

    selectedItemsToAdd.forEach((item) => {
      console.log('Adding item to invoice with details:', {
        id: item.member_care_package_id || item.id || `S${item.service_id}` || `P${item.product_id}`,
        name: item.care_package_name || item.name || item.service_name || item.product_name,
        price:
          item.member_care_package_total_amount ||
          item.price ||
          item.service_default_price ||
          item.product_default_price,
        packageDetails: item.packageDetails,
      });
      addItem(item);
    });

    // Clear the selection state
    setSelectedItems([]);
    // Clear the search query
    setSearchQuery('');
    // Reset view type to default
    setViewType('services');
    // Clear any error messages
    setError('');
    // Close the modal
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex">
        {/* Selected Items Panel */}
        <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Selected Items</h3>
          {renderSelectedItemsList()}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Select Items</h2>
              <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="flex gap-4 items-center">
              <button
                type="button"
                onClick={() => handleTypeChange({ target: { value: 'services' } })}
                className={`px-4 py-2 rounded-md ${
                  viewType === 'services' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Services
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange({ target: { value: 'products' } })}
                className={`px-4 py-2 rounded-md ${
                  viewType === 'products' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Products
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange({ target: { value: 'packages' } })}
                className={`px-4 py-2 rounded-md ${
                  viewType === 'packages' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Unpaid Care Packages
              </button>

              {(viewType === 'services' || viewType === 'products' || viewType === 'packages') && (
                <input
                  type="text"
                  placeholder={`Search ${viewType === 'packages' ? 'care packages' : viewType}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ml-4 px-3 py-1 border border-gray-300 rounded-md w-64"
                />
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">{renderItemsTable()}</div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleDoneSelection}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemSelectionModal;

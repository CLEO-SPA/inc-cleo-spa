import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Search, Loader2, Package, ShoppingBag, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import useTransactionCartStore from '@/stores/useTransactionCartStore';

const ServiceTab = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { selectedMember, addCartItem } = useTransactionCartStore();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get('/st/services', {
          params: { query: searchQuery },
        });

        if (response.data.success) {
          const servicesData = response.data.data;

          const categoryMap = {};
          servicesData.forEach((service) => {
            const category = service.service_category_name || 'Uncategorized';
            if (!categoryMap[category]) {
              categoryMap[category] = [];
            }
            categoryMap[category].push(service);
          });

          setCategories(Object.keys(categoryMap).sort());
          setServices(servicesData);
        } else {
          throw new Error(response.data.error || 'Failed to fetch services');
        }
      } catch (err) {
        console.error('Error fetching services:', err);
        setError(err.message || 'Failed to fetch services');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleAddToCart = (service) => {
    if (!selectedMember) {
      alert('Please select a member first before adding services.');
      return;
    }

    const cartItem = {
      id: crypto.randomUUID(),
      type: 'service',
      data: {
        id: service.id,
        service_id: service.service_id,
        name: service.service_name,
        description: service.description,
        duration: service.duration,
        price: parseFloat(service.price),
        category: service.service_category_name,
        quantity: 1,
      },
    };

    addCartItem(cartItem);

    alert(`Added ${service.service_name} to cart`);
  };

  const renderServicesList = () => {
    if (loading) {
      return (
        <div className='flex justify-center items-center p-8'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
          <span className='ml-2 text-gray-600'>Loading services...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className='p-6 text-center'>
          <div className='text-red-500 mb-2'>Error loading services</div>
          <div className='text-sm text-gray-600'>{error}</div>
        </div>
      );
    }

    if (services.length === 0) {
      return (
        <div className='text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200'>
          <ShoppingBag className='h-12 w-12 mx-auto mb-2 text-gray-400' />
          <p className='text-sm'>
            {searchQuery ? `No services found matching "${searchQuery}"` : 'No services available'}
          </p>
        </div>
      );
    }

    return (
      <div className='space-y-6'>
        {/* Member selection notice at the top */}
        {!selectedMember && (
          <Card className='border-orange-200 bg-orange-50'>
            <CardContent className='py-2'>
              <p className='text-orange-800 text-sm'>Please select a member first before adding services.</p>
            </CardContent>
          </Card>
        )}

        {selectedMember && (
          <Card className='border-green-200 bg-green-50'>
            <CardContent className='py-2'>
              <p className='text-green-800 text-sm'>
                Adding services for: <strong>{selectedMember.name}</strong>
              </p>
            </CardContent>
          </Card>
        )}

        {categories.map((category) => {
          const categoryServices = services.filter(
            (service) => (service.service_category_name || 'Uncategorized') === category
          );

          if (categoryServices.length === 0) return null;

          return (
            <div key={category} className='bg-white rounded-md shadow-sm overflow-hidden'>
              <div className='bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center'>
                <Package className='h-4 w-4 mr-2 text-gray-600' />
                <h3 className='font-medium text-gray-700'>{category}</h3>
              </div>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th
                      scope='col'
                      className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      Service
                    </th>
                    <th
                      scope='col'
                      className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      <div className='flex items-center'>
                        <Clock className='h-3 w-3 mr-1' />
                        Duration
                      </div>
                    </th>
                    <th
                      scope='col'
                      className='px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      Price
                    </th>
                    <th
                      scope='col'
                      className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {categoryServices.map((service) => (
                    <tr key={service.id} className='hover:bg-gray-50'>
                      <td className='px-4 py-3'>
                        <div className='font-medium text-gray-900'>{service.service_name}</div>
                        {service.description && (
                          <div className='text-xs text-gray-500 truncate max-w-md' title={service.description}>
                            {service.description}
                          </div>
                        )}
                      </td>
                      <td className='px-4 py-3 text-gray-500'>{service.duration ? `${service.duration} min` : '-'}</td>
                      <td className='px-4 py-3 text-right text-gray-900 font-medium'>
                        ${parseFloat(service.price).toFixed(2)}
                      </td>
                      <td className='px-4 py-3 text-center'>
                        <button
                          type='button'
                          onClick={() => handleAddToCart(service)}
                          className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white 
                                                    ${
                                                      !selectedMember
                                                        ? 'bg-gray-400 cursor-not-allowed'
                                                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none'
                                                    }`}
                          disabled={!selectedMember}
                        >
                          <ShoppingBag className='h-3 w-3 mr-1' />
                          Add
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className='flex flex-col h-full'>
      <div className='mb-4 relative'>
        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
          <Search className='h-5 w-5 text-gray-400' />
        </div>
        <input
          type='text'
          placeholder='Search services by name or category...'
          value={searchQuery}
          onChange={handleSearchChange}
          className='pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        />
      </div>

      <div className='flex-1 overflow-auto'>{renderServicesList()}</div>
    </div>
  );
};

export default ServiceTab;

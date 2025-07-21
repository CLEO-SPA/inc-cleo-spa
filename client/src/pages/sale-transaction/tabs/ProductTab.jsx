import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Search, Loader2, Package, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import useTransactionCartStore from '@/stores/useTransactionCartStore';

const ProductTab = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { selectedMember, addCartItem } = useTransactionCartStore();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get('/st/products', {
          params: { query: searchQuery },
        });

        if (response.data.success) {
          const productsData = response.data.data;

          const categoryMap = {};
          productsData.forEach((product) => {
            const category = product.product_category_name || 'Uncategorized';
            if (!categoryMap[category]) {
              categoryMap[category] = [];
            }
            categoryMap[category].push(product);
          });

          setCategories(Object.keys(categoryMap).sort());
          setProducts(productsData);
        } else {
          throw new Error(response.data.error || 'Failed to fetch products');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleAddToCart = (product) => {
    if (!selectedMember) {
      alert('Please select a member first before adding products.');
      return;
    }

    const cartItem = {
      id: crypto.randomUUID(),
      type: 'product',
      data: {
        id: product.id,
        product_id: product.product_id,
        name: product.product_name,
        description: product.description,
        price: parseFloat(product.price),
        category: product.product_category_name,
        quantity: 1,
      },
    };

    addCartItem(cartItem);
    alert(`Added ${product.product_name} to cart`);
  };

  const renderProductsList = () => {
    if (loading) {
      return (
        <div className='flex justify-center items-center p-8'>
          <Loader2 className='h-8 w-8 animate-spin text-green-500' />
          <span className='ml-2 text-gray-600'>Loading products...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className='p-6 text-center'>
          <div className='text-red-500 mb-2'>Error loading products</div>
          <div className='text-sm text-gray-600'>{error}</div>
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className='text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200'>
          <ShoppingBag className='h-12 w-12 mx-auto mb-2 text-gray-400' />
          <p className='text-sm'>
            {searchQuery ? `No products found matching "${searchQuery}"` : 'No products available'}
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
              <p className='text-orange-800 text-sm'>Please select a member first before adding products.</p>
            </CardContent>
          </Card>
        )}

        {selectedMember && (
          <Card className='border-green-200 bg-green-50'>
            <CardContent className='py-2'>
              <p className='text-green-800 text-sm'>
                Adding products for: <strong>{selectedMember.name}</strong>
              </p>
            </CardContent>
          </Card>
        )}

        {categories.map((category) => {
          const categoryProducts = products.filter(
            (product) => (product.product_category_name || 'Uncategorized') === category
          );

          if (categoryProducts.length === 0) return null;

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
                      Product
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
                  {categoryProducts.map((product) => (
                    <tr key={product.id} className='hover:bg-gray-50'>
                      <td className='px-4 py-3'>
                        <div className='font-medium text-gray-900'>{product.product_name}</div>
                        {product.description && (
                          <div className='text-xs text-gray-500 truncate max-w-md' title={product.description}>
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td className='px-4 py-3 text-right text-gray-900 font-medium'>
                        ${parseFloat(product.price).toFixed(2)}
                      </td>
                      <td className='px-4 py-3 text-center'>
                        <button
                          type='button'
                          onClick={() => handleAddToCart(product)}
                          className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white 
                                                    ${
                                                      !selectedMember
                                                        ? 'bg-gray-400 cursor-not-allowed'
                                                        : 'bg-green-600 hover:bg-green-700 focus:outline-none'
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
          placeholder='Search products by name or category...'
          value={searchQuery}
          onChange={handleSearchChange}
          className='pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
        />
      </div>

      <div className='flex-1 overflow-auto'>{renderProductsList()}</div>
    </div>
  );
};

export default ProductTab;

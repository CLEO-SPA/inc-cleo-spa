import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Search, Loader2 } from 'lucide-react';

const ProductTab = ({ onProductSelect }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError('');
                
                const response = await api.get('/st/products', {
                    params: { query: searchQuery }
                });

                if (response.data.success) {
                    const productsData = response.data.data;
                    
                    const categoryMap = {};
                    productsData.forEach(product => {
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

    const renderProductsList = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-600">Loading products...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="p-6 text-center">
                    <div className="text-red-500 mb-2">Error loading products</div>
                    <div className="text-sm text-gray-600">{error}</div>
                </div>
            );
        }

        if (products.length === 0) {
            return (
                <div className="p-6 text-center text-gray-600">
                    {searchQuery 
                        ? `No products found matching "${searchQuery}"`
                        : "No products available"
                    }
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {categories.map((category) => {
                    const categoryProducts = products.filter(
                        product => (product.product_category_name || 'Uncategorized') === category
                    );
                    
                    if (categoryProducts.length === 0) return null;
                    
                    return (
                        <div key={category} className="bg-white rounded-md shadow-sm overflow-hidden">
                            <div className="bg-green-50 px-4 py-2 border-b border-green-100">
                                <h3 className="font-medium text-green-700">{category}</h3>
                            </div>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {categoryProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{product.product_name}</div>
                                                {product.description && (
                                                    <div className="text-xs text-gray-500 truncate max-w-md" title={product.description}>
                                                        {product.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-900 font-medium">
                                                ${parseFloat(product.price).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => onProductSelect({
                                                        id: product.id,
                                                        product_id: product.product_id,
                                                        name: product.product_name,
                                                        description: product.description,
                                                        price: product.price,
                                                        category: product.product_category_name,
                                                        type: 'product'
                                                    })}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                                                >
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
        <div className="flex flex-col h-full">
            <div className="mb-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search products by name or category..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
            </div>
            
            <div className="flex-1 overflow-auto">
                {renderProductsList()}
            </div>
        </div>
    );
};

export default ProductTab;
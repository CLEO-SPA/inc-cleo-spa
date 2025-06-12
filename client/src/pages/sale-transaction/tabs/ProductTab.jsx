// import { useState, useEffect } from 'react';
// import { api } from '@/interceptors/axios';
// import { useOutlet } from '@/hooks/useOutlet';

// const ProductTab = ({ onProductSelect }) => {
//     const { currentOutlet } = useOutlet();
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [products, setProducts] = useState([]);
//     const [categories, setCategories] = useState([]);
//     const [searchQuery, setSearchQuery] = useState('');

//     // Fetch products based on search query
//     useEffect(() => {
//         const fetchProducts = async () => {
//             try {
//                 setLoading(true);
//                 const productsResponse = await api.get('/ci/searchProducts', {
//                     params: {
//                         query: searchQuery,
//                         outlet_id: currentOutlet?.outlet_id
//                     }
//                 });

//                 const productsData = productsResponse.data.data;

//                 const formattedProducts = productsData.map((product) => ({
//                     id: `P${product.product_id}`,
//                     name: product.product_name,
//                     category: product.product_category_name,
//                     price: parseFloat(product.product_default_price),
//                 }));

//                 const productCategories = [...new Set(productsData.map((product) => product.product_category_name))];

//                 setProducts(formattedProducts);
//                 setCategories(productCategories);
//             } catch (error) {
//                 console.error('Error searching products:', error);
//                 console.error('Error details:', error.response?.data);
//                 setError('Failed to search products');
//                 setProducts([]);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         if (currentOutlet?.outlet_id) {
//             fetchProducts();
//         }
//     }, [searchQuery, currentOutlet]);

//     const renderProductsList = () => {
//         if (loading) return <div className="p-4 text-center">Loading...</div>;
//         if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

//         if (categories.length === 0) {
//             return (
//                 <div className="p-4 text-center text-gray-600">
//                     {searchQuery.trim() === ''
//                         ? 'Enter a search term to find products'
//                         : `No products found matching "${searchQuery}"`
//                     }
//                 </div>
//             );
//         }

//         return (
//             <div className="space-y-6">
//                 {categories.map((category) => (
//                     <div key={category}>
//                         <h3 className="font-semibold text-gray-700 mb-2">{category}</h3>
//                         <table className="w-full border-collapse">
//                             <thead className="bg-gray-50">
//                                 <tr className="border-b border-gray-200">
//                                     <th className="px-4 py-3 text-left">Name</th>
//                                     <th className="px-4 py-3 text-left">Price</th>
//                                     <th className="px-4 py-3 text-left">Action</th>
//                                 </tr>
//                             </thead>
//                             <tbody className="divide-y divide-gray-200">
//                                 {products
//                                     .filter((product) => product.category === category)
//                                     .map((product) => (
//                                         <tr key={product.id} className="hover:bg-gray-50">
//                                             <td className="px-4 py-3">{product.name}</td>
//                                             <td className="px-4 py-3">${product.price.toFixed(2)}</td>
//                                             <td className="px-4 py-3">
//                                                 <button
//                                                     type="button"
//                                                     onClick={() => onProductSelect(product)}
//                                                     className="px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
//                                                 >
//                                                     Select
//                                                 </button>
//                                             </td>
//                                         </tr>
//                                     ))}
//                             </tbody>
//                         </table>
//                     </div>
//                 ))}
//             </div>
//         );
//     };

//     return (
//         <div className="product-search-component">
//             <div className="mb-4">
//                 <input
//                     type="text"
//                     placeholder="Search products..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     className="px-3 py-2 border border-gray-300 rounded-md w-full"
//                 />
//             </div>
            
//             <div className="product-list">
//                 {renderProductsList()}
//             </div>
//         </div>
//     );
// };

// export default ProductTab;
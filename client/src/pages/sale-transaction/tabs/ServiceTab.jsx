// import { useState, useEffect } from 'react';
// import { api } from '@/interceptors/axios';
// import { useOutlet } from '@/hooks/useOutlet';

// const ServiceTab = ({ onServiceSelect }) => {
//     const { currentOutlet } = useOutlet();
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [services, setServices] = useState([]);
//     const [categories, setCategories] = useState([]);
//     const [searchQuery, setSearchQuery] = useState('');

//     // Fetch services based on search query
//     useEffect(() => {
//         const fetchServices = async () => {
//             try {
//                 setLoading(true);
//                 const servicesResponse = await api.get('/ci/searchServices', {
//                     params: {
//                         query: searchQuery,
//                         outlet_id: currentOutlet?.outlet_id
//                     }
//                 });

//                 const servicesData = servicesResponse.data.data;

//                 const formattedServices = servicesData.map((service) => ({
//                     id: `S${service.service_id}`,
//                     name: service.service_name,
//                     category: service.service_category_name,
//                     price: parseFloat(service.service_default_price),
//                 }));

//                 const serviceCategories = [...new Set(servicesData.map((service) => service.service_category_name))];

//                 setServices(formattedServices);
//                 setCategories(serviceCategories);
//             } catch (error) {
//                 console.error('Error searching services:', error);
//                 console.error('Error details:', error.response?.data);
//                 setError('Failed to search services');
//                 setServices([]);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         if (currentOutlet?.outlet_id) {
//             fetchServices();
//         }
//     }, [searchQuery, currentOutlet]);

//     const renderServicesList = () => {
//         if (loading) return <div className="p-4 text-center">Loading...</div>;
//         if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

//         if (categories.length === 0) {
//             return (
//                 <div className="p-4 text-center text-gray-600">
//                     {searchQuery.trim() === ''
//                         ? 'Enter a search term to find services'
//                         : `No services found matching "${searchQuery}"`
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
//                                 {services
//                                     .filter((service) => service.category === category)
//                                     .map((service) => (
//                                         <tr key={service.id} className="hover:bg-gray-50">
//                                             <td className="px-4 py-3">{service.name}</td>
//                                             <td className="px-4 py-3">${service.price.toFixed(2)}</td>
//                                             <td className="px-4 py-3">
//                                                 <button
//                                                     type="button"
//                                                     onClick={() => onServiceSelect(service)}
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
//         <div className="service-search-component">
//             <div className="mb-4">
//                 <input
//                     type="text"
//                     placeholder="Search services..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     className="px-3 py-2 border border-gray-300 rounded-md w-full"
//                 />
//             </div>
            
//             <div className="service-list">
//                 {renderServicesList()}
//             </div>
//         </div>
//     );
// };

// export default ServiceTab;
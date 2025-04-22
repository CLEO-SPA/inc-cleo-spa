import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { X, Save, ArrowLeft } from 'lucide-react';
import { api } from '@/interceptors/axios';
import Navbar from '@/components/Navbar';
import FilteredSelect from '@/components/FieldSelector';
import DateTimePicker from '@/components/DateTimePicker';

const EditMemberCarePackageForm = ({ mcpId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [members, setMembers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [carePackage, setCarePackage] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    creationDate: new Date(),
    memberId: '',
    employeeId: '',
    carePackageId: '',
    packageName: '',
    remarks: '',
    price: '',
    status: '',
    services: [
      {
        serviceId: '',
        serviceName: '',
        quantity: '1',
        discount: '0',
        price: '',
        standardPrice: '',
        customPrice: '',
      },
    ],
  });

  // Fetch existing MCP data and other required data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('No package ID provided');
        return;
      }

      try {
        setLoading(true);
        const [mcpResponse, carePackageResponse, servicesResponse, membersResponse, employeesResponse] =
          await Promise.all([
            api.get(`/mcp/get-amcp/${id}`),
            api.get('cp/get-cp'),
            api.get('/service/getAllSerO'),
            api.get('/m/all'),
            api.get('/em/all'),
          ]);

        const mcpData = mcpResponse.data;
        const servicesData = servicesResponse.data || [];

        // console.log('mcpData:', mcpData);
        // console.log('servicesData:', servicesData);

        if (!mcpData) {
          throw new Error('No package data found');
        }

        setServices(servicesData);
        setMembers(membersResponse.data || []);
        setEmployees(employeesResponse.data || []);
        setCarePackage(carePackageResponse.data || []);

        // Safely map over package details with null checks
        const packageServices =
          mcpData.cs_member_care_package_details?.reduce((acc, detail) => {
            const serviceDetails = servicesData.find((s) => s.service_id === detail?.service_id);

            // Find existing service with same name, price, and status
            const existingService = acc.find(
              (service) =>
                service.serviceName === serviceDetails?.service_name &&
                service.customPrice === detail?.member_care_package_details_price?.toString() &&
                service.status === detail?.cs_status?.status_name
            );

            // Helper function to calculate price with discount
            const calculateTotalPrice = (quantity, unitPrice, discount) => {
              const basePrice = quantity * unitPrice;
              const discountAmount = basePrice * (discount / 100);
              return (basePrice - discountAmount).toFixed(2);
            };

            if (existingService) {
              // Convert string quantities to numbers, add them, then convert back to string
              const newQuantity =
                parseInt(existingService.quantity) + parseInt(detail?.member_care_package_details_quantity || '1');
              existingService.quantity = newQuantity.toString();

              // Calculate new price based on quantity, per-unit price, and discount
              const unitPrice = parseFloat(detail?.member_care_package_details_price || '0');
              const discount = parseFloat(detail?.member_care_package_details_discount || '0');
              existingService.price = calculateTotalPrice(newQuantity, unitPrice, discount);
            } else {
              // Calculate initial price based on quantity, unit price, and discount
              const quantity = parseInt(detail?.member_care_package_details_quantity || '1');
              const unitPrice = parseFloat(detail?.member_care_package_details_price || '0');
              const discount = parseFloat(detail?.member_care_package_details_discount || '0');
              const totalPrice = calculateTotalPrice(quantity, unitPrice, discount);

              acc.push({
                serviceId: detail?.service_id?.toString() || '',
                serviceName: serviceDetails?.service_name || '',
                quantity: quantity.toString(),
                discount: discount.toString(),
                price: totalPrice,
                standardPrice: serviceDetails?.service_default_price?.toString() || '0',
                customPrice: detail?.member_care_package_details_price?.toString() || '0',
                status: detail?.cs_status?.status_name,
              });
            }

            return acc;
          }, []) || [];

        // Set form data with null checks
        setFormData({
          creationDate: mcpData.member_care_package_created_at
            ? new Date(mcpData.member_care_package_created_at)
            : new Date(),
          memberId: mcpData.member_id?.toString() || '',
          employeeId: mcpData.employee_id?.toString() || '',
          packageName: mcpData.care_package_name || '',
          remarks: mcpData.care_package_remarks || '',
          price: mcpData.member_care_package_total_amount?.toString() || '0',
          status: mcpData?.cs_status.status_name,
          services:
            packageServices.length > 0
              ? packageServices
              : [
                  {
                    serviceId: '',
                    serviceName: '',
                    quantity: '1',
                    discount: '0',
                    price: '',
                    standardPrice: '',
                    customPrice: '',
                  },
                ],
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error loading package details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const calculateServicePrice = (service) => {
    const basePrice = service.customPrice ? parseFloat(service.customPrice) : parseFloat(service.standardPrice) || 0;
    const quantity = parseInt(service.quantity) || 0;
    const discount = parseFloat(service.discount) || 0;
    return basePrice * quantity * (1 - discount / 100);
  };

  const updateTotalPackagePrice = (updatedServices) => {
    const total = updatedServices.reduce((sum, service) => {
      return sum + (parseFloat(service.price) || 0);
    }, 0);

    setFormData((prev) => ({
      ...prev,
      price: total.toFixed(2),
    }));
  };

  const handleDateTimeChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      creationDate: date,
    }));
  };

  const handleServiceChange = (index, serviceId) => {
    const selectedService = services.find((s) => s.service_id === serviceId);

    if (selectedService) {
      setFormData((prev) => {
        const updatedServices = [...prev.services];
        const currentService = updatedServices[index];

        updatedServices[index] = {
          ...currentService,
          serviceId: selectedService.service_id.toString(),
          serviceName: selectedService.service_name,
          standardPrice: selectedService.service_default_price,
          customPrice: selectedService.service_default_price,
          quantity: currentService.quantity || '1',
          discount: currentService.discount || '0',
        };

        updatedServices[index].price = calculateServicePrice(updatedServices[index]).toFixed(2);
        setTimeout(() => updateTotalPackagePrice(updatedServices), 0);

        return {
          ...prev,
          services: updatedServices,
        };
      });
    }
  };

  const handleCustomPriceChange = (index, value) => {
    setFormData((prev) => {
      const updatedServices = [...prev.services];
      updatedServices[index] = {
        ...updatedServices[index],
        customPrice: value,
      };
      updatedServices[index].price = calculateServicePrice(updatedServices[index]).toFixed(2);
      setTimeout(() => updateTotalPackagePrice(updatedServices), 0);
      return {
        ...prev,
        services: updatedServices,
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }
    // Open modal to select invoice option
    setShowModal(true);
  };

  const handleFinalSubmit = async (createNewInvoice = false) => {
    setShowModal(false);
    setLoading(true);
    try {
      const response = await api.put(`/mcp/update/${id}`, {
        ...formData,
        mode: createNewInvoice ? 'create_new' : 'update_current',
        price: parseFloat(formData.price),
        services: formData.services.map((service) => ({
          ...service,
          price: parseFloat(service.price),
          discount: parseFloat(service.discount),
          quantity: parseInt(service.quantity),
          standardPrice: parseFloat(service.standardPrice),
          customPrice: parseFloat(service.customPrice),
          status: service.status,
        })),
      });

      if (response.statusText !== 'OK') {
        throw new Error('Failed to update care package');
      }

      if (createNewInvoice) {
        navigate('/ci');
      } else {
        navigate('/mcpd');
      }
    } catch (error) {
      setError('Failed to update care package. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        {
          serviceId: '',
          serviceName: '',
          quantity: '1',
          discount: '0',
          price: '',
          standardPrice: '',
        },
      ],
    }));
  };

  const removeService = (index) => {
    if (formData.services.length <= 1) {
      setError('Care package must have at least one service');
      return;
    }

    setFormData((prev) => {
      const updatedServices = prev.services.filter((_, i) => i !== index);
      setTimeout(() => updateTotalPackagePrice(updatedServices), 0);
      return {
        ...prev,
        services: updatedServices,
      };
    });
  };

  const updateService = (index, field, value) => {
    setFormData((prev) => {
      const updatedServices = [...prev.services];
      updatedServices[index] = {
        ...updatedServices[index],
        [field]: value,
      };

      if (field === 'quantity' || field === 'discount') {
        updatedServices[index].price = calculateServicePrice(updatedServices[index]).toFixed(2);
      }

      setTimeout(() => updateTotalPackagePrice(updatedServices), 0);

      return {
        ...prev,
        services: updatedServices,
      };
    });
  };

  const validateForm = () => {
    if (!formData.memberId) {
      setError('Please select a member');
      return false;
    }

    if (!formData.packageName.trim()) {
      setError('Package name is required');
      return false;
    }

    const hasValidService = formData.services.some((service) => service.serviceId && parseInt(service.quantity) > 0);

    if (!hasValidService) {
      setError('At least one service with quantity must be selected');
      return false;
    }

    const invalidServices = formData.services.filter(
      (service) =>
        service.serviceId &&
        (!service.quantity ||
          parseInt(service.quantity) < 1 ||
          parseFloat(service.discount) < 0 ||
          parseFloat(service.discount) > 100)
    );

    if (invalidServices.length > 0) {
      setError('All services must have valid quantity and discount values');
      return false;
    }

    return true;
  };

  if (loading && !services.length) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-7xl bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Member Care Package</h1>
              <p className="text-gray-600">Update package details and services</p>
            </div>
            <Button
              onClick={() => navigate(-1)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-md flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          {error && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-md mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Details Section */}
            <div className="grid grid-cols-4 gap-6">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700">
                  Creation Date
                  <div className="mt-1">
                    <DateTimePicker
                      selectedDateTime={formData.creationDate}
                      onDateTimeSelect={handleDateTimeChange}
                      className="w-full"
                    />
                  </div>
                </label>
              </div>

              <div className="w-full">
                <Field label="Member">
                  <input
                    type="text"
                    value={members.find((m) => m.member_id.toString() === formData.memberId)?.member_name || ''}
                    className="w-full bg-gray-100 text-gray-900 rounded-md p-2 border border-gray-300"
                    disabled
                  />
                </Field>
              </div>

              <div className="w-full">
                <Field label="Assigned Employee">
                  <FilteredSelect
                    options={employees.map((e) => ({
                      id: e.employee_id,
                      ...e,
                    }))}
                    value={formData.employeeId}
                    onChange={(value) => setFormData((prev) => ({ ...prev, employeeId: value }))}
                    getOptionLabel={(employee) => `${employee.employee_name} (${employee.employee_code})`}
                    placeholder="Select an employee"
                    searchPlaceholder="Search employees..."
                    className="w-full"
                  />
                </Field>
              </div>

              <div className="w-full">
                <Field label="Status">
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="Invoice_Unpaid">Unpaid</option>
                    <option value="Invoice_Paid">Paid</option>
                    <option value="Invoice_Partially_Paid">Partial Paid</option>
                  </select>
                </Field>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Field label="Package Name">
                <input
                  type="text"
                  value={formData.packageName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, packageName: e.target.value }))}
                  className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </Field>

              <Field label="Package Price">
                <input
                  type="text"
                  value={formData.price}
                  readOnly
                  className="w-full bg-gray-50 text-gray-900 rounded-md p-2 border border-gray-300"
                  placeholder="Total package price (auto-calculated)"
                />
              </Field>
            </div>

            <Field label="Remarks">
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter remarks"
                rows={2}
              />
            </Field>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Services</h2>
                <Button
                  type="button"
                  onClick={addService}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  Add Service
                </Button>
              </div>

              {formData.services.map((service, index) => {
                return (
                  <div key={index} className="relative p-4 border border-gray-200 rounded-md space-y-4 bg-gray-50">
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-md"
                      disabled={formData.services.length === 1} // Prevents removal when only one service exists
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>

                    <div className="grid grid-cols-7 gap-4">
                      <div className="col-span-2">
                        <Field label="Service">
                          <select
                            value={service.serviceId || ''}
                            onChange={(e) => handleServiceChange(index, e.target.value)}
                            className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                          >
                            {Object.entries(
                              services.reduce((acc, service) => {
                                const category =
                                  service.cs_service_categories?.service_category_name || 'Uncategorized';
                                if (!acc[category]) acc[category] = [];
                                acc[category].push(service);
                                return acc;
                              }, {})
                            ).map(([category, categoryServices]) => (
                              <optgroup key={category} label={category}>
                                {categoryServices.map((s) => (
                                  <option key={s.service_id} value={s.service_id.toString()}>
                                    {s.service_name} (${s.service_default_price})
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </Field>
                      </div>

                      <Field label="Custom Price">
                        <input
                          type="number"
                          value={service.customPrice}
                          onChange={(e) => handleCustomPriceChange(index, e.target.value)}
                          className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          min="0"
                          step="0.01"
                          required
                        />
                      </Field>

                      <Field label="Quantity">
                        <input
                          type="number"
                          value={service.quantity}
                          onChange={(e) => updateService(index, 'quantity', e.target.value)}
                          className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          min="1"
                          required
                        />
                      </Field>

                      <Field label="Discount (%)">
                        <input
                          type="number"
                          value={service.discount}
                          onChange={(e) => updateService(index, 'discount', e.target.value)}
                          className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          min="0"
                          max="100"
                          required
                        />
                      </Field>

                      <Field label="Status">
                        <select
                          value={service.status || 'Unpaid'}
                          onChange={(e) => updateService(index, 'status', e.target.value)}
                          className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          required
                        >
                          <option value="Unpaid">Unpaid</option>
                          <option value="Paid">Paid</option>
                          <option value="Consumed">Consumed</option>
                        </select>
                      </Field>

                      <Field label="Final Price">
                        <input
                          type="text"
                          value={service.price}
                          readOnly
                          className="w-full bg-gray-50 text-gray-900 rounded-md p-2 border border-gray-300"
                        />
                      </Field>
                    </div>
                  </div>
                );
              })}

              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Package'}
                  <Save className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modal for choosing invoice option */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="bg-white rounded-lg z-10 p-6 w-11/12 max-w-md">
            <h2 className="text-xl font-bold mb-4">Invoice Options</h2>
            <p className="mb-6">Do you want to update the current invoice or create a new invoice?</p>
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                disabled={loading}
              >
                Update Current Invoice
              </Button>
              <Button
                type="button"
                onClick={() => handleFinalSubmit(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                disabled={loading}
              >
                Create New Invoice
              </Button>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditMemberCarePackageForm;

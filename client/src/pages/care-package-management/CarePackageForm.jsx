import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { X, SquarePen, FilePlus2 } from 'lucide-react';
import { api } from '@/interceptors/axios';
import { Switch } from '@/components/ui/switch';
import Navbar from '@/components/Navbar';
import DateTimePicker from '@/components/DateTimePicker';

const CarePackageForm = () => {
  const switchRef = useRef();
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    creationDate: new Date(),
    packageName: '',
    remarks: '',
    price: '0.00',
    customizable: false,
    services: [
      {
        serviceId: '',
        serviceName: '',
        quantity: '1',
        discount: '0',
        price: '0.00',
      },
    ],
  });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await api.get('/service/getAllSerO/');
        if (response.statusText !== 'OK') {
          throw new Error('Failed to fetch services');
        }
        setServices(response.data);
      } catch (error) {
        setError('Error loading services. Please try again later.');
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const calculateServicePrice = (service, serviceDefaultPrice) => {
    if (!serviceDefaultPrice) return 0;

    const basePrice = parseFloat(serviceDefaultPrice);
    const quantity = parseInt(service.quantity) || 1;
    const discount = parseFloat(service.discount) || 0;

    return basePrice * quantity * (1 - discount / 100);
  };

  const updateTotalPackagePrice = (updatedServices) => {
    const total = updatedServices.reduce((sum, service) => {
      const selectedService = services.find((s) => String(s.service_id) === String(service.serviceId));
      const serviceDefaultPrice = selectedService ? selectedService.service_default_price : 0;
      return sum + calculateServicePrice(service, serviceDefaultPrice);
    }, 0);

    setFormData((prev) => ({
      ...prev,
      price: total.toFixed(2),
    }));
  };

  // handle change of date time
  const handleDateTimeChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      creationDate: date,
    }));
  };

  const handleServiceChange = (index, serviceId) => {
    if (!services || services.length === 0) {
      console.warn('Services list is not yet loaded');
      return;
    }

    const selectedService = services.find((s) => String(s.service_id) === String(serviceId));

    if (!selectedService) {
      console.warn('Selected service not found for ID:', serviceId);
      return;
    }

    setFormData((prev) => {
      const updatedServices = [...prev.services];
      updatedServices[index] = {
        ...updatedServices[index],
        serviceId: selectedService.service_id,
        serviceName: selectedService.service_name,
        quantity: updatedServices[index].quantity || '1',
        discount: updatedServices[index].discount || '0',
      };

      updatedServices[index].price = calculateServicePrice(
        updatedServices[index],
        selectedService.service_default_price
      ).toFixed(2);

      const newFormData = {
        ...prev,
        services: updatedServices,
      };

      setTimeout(() => updateTotalPackagePrice(updatedServices), 0);

      return newFormData;
    });
  };

  // care package creation
  const handleSubmit = async (e) => {
    // console.log('Form data for care package creation:', formData);

    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const submissionData = {
        ...formData,
        creationDate: formData.creationDate.toISOString(),
        services: formData.services.map((service) => ({
          ...service,
          price: parseFloat(service.price),
          quantity: parseInt(service.quantity),
          discount: parseFloat(service.discount),
        })),
      };

      const response = await api.post('/cp/create-cp', submissionData);

      if (response.statusText !== 'OK') {
        throw new Error('Failed to create care package');
      }

      navigate('/cpd');

      setFormData({
        creationDate: new Date(),
        packageName: '',
        remarks: '',
        price: '0.00',
        customizable: false,
        services: [
          {
            serviceId: '',
            serviceName: '',
            quantity: '1',
            discount: '0',
            price: '0.00',
          },
        ],
      });
    } catch (error) {
      setError('Failed to create care package. Pl ease try again.');
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
          price: '0.00',
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
        const selectedService = services.find((s) => String(s.service_id) === String(updatedServices[index].serviceId));
        if (selectedService) {
          updatedServices[index].price = calculateServicePrice(
            updatedServices[index],
            selectedService.service_default_price
          ).toFixed(2);
        }
      }

      setTimeout(() => updateTotalPackagePrice(updatedServices), 0);

      return {
        ...prev,
        services: updatedServices,
      };
    });
  };

  const validateForm = () => {
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-lg p-8 shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Care Package</h1>
          <p className="text-gray-600 mb-6">Enter package details and add services</p>
          {error && <div className="bg-red-500 text-white p-3 rounded-md mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <label className="block text-sm font-medium text-gray-700">
              Creation Date
              <DateTimePicker
                selectedDateTime={formData.creationDate}
                onDateTimeSelect={handleDateTimeChange}
                className="mt-1"
              />
            </label>

            <Field label="Package Name">
              <input
                type="text"
                value={formData.packageName}
                onChange={(e) => setFormData((prev) => ({ ...prev, packageName: e.target.value }))}
                className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300"
                placeholder="Enter package name"
                required
              />
            </Field>

            <Field label="Remarks">
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300"
                placeholder="Enter remarks"
                rows={3}
              />
            </Field>

            <Field label="Customizable Package">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.customizable}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customizable: e.target.checked,
                    }))
                  }
                  rootRef={switchRef}
                  css={{
                    '[data-state] > span': {
                      backgroundColor: '#3b82f6',
                    },
                  }}
                >
                  <span className="ml-2 text-gray-700">
                    {formData.customizable ? 'Package can be customized' : 'Package cannot be customized'}
                  </span>
                </Switch>
              </div>
            </Field>

            <Field label="Package Price">
              <input
                type="text"
                value={formData.price}
                readOnly
                className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300"
                placeholder="Total package price (auto-calculated)"
              />
            </Field>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Services</h2>
                <Button
                  type="button"
                  onClick={addService}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-2 rounded-md"
                >
                  Add Service
                </Button>
              </div>

              {formData.services.map((service, index) => (
                <div key={index} className="relative p-4 border border-gray-300 rounded-md space-y-4 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-md"
                    disabled={formData.services.length === 1}
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>

                  <Field label="Service" data-testid={`service-select-${index}`}>
                    <select
                      value={service.serviceId}
                      onChange={(e) => handleServiceChange(index, e.target.value)}
                      className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300"
                      required
                    >
                      <option value="">Select a service</option>
                      {Object.entries(
                        services.reduce((acc, service) => {
                          const category = service.service_category_name;
                          if (!acc[category]) acc[category] = [];
                          acc[category].push(service);
                          return acc;
                        }, {})
                      ).map(([category, categoryServices]) => (
                        <optgroup key={category} label={category}>
                          {categoryServices.map((s) => (
                            <option key={s.service_id} value={s.service_id}>
                              {s.service_name} (${s.service_default_price})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </Field>

                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Quantity">
                      <input
                        data-testid={`quantity-input-${index}`}
                        type="number"
                        value={service.quantity}
                        onChange={(e) => updateService(index, 'quantity', e.target.value)}
                        className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300"
                        min="1"
                        required
                      />
                    </Field>

                    <Field label="Discount (%)">
                      <input
                        data-testid={`discount-input-${index}`}
                        type="number"
                        value={service.discount}
                        onChange={(e) => updateService(index, 'discount', e.target.value)}
                        className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300"
                        min="0"
                        max="100"
                        required
                      />
                    </Field>

                    <Field label="Final Price">
                      <input
                        type="text"
                        value={service.price}
                        readOnly
                        className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300"
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex w-full gap-4">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md flex justify-center items-center"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Package'}
                <FilePlus2 className="h-4 w-4 ml-2 text-white" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CarePackageForm;

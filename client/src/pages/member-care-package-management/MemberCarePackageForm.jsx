import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { X, SquarePen, FilePlus2 } from 'lucide-react';
import { api } from '@/interceptors/axios';
import Navbar from '@/components/Navbar';
import FilteredSelect from '@/components/FieldSelector';
import DateTimePicker from '@/components/DateTimePicker';

const MemberCarePackageForm = () => {
  const [services, setServices] = useState([]);
  const [members, setMembers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [carePackage, setCarePackage] = useState([]);
  const [selectedCarePackage, setSelectedCarePackage] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    creationDate: new Date(),
    memberId: '',
    employeeId: '',
    carePackageId: '',
    packageName: '',
    remarks: '',
    price: '',
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

  // used to fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [carePackageResponse, servicesResponse, membersResponse, employeesResponse] = await Promise.all([
          api.get('cp/get-acp'),
          api.get('/service/getAllSerO'),
          api.get('/m/all'),
          api.get('/em/all'),
        ]);

        if (
          carePackageResponse.statusText !== 'OK' ||
          servicesResponse.statusText !== 'OK' ||
          membersResponse.statusText !== 'OK' ||
          employeesResponse.statusText !== 'OK'
        ) {
          throw new Error('Failed to fetch data');
        }

        setCarePackage(carePackageResponse.data);
        setServices(servicesResponse.data);
        setMembers(membersResponse.data);
        setEmployees(employeesResponse.data);
      } catch (error) {
        setError('Error loading data. Please try again later.');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // handle change of date time
  const handleDateTimeChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      creationDate: date,
    }));
  };

  // when a service is added or deleted
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

  const handleCarePackageChange = (packageId) => {
    const selectedPackage = carePackage.find((cp) => cp.care_package_id === packageId);

    // console.log('selectedPackage:', selectedPackage);

    if (selectedPackage) {
      setSelectedCarePackage(selectedPackage);
      setFormData((prev) => ({
        ...prev,
        carePackageId: packageId,
        packageName: selectedPackage.care_package_name,
        price: selectedPackage.care_package_price,
      }));

      if (selectedPackage.cs_care_package_item_details && selectedPackage.cs_care_package_item_details.length > 0) {
        const packageServices = selectedPackage.cs_care_package_item_details.map((item) => {
          const serviceDetails = services.find((s) => s.service_id === item.service_id);
          const standardPrice = serviceDetails ? parseFloat(serviceDetails.service_default_price) : 0;
          const quantity = parseInt(item.care_package_item_details_quantity) || 1;
          const customPrice = parseFloat(item.care_package_item_details_price) / quantity || standardPrice;
          const finalPrice = parseFloat(item.care_package_item_details_price);
          return {
            serviceId: item.service_id.toString(),
            serviceName: serviceDetails ? serviceDetails.service_name : '',
            quantity: item.care_package_item_details_quantity.toString(),
            discount: item.care_package_item_details_discount.toString(),
            price: finalPrice.toFixed(2).toString(),
            standardPrice: standardPrice,
            customPrice: customPrice,
            isFromCarePackage: true,
          };
        });

        setFormData((prev) => ({
          ...prev,
          services: packageServices,
        }));
      }
    }
  };

  // allowing custom prices
  const handleCustomPriceChange = (index, value) => {
    setFormData((prev) => {
      const updatedServices = [...prev.services];
      updatedServices[index] = {
        ...updatedServices[index],
        customPrice: value,
      };

      // recalculate service based of custom price
      updatedServices[index].price = calculateServicePrice(updatedServices[index]).toFixed(2);

      setTimeout(() => updateTotalPackagePrice(updatedServices), 0);

      return {
        ...prev,
        services: updatedServices,
      };
    });
  };

  // handles save as draft
  // const handleSaveDraft = async () => {
  //   setError('');

  //   if (!formData.memberId) {
  //     setError('Please select a member before saving as draft');
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     // TO UPDATE AS THE CORRECT API !
  //     const response = await api.post('/mcp/save-draft', formData);

  //     if (response.statusText !== 'OK') {
  //       throw new Error('Failed to save draft');
  //     }

  //     setFormData({
  //       creationDate: formData.creationDate,
  //       memberId: '',
  //       employeeId: '',
  //       packageName: '',
  //       remarks: '',
  //       price: '',
  //       services: [
  //         {
  //           serviceId: '',
  //           serviceName: '',
  //           quantity: '1',
  //           discount: '0',
  //           price: '',
  //           standardPrice: '',
  //         },
  //       ],
  //     });

  //     alert('Draft saved successfully');
  //   } catch (error) {
  //     setError('Failed to save draft. Please try again.');
  //     console.error('Draft Error:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // handles creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      // console.log('formData:', formData);
      const response = await api.post('/mcp/create-mcp', {
        ...formData,
        price: parseFloat(formData.price),
        services: formData.services.map((service) => ({
          ...service,
          price: parseFloat(service.price),
          discount: parseFloat(service.discount),
          quantity: parseInt(service.quantity),
          standardPrice: parseFloat(service.standardPrice),
          customPrice: parseFloat(service.customPrice),
        })),
      });

      if (response.statusText !== 'OK') {
        throw new Error('Failed to create care package');
      }
      navigate('/mcpd');

      // reset form or show success message
      setFormData({
        creationDate: new Date(),
        memberId: '',
        employeeId: '',
        packageName: '',
        remarks: '',
        price: '',
        services: [
          {
            serviceId: '',
            serviceName: '',
            quantity: '1',
            discount: '0',
            price: '',
            standardPrice: '',
          },
        ],
      });
    } catch (error) {
      setError('Failed to create care package. Please try again.');
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
          isFromCarePackage: false,
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
        <div className="text-white" data-testid="mcp-form-loading">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Member Care Package</h1>
          <p className="text-gray-600 mb-6">Enter package details and add services</p>
          {error && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-md mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <label className="block text-sm font-medium text-gray-700">
              Creation Date
              <DateTimePicker
                selectedDateTime={formData.creationDate}
                onDateTimeSelect={handleDateTimeChange}
                className="mt-1"
              />
            </label>

            <div data-testid="member-select-container">
              <Field label="Select Member">
                <FilteredSelect
                  options={members.map((m) => ({
                    id: m.member_id,
                    ...m,
                  }))}
                  value={formData.memberId}
                  onChange={(value) => setFormData((prev) => ({ ...prev, memberId: value }))}
                  getOptionLabel={(member) => `${member.member_name} (${member.member_contact})`}
                  placeholder="Select a member"
                  searchPlaceholder="Search members..."
                  data-testid="member-select"
                />
              </Field>
            </div>

            <div data-testid="employee-select-container">
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
                  data-testid="employee-select"
                />
              </Field>
            </div>

            <div data-testid="care-package-select-container">
              <Field label="Package Name">
                <FilteredSelect
                  options={carePackage.map((cp) => ({
                    id: cp.care_package_id,
                    care_package_name: cp.care_package_name,
                    ...cp,
                  }))}
                  value={formData.carePackageId || ''}
                  onChange={(value) => {
                    handleCarePackageChange(value);
                  }}
                  getOptionLabel={(cp) => cp.care_package_name}
                  placeholder="Select a care package"
                  searchPlaceholder="Search care packages..."
                  data-testid="care-package-select"
                />
              </Field>
            </div>

            <Field label="Remarks">
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                className="w-full bg-white text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter remarks"
                rows={3}
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
                // Only apply readonly if service is from care package AND package is not customizable
                const isReadOnly = service.isFromCarePackage && !selectedCarePackage.care_package_customizable;

                return (
                  <div key={index} className="relative p-4 border border-gray-200 rounded-md space-y-4 bg-gray-50">
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-md"
                      disabled={formData.services.length === 1 || isReadOnly}
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>

                    <Field label="Service">
                      <select
                        value={service.serviceId || ''}
                        onChange={(e) => handleServiceChange(index, e.target.value)}
                        className={`w-full ${
                          isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                        } text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                        required
                        disabled={isReadOnly}
                      >
                        <option value="">Select a service</option>
                        {Object.entries(
                          services.reduce((acc, service) => {
                            const category = service.cs_service_categories?.service_category_name || 'Uncategorized';
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

                    <div className="grid grid-cols-4 gap-4">
                      <Field label="Custom Price">
                        <input
                          type="number"
                          value={service.customPrice}
                          onChange={(e) => handleCustomPriceChange(index, e.target.value)}
                          className={`w-full ${
                            isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                          } text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                          min="0"
                          step="0.01"
                          required
                          readOnly={isReadOnly}
                        />
                      </Field>

                      <Field label="Quantity">
                        <input
                          type="number"
                          value={service.quantity}
                          onChange={(e) => updateService(index, 'quantity', e.target.value)}
                          className={`w-full ${
                            isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                          } text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                          min="1"
                          required
                          readOnly={isReadOnly}
                        />
                      </Field>

                      <Field label="Discount (%)">
                        <input
                          type="number"
                          value={service.discount}
                          onChange={(e) => updateService(index, 'discount', e.target.value)}
                          className={`w-full ${
                            isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                          } text-gray-900 rounded-md p-2 border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                          min="0"
                          max="100"
                          required
                          readOnly={isReadOnly}
                        />
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

              <div className="flex w-full gap-4">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md flex justify-center items-center"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Member Package'}
                  <FilePlus2 className="h-4 w-4 ml-2 text-white" />
                </Button>

                {/* <Button
                  type="button"
                  onClick={handleSaveDraft}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-md flex justify-center items-center"
                  disabled={loading}
                >
                  {loading ? 'Saving Draft...' : 'Save as Draft'}
                  <SquarePen className="h-4 w-4 ml-2" />
                </Button> */}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MemberCarePackageForm;

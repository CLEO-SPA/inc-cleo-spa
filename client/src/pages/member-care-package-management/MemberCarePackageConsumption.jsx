import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/interceptors/axios';
import Navbar from '@/components/Navbar';
import { Field } from '@/components/ui/field';
import { LuPackage, LuUser, LuBadgeCheck } from 'react-icons/lu';
import ServiceConsumptionAccordion from '@/components/care-package-management/ServiceConsumptionAccordion';
import DateTimePicker from '@/components/DateTimePicker';

import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from '@/components/ui/dialog';

// for status color
const STATUS_STYLES = {
  Draft: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  Active: 'bg-green-500/10 text-green-500 border-green-500/20',
  Suspended: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  Invoice_Unpaid: 'bg-red-500/10 text-red-500 border-red-500/20',
  Invoice_Paid: 'bg-green-500/10 text-green-500 border-green-500/20',
  Expired: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  Inactive: 'bg-red-500/10 text-red-500 border-red-500/20',
  Archived: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const MemberCarePackageConsumption = () => {
  const { id } = useParams();
  const [packageDetails, setPackageDetails] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [consumptionQuantities, setConsumptionQuantities] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState({ title: '', message: '' });
  const [serviceDates, setServiceDates] = useState({});

  useEffect(() => {
    const fetchPackageDetails = async () => {
      try {
        const response = await api.get(`/mcp/get-mcp/${id}`);
        // console.log(response.data);

        setPackageDetails(response.data);
      } catch (err) {
        setError(err.message);
        setDialogContent({
          title: 'Error',
          message: err.message || 'Failed to fetch package details',
        });
        setIsDialogOpen(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackageDetails();
  }, [id]);

  const handleServiceSelection = (serviceId) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((id) => id !== serviceId));
      // remove the consumption quantity and date when deselecting
      const updatedQuantities = { ...consumptionQuantities };
      const updatedDates = { ...serviceDates };
      delete updatedQuantities[serviceId];
      delete updatedDates[serviceId];
      setConsumptionQuantities(updatedQuantities);
      setServiceDates(updatedDates);
    } else {
      setSelectedServices([...selectedServices, serviceId]);
      // initialize consumption quantity to -1 and date to current date/time when selecting
      setConsumptionQuantities({
        ...consumptionQuantities,
        [serviceId]: -1,
      });
      setServiceDates({
        ...serviceDates,
        [serviceId]: new Date(),
      });
    }
  };

  const handleQuantityChange = (serviceId, value) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue > 0) return; // only allow negative values

    setConsumptionQuantities({
      ...consumptionQuantities,
      [serviceId]: numValue,
    });
  };

  const handleDateTimeChange = (serviceId, dateTime) => {
    setServiceDates((prev) => ({
      ...prev,
      [serviceId]: dateTime,
    }));
  };

  const handleConsumption = async () => {
    try {
      const expandedServiceIds = [];
      const expandedServiceDates = {};

      selectedServices.forEach((serviceId) => {
        const quantity = Math.abs(consumptionQuantities[serviceId] || 1);
        const dateForService = serviceDates[serviceId];
        const currentService = packageDetails.cs_member_care_package_details.find(
          (s) => s.member_care_package_details_id === serviceId
        );

        // Add the original service ID
        expandedServiceIds.push(serviceId);
        expandedServiceDates[serviceId] = dateForService;

        // For additional sessions, find other instances of the same service
        if (quantity > 1) {
          const availableSameServices = packageDetails.cs_member_care_package_details.filter(
            (s) =>
              s.cs_service.service_name === currentService.cs_service.service_name &&
              s.member_care_package_details_id !== serviceId &&
              !expandedServiceIds.includes(s.member_care_package_details_id)
          );

          // Add as many services as needed up to the quantity
          for (let i = 1; i < quantity && i <= availableSameServices.length; i++) {
            const additionalService = availableSameServices[i - 1];
            expandedServiceIds.push(additionalService.member_care_package_details_id);
            expandedServiceDates[additionalService.member_care_package_details_id] = dateForService;
          }
        }
      });

      console.log({
        packageId: id,
        serviceIds: expandedServiceIds,
        serviceDates: expandedServiceDates,
      });

      await api.post('/mcp/c-mcp', {
        packageId: id,
        serviceIds: expandedServiceIds,
        serviceDates: expandedServiceDates,
      });

      const response = await api.get(`/mcp/get-mcp/${id}`);
      setPackageDetails(response.data);
      setSelectedServices([]);
      setConsumptionQuantities({});
      setServiceDates({}); // Clear the dates
      setDialogContent({
        title: 'Success',
        message: 'Services consumed successfully',
      });
      setIsDialogOpen(true);
    } catch (err) {
      setDialogContent({
        title: 'Error',
        message: err.message || 'Failed to process consumption',
      });
      setIsDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8 flex items-center justify-center">
        <div className="text-white text-lg font-medium">Loading package details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Package Consumption Management</h1>
          <p className="text-gray-600 text-lg">Manage and track service consumption for member packages</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center text-gray-900 gap-3">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <LuPackage className="w-5 h-5" />
                </div>
                Package Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-900">
              <div>
                <span className="text-gray-600 block mb-1">Package Name</span>
                <span className="font-medium">{packageDetails?.care_package_name}</span>
              </div>
              <div>
                <span className="text-gray-600 block mb-1">Total Amount</span>
                <span className="font-medium">${packageDetails?.member_care_package_total_amount}</span>
              </div>
              <div>
                <span className="text-gray-600 block mb-1">Status</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm border ${
                    STATUS_STYLES[packageDetails?.cs_status?.status_name] || STATUS_STYLES.Inactive
                  }`}
                >
                  {packageDetails?.cs_status?.status_name}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center text-gray-900 gap-3">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <LuUser className="w-5 h-5" />
                </div>
                Member Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-900">
              <div>
                <span className="text-gray-600 block mb-1">Name</span>
                <span className="font-medium">{packageDetails?.cs_members?.member_name}</span>
              </div>
              <div>
                <span className="text-gray-600 block mb-1">Email</span>
                <span className="font-medium">{packageDetails?.cs_members?.member_email}</span>
              </div>
              <div>
                <span className="text-gray-600 block mb-1">Contact</span>
                <span className="font-medium">{packageDetails?.cs_members?.member_contact}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Available Services</h2>
          </div>

          <Card className="bg-white border-gray-200">
            <CardContent className="p-6">
              {!packageDetails?.cs_member_care_package_details?.length ? (
                <div className="text-center">
                  <p className="text-gray-500">No services available in this package</p>
                </div>
              ) : packageDetails.cs_member_care_package_details.every(
                  (service) => service.member_care_package_details_quantity === 0
                ) ? (
                <div className="text-center">
                  <p className="text-gray-500">All services have been consumed</p>
                </div>
              ) : (
                <>
                  <ServiceConsumptionAccordion
                    services={packageDetails.cs_member_care_package_details}
                    selectedServices={selectedServices}
                    onServiceSelect={handleServiceSelection}
                  />
                  {packageDetails.cs_member_care_package_details.some(
                    (service) => service.member_care_package_details_quantity === 0
                  ) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">* Services with 0 sessions remaining are not selectable</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {selectedServices.length > 0 && (
            <Card className="bg-white border-gray-200 mt-8">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-900">Selected Services for Consumption</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-4 text-gray-600">Service Name</th>
                        <th className="text-left p-4 text-gray-600">Select Date & Time</th>
                        <th className="text-left p-4 text-gray-600">Price/Session</th>
                        <th className="text-left p-4 text-gray-600">Sessions Used</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedServices.map((serviceId) => {
                        const service = packageDetails.cs_member_care_package_details.find(
                          (s) => s.member_care_package_details_id === serviceId
                        );
                        return (
                          <tr key={serviceId} className="border-b border-gray-200">
                            <td className="p-4 text-gray-900">{service.cs_service?.service_name}</td>
                            <td className="p-4 text-gray-900">
                              <DateTimePicker
                                selectedDateTime={serviceDates[serviceId] || null}
                                onDateTimeSelect={(dateTime) => handleDateTimeChange(serviceId, dateTime)}
                              />
                            </td>
                            <td className="p-4 text-gray-900">${service.member_care_package_details_price}</td>
                            <td className="p-4">
                              <input
                                type="number"
                                value={consumptionQuantities[serviceId] || ''}
                                onChange={(e) => handleQuantityChange(serviceId, e.target.value)}
                                max="0"
                                className="w-24 bg-white border border-gray-300 rounded px-3 py-2 text-gray-900"
                                placeholder="-1"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded text-sm text-gray-600">
                  * Enter negative values to indicate sessions to consume (e.g., -1 to consume one session)
                </div>
              </CardContent>
            </Card>
          )}
          <div className="flex items-center justify-end mb-6">
            <Button
              className="bg-blue-600 hover:bg-blue-700 px-6 text-white"
              onClick={handleConsumption}
              disabled={selectedServices.length === 0}
            >
              Process Selected
            </Button>
          </div>
        </div>

        <DialogRoot open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogContent.title}</DialogTitle>
              <DialogCloseTrigger />
            </DialogHeader>
            <DialogBody>
              <p>{dialogContent.message}</p>
            </DialogBody>
            <DialogFooter>
              <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>
      </div>
    </div>
  );
};

export default MemberCarePackageConsumption;

import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from 'react-hook-form';
import { useNavigate, useParams } from "react-router-dom";
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DatePicker from "@/components/date-picker";
import { AppSidebar } from '@/components/app-sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import { useSimulationStore } from "@/stores/useSimulationStore";

export default function UpdateService() {
  // Get Service Id from Params
  const { service_id } = useParams();

  // Get Data
  const [service, setService] = useState(null);
  const [categories, setCategories] = useState([]);
  const methods = useForm({});
  const { watch, reset } = methods;
  const isSimulationActive = useSimulationStore((state) => state.isSimulationActive)
  const simulationStartDate = useSimulationStore((state) => state.simulationStartDate);

  // For Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // for navigation
  const navigate = useNavigate();

  // For getting form data
  const [selectedCategory, setSelectedCategory] = useState(null);
  const createdBy = watch('created_by');
  const updatedBy = watch('updated_by');
  const [createdAt, setCreatedAt] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  // For form data
  const [formData, setFormData] = useState({
        service_name: "",
        service_description: "",
        service_remarks: "",
        service_duration: "",
        service_price: "",
        service_category_id: "",
        created_at: "",
        created_by: "",
        updated_at: new Date(),
        updated_by: ""
      });

  const getService = async (id) => {
    try {
      const response = await api.get(`/service/${id}`);
      console.log(response.data);
      setService(response.data);
    } catch (err) {
      console.error("Error fetching service:" + err);
    }
  }

  const getCategories = async () => {
    try {
      const response = await api.get('/service/service-cat');
      if (response.status === 200) {
        setCategories(response.data);
      } else {
        console.error('Failed to fetch service categories:', response.statusText);
      }
    } catch (err) {
      console.error('Error fetching service categories:', err);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form Submitted!")
  };

  useEffect(() => {
    // Test data
    try {
      getService(service_id);
      getCategories();
    } catch (err) {
      console.error('Error fetching data:' + err);
    }
  }, [service_id])

    useEffect(() => {
    // Fixed: Add null check before accessing service properties
    if (service) {
      try {
        setFormData({
          service_name: service.service_name || '',
          service_description: service.service_description || '',
          service_remarks: service.service_remarks || '',
          service_duration: service.service_duration || '',
          service_price: service.service_price || '',
          service_category_id: service.service_category_id || '',
          created_at: service.created_at || '',
          created_by: service.created_by || '',
          updated_at: isSimulationActive ? new Date(simulationStartDate) : new Date(),
          updated_by: ""
        });
        setSelectedCategory(service.service_category_id);
        setCreatedAt(service.created_at ? new Date(service.created_at) : null);
        setUpdatedAt(formData.updated_at);
        
        // Reset the form with the service data for EmployeeSelect components
        reset({
          created_by: service.created_by
        });
      } catch (err) {
        console.error('Error setting form data:' + err);
      }
    }
  }, [service, reset])

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-3'>

              {/* modal */}
              {modalOpen && (
                <div className="fixed inset-0 flex justify-center items-center bg-opacity-80 z-50">
                  <div className="bg-white border p-6 rounded-md shadow-lg w-full max-w-lg">
                    <div className="flex justify-between items-center">
                      {errorMsg ? (
                        <h3 className="text-xl font-semibold">Error</h3>
                      ) :
                        (
                          <h3 className="text-xl font-semibold">Update Service Page</h3>
                        )}
                      <button
                        onClick={() => { setModalOpen(false); setService(null) }}
                        className="text-xl"
                        aria-label="Close"
                      >
                        X
                      </button>
                    </div>
                    <div className="mt-4">
                      {errorMsg ? (
                        <p className="text-xl text-red-500">{errorMsg}</p>
                      ) : (
                        <>
                          <p className="text-xl text-green-600">Service was updated successfully!</p>
                          <p>ID: {service.id}</p>
                          <p>Name: {service.service_name}</p>
                          <p>Category: {
                            categories.find(cat => cat.id === service.service_category_id)?.service_category_name || 'Other'
                          }</p>
                          <p>Price: ${service.service_price}</p>
                        </>
                      )}
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      {errorMsg ? "" : (
                        <Button
                          onClick={() => { navigate('/manage-service'); setService(null) }}
                          className="bg-blue-600 rounded-md hover:bg-blue-500"
                        >
                          View Services
                        </Button>
                      )}
                      <Button
                        onClick={() => { setModalOpen(false); setService(null) }}
                        className="text-white py-2 px-4 rounded-md hover:bg-gray-700"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Card className={"w-full px-4"}>
                <CardHeader>
                  <CardTitle><h2 className="text-2xl font-bold">Edit Service Details</h2></CardTitle>
                </CardHeader>
                <CardContent>
                  <FormProvider {...methods}>
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="grid auto-rows-min gap-3 lg:grid-cols-2">
                        {/* Date of Creation */}
                        <div>
                          <label className="block text-md font-medium">Date of Creation*</label>
                          <DatePicker
                            value={createdAt}
                            onChange={setCreatedAt}
                            required />
                        </div>

                        {/* Created By */}
                        <div>
                          <label className="block text-md font-medium">Created By*</label>
                          <EmployeeSelect name='created_by' label='' rules={{ required: 'Created_by is required' }} />
                        </div>

                        <div>
                          <label className="block text-md font-medium">Last Updated at*</label>
                          <DatePicker
                            value={updatedAt}
                            // onChange={}
                            required />
                        </div>

                        {/* Updated By */}
                        <div>
                          <label className="block text-md font-medium">Updated By*</label>
                          <EmployeeSelect
                            name='updated_by'
                            label=''
                            rules={{ required: 'Updated_by is required' }} />
                        </div>

                        {/* Service Name */}
                        <div>
                          <label className="block text-md font-medium">Service Name*</label>
                          <Input
                            type="text"
                            name="service_name"
                            value={formData.service_name}
                            onChange={handleChange}
                            className="w-[250px] p-2 border rounded-md"
                            placeholder="Enter service name"
                            required
                          />
                        </div>

                        {/* Service Category */}
                        <div>
                          <label className="block text-md font-medium">Service Category*</label>
                          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.service_category_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Unit Price */}
                        <div>
                          <label className="block text-md font-medium">Unit Price*</label>
                          <input
                            type="number"
                            name="service_price"
                            value={formData.service_price}
                            onChange={handleChange}
                            className="w-40 px-2 py-1 border rounded-md"
                            placeholder="100"
                            required
                          /> SGD
                        </div>

                        {/* Duration */}
                        <div>
                          <label className="block text-md font-medium">Duration*</label>
                          <input
                            type="number"
                            name="service_duration"
                            value={formData.service_duration}
                            onChange={handleChange}
                            className="w-40 px-2 py-1 border rounded-md"
                            placeholder="60"
                            required
                          /> Mins
                        </div>

                      </div>
                      {/* Service Description */}
                      <div>
                        <label className="block text-md font-medium">Service Description</label>
                        <textarea
                          name="service_description"
                          value={formData.service_description}
                          onChange={handleChange}
                          className="w-full p-2 border rounded-md"
                          placeholder="Enter service description"
                        />
                      </div>

                      {/* Remarks */}
                      <div>
                        <label className="block text-md font-medium ">Remarks</label>
                        <textarea
                          name="remarks"
                          value={formData.service_remarks}
                          onChange={handleChange}
                          className="w-full p-2 border rounded-md"
                          placeholder="Enter remarks"
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-center space-x-4">
                        <Button type="submit" className="bg-blue-600 rounded-md hover:bg-blue-500">
                          Save Changes
                        </Button>
                        <Button onClick={() => navigate(-1)} className="rounded-md hover:bg-gray-500">
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </FormProvider>

                </CardContent>
              </Card>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

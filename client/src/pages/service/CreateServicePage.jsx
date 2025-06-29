import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from 'react-hook-form';
import { useNavigate } from "react-router-dom";
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from '@/components/ui/switch';
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
import { useAuth } from '@/context/AuthContext';

export default function CreateService() {
  //Role-based access
  const { user } = useAuth();
  const allowedRoles = ['super_admin', 'data_admin'];

  // Loading
  const [loading, setLoading] = useState(false);
  // Modal
  // Show the result of service creation
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Categories for dropdown
  const [categories, setCategories] = useState([]);

  // For EmployeeSelect
  const methods = useForm();
  const { watch, reset } = methods;

  // For form data
  const [formData, setFormData] = useState({
    service_name: "",
    service_description: "",
    service_remarks: "",
    service_duration: "0",
    service_price: "",
    service_is_enabled: true,
    service_category_id: "",
    created_at: null,
    created_by: ""
  });
  const createdBy = watch('created_by');
  const [selectedCategory, setSelectedCategory] = useState(formData.service_category_id);
  const [createdAt, setCreatedAt] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(formData.service_is_enabled)
  const [service, setService] = useState();;

  const navigate = useNavigate();

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
    setLoading(true);
    try {
      const response = await api.post(`/service/create-service`, formData, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (response.status === 201) {
        setErrorMsg("");
        setService(response.data.service);
        setFormData({
          service_name: "",
          service_description: "",
          service_remarks: "",
          service_duration: "0",
          service_price: "",
          service_is_enabled: true,
          service_category_id: "",
          created_at: null,
          created_by: ""
        })
        setCreatedAt(null);
        setSelectedCategory("");
        setSelectedStatus(true);
        reset();
        setModalOpen(true);
      }
    } catch (err) {
      console.error('Error creating service:' + err);
      setErrorMsg(err.response.data.message);
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      getCategories();
    } catch (err) {
      console.error('Error fetching data:' + err);
    }
  }, [])

  // Redirect to 404 page if user does not have the right role
  useEffect(() => {
    if (!user || !allowedRoles.includes(user.role)) {
      navigate('*'); 
    }
  }, [user, navigate]);

  useEffect(() => {
    try {
      setFormData(prevFormData => ({
        ...prevFormData,
        service_category_id: selectedCategory,
        created_by: createdBy || "",
        created_at: createdAt,
        service_is_enabled: selectedStatus
      }));
    } catch (err) {
      console.error('Error updating form data:', err);
    }
  }, [selectedCategory, createdBy, createdAt, selectedStatus]);

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
                          <h3 className="text-xl font-semibold">Create Service Page</h3>
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
                          <p className="text-xl text-green-600">Service was created successfully!</p>
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
                {loading ? (
                  <CardContent>
                    <div className="flex justify-center items-center h-full">
                      <span className="text-xl text-gray-500">Loading...</span>
                    </div>
                  </CardContent>
                ) : (
                  <>
                    <CardHeader>
                      <CardTitle><h2 className="text-2xl font-bold">Create a Service</h2></CardTitle>
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
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <div className="max-h-48 overflow-y-auto">
                                    {categories.map((category) => (
                                      <SelectItem key={category.id} value={category.id}>
                                        {category.service_category_name}
                                      </SelectItem>
                                    ))}
                                  </div>
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

                            {/* Status */}
                            <div className="flex my-2 space-x-3">
                              <label className="block text-md font-medium ">Enabled</label>
                              <Switch checked={selectedStatus} onCheckedChange={setSelectedStatus} required />
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
                              name="service_remarks"
                              value={formData.service_remarks}
                              onChange={handleChange}
                              className="w-full p-2 border rounded-md"
                              placeholder="Enter remarks"
                            />
                          </div>

                          {/* Submit Button */}
                          <div className="flex justify-center space-x-4">
                            <Button type="submit" className="bg-blue-600 rounded-md hover:bg-blue-500">
                              Create Service
                            </Button>
                            <Button onClick={() => navigate(-1)} className="rounded-md hover:bg-gray-500">
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </FormProvider>

                    </CardContent>
                  </>
                )}
              </Card>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from '@/components/ui/button';
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

export default function CreateService() {
  // For select categories
  const [selectedCategory, setSelectedCategory] = useState('0');

  // For form data
  const [formData, setFormData] = useState({
    service_name: "",
    service_description: "",
    remarks: "",
    service_duration: "0",
    service_price: "",
    service_is_enabled: true,
    service_category_id: "",
    created_at: new Date(),
    created_by: ""
  });

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
    console.log("Form Submitted!")
  };

  useEffect(()=>{
    try {
      getCategories();
    } catch (err) {
      console.error('Error fetching data:' + err);
    }
  },[])

  return (
    <div className='[--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader />
        <div className='flex flex-1'>
          <AppSidebar />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-3'>
              <Card className={"w-full px-4"}>
                <CardHeader>
                  <CardTitle><h2 className="text-2xl font-bold">Create a Service</h2></CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid auto-rows-min gap-3 lg:grid-cols-2">
                      {/* Date of Creation */}
                      <div>
                        <label className="block text-md font-medium">Date of Creation*</label>
                        <DatePicker required />
                      </div>

                      {/* Created By */}
                      <div>
                        <label className="block text-md font-medium">Created By*</label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Employee" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Employee 1</SelectItem>
                            <SelectItem value="2">Employee 2</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Face Care</SelectItem>
                            <SelectItem value="2">Body Care</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Unit Price */}
                      <div>
                        <label className="block text-md font-medium">Unit Price*</label>
                        <input
                          type="number"
                          name="service_default_price"
                          value={formData.service_default_price}
                          onChange={handleChange}
                          className="w-40 p-2 border rounded-md"
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
                          className="w-40 p-2 border rounded-md"
                          placeholder="60"
                          required
                        /> Mins
                      </div>

                      {/* Status */}
                      <div className="flex my-2 space-x-3">
                        <label className="block text-md font-medium ">Enabled</label>
                        <Switch checked={formData.service_is_enabled} required />
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
                        value={formData.remarks}
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
                </CardContent>

              </Card>

            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

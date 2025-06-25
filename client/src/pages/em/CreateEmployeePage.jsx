"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { DateTimeSelector } from "@/components/custom/DateTimeSelector";
import PositionSelect from "@/components/ui/forms/PositionSelect";
import api from "@/services/api";

const getDefaultDateTime = () => {
  const now = new Date();
  // Set to 10:00 AM in local timezone
  now.setHours(10, 0, 0, 0);
  
  // Format for datetime-local input (YYYY-MM-DDTHH:MM)
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
export default function CreateEmployeePage() {
  const methods = useForm({
    defaultValues: {
      employee_name: "",
      employee_email: "",
      employee_contact: "",
      employee_code: "",
      role_name: "",
      position_ids: [],
      created_at: getDefaultDateTime(),
      updated_at: getDefaultDateTime(),
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = methods;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/employee/create-invite", data);
      setSuccess("Employee created and invited successfully!");
      setTimeout(() => {
        window.location.href = "/employees";
      }, 1500);
    } catch (err) {
      const apiMessage =
        err?.response?.data?.message || "Failed to create employee";
      setError(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="[--header-height:calc(theme(spacing.14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-col gap-4 p-4 max-w-2xl">
              <h1 className="text-2xl font-bold">Add New Employee</h1>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert variant="success">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Employee Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Name */}
                      <div>
                        <Label htmlFor="employee_name" className="mb-2 block">Full Name *</Label>
                        <Input
                          id="employee_name"
                          {...register("employee_name", { required: true })}
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <Label htmlFor="employee_email" className="mb-2 block">Email *</Label>
                        <Input
                          id="employee_email"
                          type="email"
                          {...register("employee_email", { required: true })}
                        />
                      </div>

                      {/* Contact */}
                      <div>
                        <Label htmlFor="employee_contact" className="mb-2 block">Contact *</Label>
                        <Input
                          id="employee_contact"
                          {...register("employee_contact", { required: true })}
                        />
                      </div>

                      {/* Code */}
                      <div>
                        <Label htmlFor="employee_code" className="mb-2 block">Employee Code *</Label>
                        <Input
                          id="employee_code"
                          {...register("employee_code", { required: true })}
                        />
                      </div>

                      {/* Role */}
                      <div>
                        <Label htmlFor="role_name" className="mb-2 block">Role *</Label>
                        <Input
                          id="role_name"
                          {...register("role_name", { required: true })}
                        />
                      </div>

                      {/* PositionSelect */}
                      <div>
                        <Label className="mb-3 block">Assign Positions</Label>
                        <PositionSelect name="position_ids" isMulti />
                      </div>

                      {/* Created At */}
                      <div>
                        <Label htmlFor="created_at" className="mb-2 block">Creation Time</Label>
                        <DateTimeSelector
                          value={getValues("created_at")}
                          onChange={(val) => setValue("created_at", val)}
                        />
                      </div>

                    </CardContent>
                  </Card>
                </form>
              </FormProvider>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
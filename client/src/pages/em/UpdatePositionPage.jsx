"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { AppSidebar }          from "@/components/app-sidebar";
import { SiteHeader }          from "@/components/site-header";
import { SidebarInset,
         SidebarProvider }     from "@/components/ui/sidebar";

import { Card,
         CardContent,
         CardHeader,
         CardTitle }           from "@/components/ui/card";
import { Button }              from "@/components/ui/button";
import { Input }               from "@/components/ui/input";
import { Textarea }            from "@/components/ui/textarea";
import { Label }               from "@/components/ui/label";
import { Alert,
         AlertDescription }    from "@/components/ui/alert";
import { Switch }              from "@/components/ui/switch";
import { DateTimeSelector }    from "@/components/custom/DateTimeSelector";

import { AlertCircle,
         CheckCircle,
         Loader2 }             from "lucide-react";

import api from "@/services/api";

/* --------------------------------------------------------------------
   Helpers
-------------------------------------------------------------------- */
const toLocalInput = (isoStr) => {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  // compensate for TZ so <input type="datetime-local"> shows the right moment
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
};

const todayAt = (hour = 10) => {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

/* --------------------------------------------------------------------
   Component
-------------------------------------------------------------------- */
export default function UpdatePositionPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();

  const [formData, setFormData] = useState({
    position_name:        "",
    position_description: "",
    position_is_active:   true,
    position_created_at:  "",
    position_updated_at:  "",
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  /* --------------- Fetch position record once ----------------------- */
  useEffect(() => {
    const fetchPosition = async () => {
      try {
        const res = await api.get(`/position/${id}`);
        const {
          position_name,
          position_description,
          position_is_active,
          created_at,              // from backend
        } = res.data;

        setFormData({
          position_name,
          position_description,
          position_is_active,
          position_created_at: toLocalInput(created_at),
          position_updated_at: todayAt(10),         // default = today 10 AM
        });
      } catch {
        setError("Failed to load position");
      }
    };

    fetchPosition();
  }, [id]);

  /* --------------- Handlers ---------------------------------------- */
  const handleInputChange = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);

    try {
      await api.put(`/position/${id}`, {
        position_name:        formData.position_name,
        position_description: formData.position_description,
        position_is_active:   formData.position_is_active,
        position_updated_at:  formData.position_updated_at,
      });

      setSuccess("Position updated successfully!");
      setTimeout(() => navigate("/positions"), 1500);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error   ||
        err.message                  ||
        "Failed to update position";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* --------------- UI ---------------------------------------------- */
  return (
    <div className="[--header-height:calc(theme(spacing.14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />

        <div className="flex flex-1">
          <AppSidebar />

          <SidebarInset>
            <div className="flex flex-col gap-4 p-4 max-w-2xl">
              <h1 className="text-2xl font-bold">Edit Position</h1>

              {/* --- Alerts ------------------------------------------------ */}
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

              {/* --- Form card -------------------------------------------- */}
              <Card>
                <CardHeader>
                  <CardTitle>Position Details</CardTitle>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div>
                      <Label htmlFor="position_name" className="mb-2">
                        Position Name *
                      </Label>
                      <Input
                        id="position_name"
                        value={formData.position_name}
                        onChange={(e) =>
                          handleInputChange("position_name", e.target.value)
                        }
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <Label htmlFor="position_description" className="mb-2">
                        Description *
                      </Label>
                      <Textarea
                        id="position_description"
                        value={formData.position_description}
                        onChange={(e) =>
                          handleInputChange("position_description", e.target.value)
                        }
                        required
                      />
                    </div>

                    {/* Active / inactive */}
                    <div className="flex items-center gap-4">
                      <Label htmlFor="position_is_active">Status</Label>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="position_is_active"
                          checked={formData.position_is_active}
                          onCheckedChange={(checked) =>
                            handleInputChange("position_is_active", checked)
                          }
                        />
                        <span>
                          {formData.position_is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {/* Creation timestamp */}
                    <div>
                      <Label className="mb-2 block">Creation Date &amp; Time</Label>
                      <DateTimeSelector
                        value={formData.position_created_at}
                        onChange={(val) =>
                          handleInputChange("position_created_at", val)
                        }
                      />
                    </div>

                    {/* Update timestamp */}
                    <div>
                      <Label className="mb-2 block">Update Date &amp; Time</Label>
                      <DateTimeSelector
                        value={formData.position_updated_at}
                        onChange={(val) =>
                          handleInputChange("position_updated_at", val)
                        }
                      />
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end">
                      <Button type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          "Update Position"
                        )}
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
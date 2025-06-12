"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { DateTimeSelector } from "@/components/custom/DateTimeSelector";
import api from "@/services/api";

// Default date-time: today 10:00
const getDefaultDateTime = () => {
    const now = new Date();
    now.setHours(10, 0, 0, 0);
    return now.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
};

export default function CreatePositionPage() {
    const [formData, setFormData] = useState({
        position_name: "",
        position_description: "",
        position_is_active: true,
        position_created_at: getDefaultDateTime(),
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleInputChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const response = await api.post("/position/create", formData);

            if (!response || !response.data) {
                throw new Error("Unexpected server response");
            }

            setSuccess("Position created successfully!");
            setTimeout(() => {
                window.location.href = "/positions";
            }, 1500);
        } catch (err) {
            setError(err.message || "Failed to create position");
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
                            <h1 className="text-2xl font-bold">Add New Position</h1>

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

                            <Card>
                                <CardHeader>
                                    <CardTitle>Position Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Position Name */}
                                        <div>
                                            <Label htmlFor="position_name">Position Name *</Label>
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
                                            <Label htmlFor="position_description">
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

                                        {/* Status: Label + Active/Inactive + Switch */}
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
                                                <span>{formData.position_is_active ? "Active" : "Inactive"}</span>
                                            </div>
                                        </div>


                                        {/* Creation Date & Time */}
                                        <DateTimeSelector
                                            value={formData.position_created_at}
                                            onChange={(val) =>
                                                handleInputChange("position_created_at", val)
                                            }
                                        />

                                        {/* Submit Button */}
                                        <div className="flex justify-end">
                                            <Button type="submit" disabled={loading}>
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    "Create Position"
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

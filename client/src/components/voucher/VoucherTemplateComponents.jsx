// components/voucher/VoucherTemplateComponents.jsx
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit3, Loader2 } from 'lucide-react';
import ServiceSelect from '@/components/ui/forms/ServiceSelect';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
// ServiceRow Component

export const ServiceRow = ({
    service,
    index,
    editingIndex,
    onEdit,
    onFieldChange,
    onRemove
}) => {
    const isEditing = editingIndex === index;

    // Helper function to check if a value is a valid number
    const isValidNumber = (value) => {
        return value !== null && value !== undefined && value !== '' && !isNaN(Number(value));
    };

    // Helper function to format currency
    const formatCurrency = (value) => {
        return isValidNumber(value) ? `$${Number(value).toFixed(2)}` : 'N/A';
    };

    // Helper function to format number
    const formatNumber = (value) => {
        return isValidNumber(value) ? Number(value).toFixed(2) : 'N/A';
    };

    return (
        <tr className="border-b border-gray-200 hover:bg-gray-50">
            <td className="px-4 py-3 font-medium">
                {isEditing ? (
                    <Input
                        type="text"
                        value={service.service_name}
                        onChange={(e) => onFieldChange(index, 'service_name', e.target.value)}
                        className="w-32"
                        placeholder="Service name"
                    />
                ) : (
                    service.service_name
                )}
            </td>
            <td className="px-4 py-3">
                {formatCurrency(service.original_price)}
            </td>
            <td className="px-4 py-3">
                {isEditing ? (
                    <Input
                        type="number"
                        step="0.01"
                        value={service.custom_price}
                        onChange={(e) =>
                            onFieldChange(index, 'custom_price', parseFloat(e.target.value) || 0)
                        }
                        className="w-24"
                    />
                ) : (
                    formatCurrency(service.custom_price)
                )}
            </td>

            <td className="px-4 py-3">
                {isEditing ? (
                    <Input
                        type="number"
                        step="0.01"
                        value={service.discount}
                        onChange={(e) => onFieldChange(index, 'discount', parseFloat(e.target.value) || 0)}
                        className="w-20"
                    />
                ) : (
                    formatNumber(service.discount)
                )}
            </td>
            <td className="px-4 py-3">
                {formatCurrency(service.final_price)}
            </td>
            <td className="px-4 py-3">
                {isEditing ? (
                    <div className="flex items-center gap-1">
                        <Input
                            type="number"
                            step="1"
                            min="0"
                            value={service.duration}
                            onChange={(e) => onFieldChange(index, 'duration', parseInt(e.target.value) || 0)}
                            className="w-16"
                        />
                        <span className="text-sm text-gray-500">min</span>
                    </div>
                ) : (
                    isValidNumber(service.duration) ? `${service.duration} min` : 'N/A'
                )}
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(index)}
                        className="p-1"
                    >
                        <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(index)}
                        className="text-red-600 hover:text-red-700 p-1"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </td>
        </tr>
    );
};

// ServicesTable Component
export const ServicesTable = ({
    services,
    editingIndex,
    onEdit,
    onFieldChange,
    onRemove
}) => {
    if (services.length === 0) return null;

    return (
        <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Service Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Original Price</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Custom Price</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Discount </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Final Price</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Duration</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {services.map((service, index) => (
                        <ServiceRow
                            key={`${service.service_id}-${index}`}
                            service={service}
                            index={index}
                            editingIndex={editingIndex}
                            onEdit={onEdit}
                            onFieldChange={onFieldChange}
                            onRemove={onRemove}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// AddServiceForm Component
export const AddServiceForm = ({
    serviceForm,
    serviceOptions,
    servicesLoading,
    servicesError,
    serviceSelectKey,
    onServiceSelect,
    onFieldChange,
    onAddService,
    onRetryServices
}) => (
    <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-4">Add Service</h4>

        {servicesError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-red-800 text-sm">Error loading services: {servicesError}</p>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onRetryServices}
                    className="mt-2"
                >
                    Retry Loading Services
                </Button>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
                {servicesLoading ? (
                    <div className="flex items-center gap-2 p-2 border rounded bg-white">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-500">Loading services...</span>
                    </div>
                ) : (
                    <ServiceSelect
                        key={serviceSelectKey}
                        name="service_id"
                        onSelectFullDetails={onServiceSelect}
                        disabled={servicesError}
                        services={serviceOptions}
                    />
                )}
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Original Price</Label>
                <Input
                    type="number"
                    step="0.01"
                    value={serviceForm.original_price}
                    readOnly
                    className="bg-gray-100"
                    placeholder="0.00"
                />
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Custom Price</Label>
                <Input
                    type="number"
                    step="0.01"
                    value={serviceForm.custom_price}
                    onChange={(e) => onFieldChange('custom_price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                />
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Discount 打折 </Label>
                <Input
                    type="number"
                    step="0.01"
                    value={serviceForm.discount}
                    onChange={(e) => onFieldChange('discount', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Final Price</Label>
                <Input
                    type="number"
                    step="0.01"
                    value={serviceForm.final_price}
                    readOnly
                    className="bg-gray-100"
                />
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Duration (min)</Label>
                <Input
                    type="number"
                    value={serviceForm.duration}
                    onChange={(e) => onFieldChange('duration', parseFloat(e.target.value) || 0)}
                />
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Service Name</Label>
                <Input
                    value={serviceForm.service_name}
                    placeholder="Selected service name"
                    onChange={(e) => onFieldChange('service_name', e.target.value)}

                />
            </div>
        </div>

        <div className="flex justify-end mt-4">
            <Button
                type="button"
                onClick={onAddService}
                className="flex items-center gap-2"
                disabled={!serviceForm.service_id || servicesLoading}
            >
                <Plus className="h-4 w-4" />
                Add Service
            </Button>
        </div>
    </div>
);

// TemplateInfoForm Component
export const TemplateInfoForm = ({
    register,
    errors,
    mainFormData,
    onFieldChange
}) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <div className="space-y-2">
            <Label htmlFor="created_at" className="text-sm font-medium text-gray-700">
                Creation Date & Time *
            </Label>
            <Input
                id="created_at"
                type="datetime-local"
                {...register("created_at", { required: "Creation datetime is required" })}
                onChange={(e) => onFieldChange('created_at', e.target.value)}
                className={errors.created_at ? "border-red-500" : ""}
            />
            {errors.created_at && (
                <p className="text-red-500 text-xs">{errors.created_at.message}</p>
            )}
        </div>

        <div className="space-y-2">
            <Label htmlFor="voucher_template_name" className="text-sm font-medium text-gray-700">
                Template Name *
            </Label>
            <Input
                id="voucher_template_name"
                placeholder="Enter template name"
                {...register("voucher_template_name", { required: "Template name is required" })}
                onChange={(e) => onFieldChange('voucher_template_name', e.target.value)}
                className={errors.voucher_template_name ? "border-red-500" : ""}
            />
            {errors.voucher_template_name && (
                <p className="text-red-500 text-xs">{errors.voucher_template_name.message}</p>
            )}
        </div>

        <div className="space-y-2">
            <Label htmlFor="default_starting_balance" className="text-sm font-medium text-gray-700">
                Starting Balance
            </Label>
            <Input
                id="default_starting_balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("default_starting_balance", { valueAsNumber: true })}
                onChange={(e) => onFieldChange('default_starting_balance', parseFloat(e.target.value) || 0)}
            />
        </div>

        <div className="space-y-2">
            <Label htmlFor="default_free_of_charge" className="text-sm font-medium text-gray-700">
                Free of Charge Amount
            </Label>
            <Input
                id="default_free_of_charge"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("default_free_of_charge", { valueAsNumber: true })}
                onChange={(e) => onFieldChange('default_free_of_charge', parseFloat(e.target.value) || 0)}
            />
        </div>

        <div className="space-y-2">
            <Label htmlFor="default_total_price" className="text-sm font-medium text-gray-700">
                Total Price
            </Label>
            <Input
                id="default_total_price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={mainFormData.default_total_price}
                readOnly
                className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">
                Automatically calculated as: Starting Balance minus Free of Charge amount
            </p>
        </div>
    </div>
);

// SuccessDialog Component
export const SuccessDialog = ({
    isOpen,
    onClose,
    onGoToTemplates,
    createdTemplate,
    mainFormData,
    isUpdate = false, // default to false

}) => {

    const formatMoney = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-green-600">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        {isUpdate ? 'Voucher Template Updated Successfully!' : 'Voucher Template Created Successfully!'}
                    </DialogTitle>

                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-gray-600 mb-4">
                        The voucher template "{createdTemplate?.template.voucher_template_name}" has been {isUpdate ? 'updated' : 'created'} successfully.
                    </p>

                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Template Name:</span>
                            <span className="font-medium text-gray-900">
                                {createdTemplate?.template.voucher_template_name}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Starting Balance:</span>
                            <span className="font-medium text-gray-900">
                                ${formatMoney(createdTemplate?.template.default_starting_balance ?? mainFormData.default_starting_balance)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Free of Charge:</span>
                            <span className="font-medium text-gray-900">
                                ${formatMoney(createdTemplate?.template.default_free_of_charge ?? mainFormData.default_free_of_charge)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm border-t pt-2">
                            <span className="text-gray-600 font-medium">Total Price:</span>
                            <span className="font-semibold text-gray-900">
                                ${formatMoney(createdTemplate?.template.default_total_price ?? mainFormData.default_total_price)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Services Count:</span>
                            <span className="font-medium text-gray-900">
                                {createdTemplate?.details?.length ?? mainFormData.details.length}
                            </span>
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Create Another Template
                    </Button>
                    <Button onClick={onGoToTemplates} className="bg-blue-600 hover:bg-blue-700">
                        View All Templates
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

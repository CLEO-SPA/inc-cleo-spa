// components/voucher/CreateMemberVoucherForm.jsx
import { useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';
import EmployeeSelect from '@/components/ui/forms/EmployeeSelect';
import ServiceSelect from '@/components/ui/forms/ServiceSelect';
import VoucherTemplateSelect from '@/components/ui/forms/VoucherTemplateSelect';
import useMemberVoucherFormStore  from '@/stores/MemberVoucher/useMemberVoucherFormStore';
import useTransactionCartStore from '@/stores/useTransactionCartStore';

const CreateMemberVoucherForm = () => {
    // Store state
    const {
        bypassTemplate,
        selectedTemplate,
        memberVoucherDetails,
        formData,
        setBypassTemplate,
        setSelectedTemplate,
        setFormData,
        addMemberVoucherDetail,
        updateMemberVoucherDetail,
        removeMemberVoucherDetail,
        addToCart,
        reset
    } = useMemberVoucherFormStore();

    const { selectedMember } = useTransactionCartStore();

    // Form configuration
    const methods = useForm({
        defaultValues: formData,
        mode: 'onChange'
    });

    const { register, handleSubmit, watch, setValue, formState: { errors }, reset: resetForm } = methods;

    // Watch specific fields instead of all values to prevent unnecessary re-renders
    const watchedStartingBalance = watch('starting_balance');
    const watchedFreeOfCharge = watch('free_of_charge');

    // Memoized function to update store data
    const updateStoreData = useCallback((data) => {
        // Only update if data has actually changed
        const hasChanged = Object.keys(data).some(key => formData[key] !== data[key]);
        if (hasChanged) {
            setFormData(data);
        }
    }, [formData, setFormData]);

    // Sync only specific form values with store (prevent infinite loops)
    useEffect(() => {
        const subscription = watch((value, { name }) => {
            // Only sync if a specific field changed, not on every render
            if (name) {
                updateStoreData({ [name]: value[name] });
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, updateStoreData]);

    // Calculate total price when specific values change
    useEffect(() => {
        if (bypassTemplate) {
            const startingBalance = watchedStartingBalance || 0;
            const freeOfCharge = watchedFreeOfCharge || 0;
            const totalPrice = Math.max(0, startingBalance - freeOfCharge);
            
            // Only update if the value actually changed
            if (formData.total_price !== totalPrice) {
                setValue('total_price', totalPrice, { shouldDirty: false });
                updateStoreData({ total_price: totalPrice });
            }
        }
    }, [watchedStartingBalance, watchedFreeOfCharge, bypassTemplate, setValue, updateStoreData, formData.total_price]);

    // Handle template selection
    const handleTemplateSelect = useCallback((templateId, templateDetails) => {
        setSelectedTemplate(templateDetails);
        setValue('voucher_template_id', templateId, { shouldDirty: false });
        
        if (templateDetails) {
            const updates = {
                starting_balance: templateDetails.default_starting_balance || 0,
                free_of_charge: templateDetails.default_free_of_charge || 0,
                total_price: templateDetails.default_total_price || 0
            };
            
            // Batch all setValue calls
            Object.entries(updates).forEach(([key, value]) => {
                setValue(key, value, { shouldDirty: false });
            });
            
            updateStoreData(updates);
        }
    }, [setSelectedTemplate, setValue, updateStoreData]);

    // Handle bypass template toggle
    const handleBypassToggle = useCallback((checked) => {
        setBypassTemplate(checked);
        
        if (checked) {
            // Reset template-related fields
            const resetValues = {
                voucher_template_id: '',
                starting_balance: 0,
                free_of_charge: 0,
                total_price: 0,
                member_voucher_name: ''
            };
            
            Object.entries(resetValues).forEach(([key, value]) => {
                setValue(key, value, { shouldDirty: false });
            });
            
            updateStoreData(resetValues);
        }
    }, [setBypassTemplate, setValue, updateStoreData]);

    // Handle service selection
    const handleServiceSelect = useCallback((detailId, serviceDetails) => {
        updateMemberVoucherDetail(detailId, 'service_id', serviceDetails.id);
        updateMemberVoucherDetail(detailId, 'name', serviceDetails.service_name);
        updateMemberVoucherDetail(detailId, 'price', serviceDetails.service_price || 0);
        updateMemberVoucherDetail(detailId, 'duration', serviceDetails.duration || '');
        
        // Recalculate final price
        const detail = memberVoucherDetails.find(d => d.id === detailId);
        if (detail) {
            const finalPrice = (serviceDetails.service_price || 0) - 
                             ((serviceDetails.service_price || 0) * (detail.discount || 0) / 100);
            updateMemberVoucherDetail(detailId, 'final_price', finalPrice);
        }
    }, [updateMemberVoucherDetail, memberVoucherDetails]);

    // Handle discount change with final price calculation
    const handleDiscountChange = useCallback((detailId, discount) => {
        const detail = memberVoucherDetails.find(d => d.id === detailId);
        if (detail) {
            const finalPrice = detail.price - (detail.price * (discount / 100));
            updateMemberVoucherDetail(detailId, 'discount', discount);
            updateMemberVoucherDetail(detailId, 'final_price', finalPrice);
        }
    }, [updateMemberVoucherDetail, memberVoucherDetails]);

    // Handle price change with final price recalculation
    const handlePriceChange = useCallback((detailId, price) => {
        const detail = memberVoucherDetails.find(d => d.id === detailId);
        if (detail) {
            const finalPrice = price - (price * ((detail.discount || 0) / 100));
            updateMemberVoucherDetail(detailId, 'price', price);
            updateMemberVoucherDetail(detailId, 'final_price', finalPrice);
        }
    }, [updateMemberVoucherDetail, memberVoucherDetails]);

    // Form submission - add to cart instead of direct submit
    const onFormSubmit = useCallback((data) => {
        // Validate member is selected
        if (!selectedMember) {
            alert('Please select a member first');
            return;
        }

        // Add to cart using store action
        addToCart();
        
        // Show success message
        alert('Member voucher added to cart successfully!');
    }, [selectedMember, addToCart]);

    // Handle form reset
    const handleReset = useCallback(() => {
        reset();
        resetForm(formData);
    }, [reset, resetForm, formData]);

    return (
        <FormProvider {...methods}>
            <div className="space-y-6">
                {/* Member Selection Notice */}
                {!selectedMember && (
                    <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="pt-4">
                            <p className="text-orange-800 text-sm">
                                Please select a member first before creating a voucher.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {selectedMember && (
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="pt-4">
                            <p className="text-green-800 text-sm">
                                Creating voucher for: <strong>{selectedMember.name}</strong>
                            </p>
                        </CardContent>
                    </Card>
                )}

                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-medium">Voucher Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="voucher_name" className="text-sm font-medium text-gray-700">
                                        Voucher Name *
                                    </Label>
                                    <Input
                                        id="voucher_name"
                                        placeholder="Enter voucher name"
                                        {...register("voucher_name", { required: "Voucher name is required" })}
                                        className={`h-9 ${errors.voucher_name ? "border-red-500" : ""}`}
                                    />
                                    {errors.voucher_name && (
                                        <p className="text-red-500 text-xs">{errors.voucher_name.message}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <EmployeeSelect name="created_by" label="Created By *" />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="creation_datetime" className="text-sm font-medium text-gray-700">
                                        Creation DateTime *
                                    </Label>
                                    <Input
                                        id="creation_datetime"
                                        type="datetime-local"
                                        {...register("creation_datetime", { required: "Creation datetime is required" })}
                                        className={`h-9 ${errors.creation_datetime ? "border-red-500" : ""}`}
                                    />
                                    {errors.creation_datetime && (
                                        <p className="text-red-500 text-xs">{errors.creation_datetime.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="remarks" className="text-sm font-medium text-gray-700">
                                    Remarks
                                </Label>
                                <Textarea
                                    id="remarks"
                                    placeholder="Enter any additional remarks"
                                    {...register("remarks")}
                                    rows={2}
                                    className="min-h-[60px] w-full"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Template Configuration */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-medium">Template Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Bypass Template Toggle */}
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="bypass-template"
                                    checked={bypassTemplate}
                                    onCheckedChange={handleBypassToggle}
                                />
                                <Label htmlFor="bypass-template" className="text-sm font-medium text-gray-700">
                                    Bypass Voucher Template
                                </Label>
                            </div>

                            {!bypassTemplate ? (
                                // Template Selection Mode
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <VoucherTemplateSelect
                                            name="id"
                                            label="Voucher Template"
                                            onSelectFullDetails={handleTemplateSelect}
                                        />
                                    </div>

                                    {selectedTemplate && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium text-gray-700">
                                                    Starting Balance
                                                </Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.starting_balance || 0}
                                                    readOnly
                                                    className="bg-white h-9"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium text-gray-700">
                                                    Free of Charge (FOC)
                                                </Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.free_of_charge || 0}
                                                    readOnly
                                                    className="bg-white h-9"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium text-gray-700">
                                                    Total Price
                                                </Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.total_price || 0}
                                                    readOnly
                                                    className="bg-white h-9"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Bypass Template Mode
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="member_voucher_name" className="text-sm font-medium text-gray-700">
                                            Member Voucher Name *
                                        </Label>
                                        <Input
                                            id="member_voucher_name"
                                            placeholder="Enter member voucher name"
                                            {...register("member_voucher_name", {
                                                required: bypassTemplate ? "Member voucher name is required" : false
                                            })}
                                            className={`h-9 ${errors.member_voucher_name ? "border-red-500" : ""}`}
                                        />
                                        {errors.member_voucher_name && (
                                            <p className="text-red-500 text-xs">{errors.member_voucher_name.message}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="starting_balance" className="text-sm font-medium text-gray-700">
                                                Starting Balance *
                                            </Label>
                                            <Input
                                                id="starting_balance"
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                {...register("starting_balance", {
                                                    required: bypassTemplate ? "Starting balance is required" : false,
                                                    valueAsNumber: true,
                                                    min: 0
                                                })}
                                                className={`h-9 ${errors.starting_balance ? "border-red-500" : ""}`}
                                            />
                                            {errors.starting_balance && (
                                                <p className="text-red-500 text-xs">{errors.starting_balance.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="free_of_charge" className="text-sm font-medium text-gray-700">
                                                FOC
                                            </Label>
                                            <Input
                                                id="free_of_charge"
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                max={watchedStartingBalance || 0}
                                                {...register("free_of_charge", {
                                                    valueAsNumber: true,
                                                    min: 0,
                                                    max: watchedStartingBalance || 0
                                                })}
                                                className="h-9"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="total_price" className="text-sm font-medium text-gray-700">
                                                Total Price
                                            </Label>
                                            <Input
                                                id="total_price"
                                                type="number"
                                                step="0.01"
                                                value={formData.total_price || 0}
                                                readOnly
                                                className="bg-gray-50 h-9"
                                            />
                                        </div>
                                    </div>

                                    {/* Member Voucher Details */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium text-gray-700">
                                                Member Voucher Details
                                            </Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addMemberVoucherDetail}
                                                className="h-8"
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add Details
                                            </Button>
                                        </div>

                                        {memberVoucherDetails.length > 0 && (
                                            <div className="space-y-2">
                                                {memberVoucherDetails.map((detail, index) => (
                                                    <div key={detail.id} className="p-3 border rounded-lg bg-gray-50 space-y-3">
                                                        {/* Service Selection Row */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <ServiceSelect
                                                                name={`member_voucher_details.${index}.service_id`}
                                                                label="Service"
                                                                onSelectFullDetails={(serviceDetails) =>
                                                                    handleServiceSelect(detail.id, serviceDetails)
                                                                }
                                                                className="col-span-1"
                                                            />
                                                            <div className="space-y-1">
                                                                <Label className="text-sm font-medium text-gray-700">Duration</Label>
                                                                <Input
                                                                    placeholder="e.g., 60 min"
                                                                    value={detail.duration || ''}
                                                                    onChange={(e) => updateMemberVoucherDetail(detail.id, 'duration', e.target.value)}
                                                                    className="h-9"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Details Row */}
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                            <div className="space-y-1">
                                                                <Label className="text-sm font-medium text-gray-700">Service Name</Label>
                                                                <Input
                                                                    placeholder="Service name"
                                                                    value={detail.name || ''}
                                                                    onChange={(e) => updateMemberVoucherDetail(detail.id, 'name', e.target.value)}
                                                                    className="h-9"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-sm font-medium text-gray-700">Price</Label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    placeholder="0.00"
                                                                    value={detail.price || 0}
                                                                    onChange={(e) => handlePriceChange(detail.id, parseFloat(e.target.value) || 0)}
                                                                    className="h-9"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-sm font-medium text-gray-700">Discount (%)</Label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    placeholder="0"
                                                                    min="0"
                                                                    max="100"
                                                                    value={detail.discount || 0}
                                                                    onChange={(e) => handleDiscountChange(detail.id, parseFloat(e.target.value) || 0)}
                                                                    className="h-9"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-sm font-medium text-gray-700">Final Price</Label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={detail.final_price || 0}
                                                                    readOnly
                                                                    className="h-9 bg-white"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Remove Button */}
                                                        <div className="flex justify-end">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => removeMemberVoucherDetail(detail.id)}
                                                                className="h-8 text-red-600 hover:text-red-700"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-1" />
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleReset}
                            className="px-6 py-2"
                        >
                            Reset Form
                        </Button>
                        
                        <Button
                            type="submit"
                            disabled={!selectedMember}
                            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm disabled:opacity-50"
                        >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                        </Button>
                    </div>
                </form>
            </div>
        </FormProvider>
    );
};

export default CreateMemberVoucherForm;
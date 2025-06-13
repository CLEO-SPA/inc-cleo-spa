// components/voucher/CreateMemberVoucherForm.jsx
import { useEffect } from 'react';
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
import useMemberVoucherFormStore from '@/stores/MemberVoucher/useMemberVoucherFormStore';
import useTransactionCartStore from '@/stores/useTransactionCartStore';

const CreateMemberVoucherForm = () => {
    // Store state and actions
    const {
        bypassTemplate,
        selectedTemplate,
        memberVoucherDetails,
        formData,
        formErrors,
        // Actions
        setBypassTemplate,
        updateFormField,
        addMemberVoucherDetail,
        updateMemberVoucherDetail,
        removeMemberVoucherDetail,
        handleServiceSelect,
        handlePriceChange,
        handleDiscountChange,
        handleTemplateSelect,
        submitForm,
        reset,
        getFormValue,
        getFormError,
        hasFormErrors,
        setCurrentDateTime,
    } = useMemberVoucherFormStore();

    const { selectedMember } = useTransactionCartStore();

    // Auto-set current datetime on component mount
    useEffect(() => {
        if (!getFormValue('creation_datetime')) {
            setCurrentDateTime();
        }
    }, []);

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();

        if (submitForm()) {
            alert('Member voucher added to cart successfully!');
        }
    };

    // Handle bypass template toggle
    const handleBypassToggle = (checked) => {
        setBypassTemplate(checked);
    };

    return (
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

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Template Configuration */}
                <Card>
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
                            <TemplateMode
                                selectedTemplate={selectedTemplate}
                                memberVoucherDetails={memberVoucherDetails}
                                formData={formData}
                                onTemplateSelect={handleTemplateSelect}
                                onAddDetail={addMemberVoucherDetail}
                                onUpdateDetail={updateMemberVoucherDetail}
                                onRemoveDetail={removeMemberVoucherDetail}
                                onServiceSelect={handleServiceSelect}
                                onPriceChange={handlePriceChange}
                                onDiscountChange={handleDiscountChange}
                                updateFormField={updateFormField}
                                getFormValue={getFormValue}
                            />
                        ) : (
                            // Bypass Template Mode
                            <BypassMode
                                formData={formData}
                                formErrors={formErrors}
                                memberVoucherDetails={memberVoucherDetails}
                                updateFormField={updateFormField}
                                onAddDetail={addMemberVoucherDetail}
                                onUpdateDetail={updateMemberVoucherDetail}
                                onRemoveDetail={removeMemberVoucherDetail}
                                onServiceSelect={handleServiceSelect}
                                onPriceChange={handlePriceChange}
                                onDiscountChange={handleDiscountChange}
                                getFormValue={getFormValue}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Additional Form Fields */}
                <Card>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="creation_datetime" className="text-sm font-medium text-gray-700">
                                    Creation DateTime *
                                </Label>
                                <Input
                                    id="creation_datetime"
                                    type="datetime-local"
                                    value={getFormValue('creation_datetime') || ''}
                                    onChange={(e) => updateFormField('creation_datetime', e.target.value)}
                                    className={`h-9 ${getFormError('creation_datetime') ? "border-red-500" : ""}`}
                                />
                                {getFormError('creation_datetime') && (
                                    <p className="text-red-500 text-xs">{getFormError('creation_datetime')}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <EmployeeSelect
                                    name="created_by"
                                    label="Created By *"
                                    value={getFormValue('created_by')}
                                    onChange={(employeeId) => updateFormField('created_by', employeeId)}
                                    errors={{ created_by: getFormError('created_by') }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="remarks" className="text-sm font-medium text-gray-700">
                                Remarks
                            </Label>
                            <Textarea
                                id="remarks"
                                placeholder="Enter any additional remarks"
                                value={getFormValue('remarks') || ''}
                                onChange={(e) => updateFormField('remarks', e.target.value)}
                                rows={2}
                                className="min-h-[60px] w-full"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={reset}
                        className="px-6 py-2"
                    >
                        Reset Form
                    </Button>

                    <Button
                        type="submit"
                        disabled={!selectedMember || hasFormErrors()}
                        className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm disabled:opacity-50"
                    >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                    </Button>
                </div>
            </form>
        </div>
    );
};

// Template Mode Component
const TemplateMode = ({
    selectedTemplate,
    memberVoucherDetails,
    formData,
    onTemplateSelect,
    onAddDetail,
    onUpdateDetail,
    onRemoveDetail,
    onServiceSelect,
    onPriceChange,
    onDiscountChange,
    updateFormField,
    getFormValue
}) => (
    <div className="space-y-4">
        <div className="space-y-1">
            <VoucherTemplateSelect
                name="voucher_template_id"
                label="Voucher Template"
                value={selectedTemplate?.id}
                onSelectFullDetails={onTemplateSelect}
                error={null}
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
                        onChange={(e) => updateFormField('starting_balance', parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => updateFormField('free_of_charge', parseFloat(e.target.value) || 0)}
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

        <MemberVoucherDetailsSection
            memberVoucherDetails={memberVoucherDetails}
            onAddDetail={onAddDetail}
            onUpdateDetail={onUpdateDetail}
            onRemoveDetail={onRemoveDetail}
            onServiceSelect={onServiceSelect}
            onPriceChange={onPriceChange}
            onDiscountChange={onDiscountChange}
            isTemplateMode={true}
            selectedTemplate={selectedTemplate}
            getFormValue={getFormValue}
        />
    </div>
);

// Bypass Mode Component
const BypassMode = ({
    formData,
    formErrors,
    memberVoucherDetails,
    updateFormField,
    onAddDetail,
    onUpdateDetail,
    onRemoveDetail,
    onServiceSelect,
    onPriceChange,
    onDiscountChange,
    getFormValue
}) => (
    <div className="space-y-4">
        <div className="space-y-1">
            <Label htmlFor="member_voucher_name" className="text-sm font-medium text-gray-700">
                Member Voucher Name *
            </Label>
            <Input
                id="member_voucher_name"
                placeholder="Enter member voucher name"
                value={formData.member_voucher_name || ''}
                onChange={(e) => updateFormField('member_voucher_name', e.target.value)}
                className={`h-9 ${formErrors.member_voucher_name ? "border-red-500" : ""}`}
            />
            {formErrors.member_voucher_name && (
                <p className="text-red-500 text-xs">{formErrors.member_voucher_name}</p>
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
                    value={formData.starting_balance || ''}
                    onChange={(e) => updateFormField('starting_balance', parseFloat(e.target.value) || 0)}
                    className={`h-9 ${formErrors.starting_balance ? "border-red-500" : ""}`}
                />
                {formErrors.starting_balance && (
                    <p className="text-red-500 text-xs">{formErrors.starting_balance}</p>
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
                    max={formData.starting_balance || 0}
                    value={formData.free_of_charge || ''}
                    onChange={(e) => updateFormField('free_of_charge', parseFloat(e.target.value) || 0)}
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

        <MemberVoucherDetailsSection
            memberVoucherDetails={memberVoucherDetails}
            onAddDetail={onAddDetail}
            onUpdateDetail={onUpdateDetail}
            onRemoveDetail={onRemoveDetail}
            onServiceSelect={onServiceSelect}
            onPriceChange={onPriceChange}
            onDiscountChange={onDiscountChange}
            isTemplateMode={false}
            getFormValue={getFormValue}
        />
    </div>
);

// Member Voucher Details Section Component
const MemberVoucherDetailsSection = ({
    memberVoucherDetails,
    onAddDetail,
    onUpdateDetail,
    onRemoveDetail,
    onServiceSelect,
    onPriceChange,
    onDiscountChange,
    isTemplateMode,
    selectedTemplate,
    getFormValue
}) => (
    <div className="space-y-3">
        <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">
                Member Voucher Details
            </Label>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddDetail}
                className="h-8"
            >
                <Plus className="h-4 w-4 mr-1" />
                Add Details
            </Button>
        </div>

        {memberVoucherDetails.length > 0 && (
            <div className="space-y-2">
                {memberVoucherDetails.map((detail, index) => (
                    <MemberVoucherDetailRow
                        key={detail.id}
                        detail={detail}
                        index={index}
                        onUpdateDetail={onUpdateDetail}
                        onRemoveDetail={onRemoveDetail}
                        onServiceSelect={onServiceSelect}
                        onPriceChange={onPriceChange}
                        onDiscountChange={onDiscountChange}
                        isTemplateMode={isTemplateMode}
                        selectedTemplate={selectedTemplate}
                        getFormValue={getFormValue}
                    />
                ))}
            </div>
        )}
    </div>
);

// Individual Member Voucher Detail Row Component
const MemberVoucherDetailRow = ({
    detail,
    index,
    onUpdateDetail,
    onRemoveDetail,
    onServiceSelect,
    onPriceChange,
    onDiscountChange,
    isTemplateMode,
    selectedTemplate,
    getFormValue
}) => (
    <div className="p-3 border rounded-lg bg-gray-50 space-y-3">
        {/* Service Selection Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isTemplateMode ? (
                <ServiceSelect
                    name={`member_voucher_details.${index}.service_id`}
                    label="Service"
                    value={detail.service_id || ''}
                    onChange={(serviceId) => onUpdateDetail(detail.id, 'service_id', serviceId)}
                    onSelectFullDetails={(serviceDetails) => onServiceSelect(detail.id, serviceDetails)}
                    className="col-span-1"
                />
            ) : (
                <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">Service Name</Label>
                    <Input
                        placeholder="Enter service name"
                        value={detail.name || ''}
                        onChange={(e) => onUpdateDetail(detail.id, 'name', e.target.value)}
                        className="h-9 bg-white"
                    />
                </div>
            )}
            <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">Duration</Label>
                <Input
                    type="number"
                    placeholder="e.g., 60 min"
                    value={detail.duration || ''}
                    onChange={(e) => onUpdateDetail(detail.id, 'duration', e.target.value)}
                    className="h-9 bg-white"
                />
            </div>
            <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">Original Price</Label>
                <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={detail.price || 0}
                    readOnly={isTemplateMode}
                    onChange={(e) => onPriceChange(detail.id, parseFloat(e.target.value) || 0)}
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
                    onChange={(e) => onUpdateDetail(detail.id, 'name', e.target.value)}
                    readOnly={isTemplateMode}
                    className="h-9 bg-white"
                />
            </div>
            <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">Price</Label>
                <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={detail.price || 0}
                    onChange={(e) => onPriceChange(detail.id, parseFloat(e.target.value) || 0)}
                    className="h-9 bg-white"
                />
            </div>
            <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">Discount (%)</Label>
                <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0.00"
                    value={detail.discount || 0}
                    onChange={(e) => onDiscountChange(detail.id, parseFloat(e.target.value) || 0)}
                    className="h-9 bg-white"
                />
            </div>
            <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">Final Price</Label>
                <Input
                    type="number"
                    step="0.01"
                    value={detail.final_price || 0}
                    readOnly
                    className="h-9 bg-gray-100"
                />
            </div>
        </div>

        {/* Quantity and Actions Row */}
        <div className="flex items-end gap-4">
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRemoveDetail(detail.id)}
                className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    </div>
);

export default CreateMemberVoucherForm;
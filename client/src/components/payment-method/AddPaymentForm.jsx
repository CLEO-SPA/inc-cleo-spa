import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Loader2, AlertCircle } from 'lucide-react';
import PaymentMethodSelect from '@/components/ui/forms/PaymentMethodSelect';
import usePaymentMethodStore from '@/stores/usePaymentMethodStore';

export const AddPaymentForm = ({
  paymentCards = [],
  onAddPayment,
  onRemovePayment,
  onPaymentChange,
  totalAmount = 0,
  showTotalAmount = true,
  disabled = false,
  className = '',
}) => {
  // Initialize with at least one payment card if none exist
  const [localPaymentCards, setLocalPaymentCards] = useState(() => {
    if (paymentCards.length === 0) {
      return [
        {
          id: Date.now(),
          payment_method_id: null,
          payment_method_name: '',
          amount: 0,
          remarks: '',
        },
      ];
    }
    return paymentCards;
  });

  // Store selectors
  const paymentMethods = usePaymentMethodStore((state) => state.dropdownPaymentMethods);
  const loading = usePaymentMethodStore((state) => state.loading);
  const error = usePaymentMethodStore((state) => state.error);
  const errorMessage = usePaymentMethodStore((state) => state.errorMessage);
  const fetchDropdownPaymentMethods = usePaymentMethodStore((state) => state.fetchDropdownPaymentMethods);

  // State to prevent infinite loops
  const [hasFetchedPaymentMethods, setHasFetchedPaymentMethods] = useState(false);

  // Load payment methods on mount
  useEffect(() => {
    if (paymentMethods.length === 0 && !loading && !hasFetchedPaymentMethods) {
      setHasFetchedPaymentMethods(true);
      fetchDropdownPaymentMethods();
    }
  }, [paymentMethods.length, loading, hasFetchedPaymentMethods, fetchDropdownPaymentMethods]);

  // Sync with parent component
  useEffect(() => {
    setLocalPaymentCards(
      paymentCards.length === 0
        ? [
            {
              id: Date.now(),
              payment_method_id: null,
              payment_method_name: '',
              amount: 0,
              remarks: '',
            },
          ]
        : paymentCards
    );
  }, [paymentCards]);

  // Calculate remaining amount
  const paidAmount = localPaymentCards.reduce((sum, card) => sum + (card.amount || 0), 0);
  const remainingAmount = totalAmount - paidAmount;

  const handleAddPaymentCard = () => {
    const newCard = {
      id: Date.now() + Math.random(), // Ensure unique ID
      payment_method_id: null,
      payment_method_name: '',
      amount: 0,
      remarks: '',
    };
    const updatedCards = [...localPaymentCards, newCard];
    setLocalPaymentCards(updatedCards);
    onAddPayment(newCard);
  };

  const handleRemovePaymentCard = (index) => {
    if (localPaymentCards.length <= 1) return; // Always keep at least one card

    const updatedCards = localPaymentCards.filter((_, i) => i !== index);
    setLocalPaymentCards(updatedCards);
    onRemovePayment(index);
  };

  const handlePaymentMethodSelect = (index, paymentMethodId) => {
    const selectedMethod = paymentMethods.find((pm) => pm.id === paymentMethodId);
    const updatedCards = localPaymentCards.map((card, i) => {
      if (i === index) {
        return {
          ...card,
          payment_method_id: paymentMethodId,
          payment_method_name: selectedMethod?.payment_method_name || '',
        };
      }
      return card;
    });
    setLocalPaymentCards(updatedCards);
    onPaymentChange(index, 'payment_method_id', paymentMethodId);
    onPaymentChange(index, 'payment_method_name', selectedMethod?.payment_method_name || '');
  };

  const handleFieldChange = (index, field, value) => {
    let finalValue = value;

    if (field === 'amount') {
      // Allow empty string (if user is deleting while typing)
      if (value === '') {
        finalValue = '';
      } else {
        const raw = String(value);
        const regex = /^\d+(\.\d{0,2})?$/;

        if (!regex.test(raw)) {
          return; // Ignore input if it doesn't match the pattern
        }

        // Parse and ensure max 2 decimals
        finalValue = parseFloat(value);
      }
    }

    const updatedCards = localPaymentCards.map((card, i) => {
      if (i === index) {
        return {
          ...card,
          [field]: finalValue,
        };
      }
      return card;
    });
    setLocalPaymentCards(updatedCards);
    onPaymentChange(index, field, finalValue);
  };

  const handleRetryPaymentMethods = () => {
    fetchDropdownPaymentMethods();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Payment Summary */}
      {showTotalAmount && (
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
            <div>
              <span className='font-medium text-gray-700'>Total Amount: </span>
              <span className='font-semibold text-blue-900'>${totalAmount.toFixed(2)}</span>
            </div>
            <div>
              <span className='font-medium text-gray-700'>Paid Amount: </span>
              <span className='font-semibold text-green-700'>${paidAmount.toFixed(2)}</span>
            </div>
            <div>
              <span className='font-medium text-gray-700'>Remaining: </span>
              <span
                className={`font-semibold ${
                  remainingAmount > 0 ? 'text-red-600' : remainingAmount < 0 ? 'text-orange-600' : 'text-green-600'
                }`}
              >
                ${remainingAmount.toFixed(2)}
                {remainingAmount < 0 && ' (Overpaid)'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-md p-3'>
          <div className='flex items-center gap-2'>
            <AlertCircle className='h-4 w-4 text-red-600' />
            <p className='text-red-800 text-sm'>Error loading payment methods: {errorMessage}</p>
          </div>
          <Button type='button' variant='outline' size='sm' onClick={handleRetryPaymentMethods} className='mt-2'>
            Retry Loading Payment Methods
          </Button>
        </div>
      )}

      {/* Payment Method Cards */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h4 className='font-medium text-gray-900'>Payment Methods</h4>
          <Button
            type='button'
            onClick={handleAddPaymentCard}
            className='flex items-center gap-2'
            variant='outline'
            size='sm'
            disabled={loading || disabled}
          >
            <Plus className='h-4 w-4' />
            Add Payment Method
          </Button>
        </div>

        {localPaymentCards.map((payment, index) => (
          <Card key={payment.id || index} className='relative'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium'>Payment Method {index + 1}</CardTitle>
                {localPaymentCards.length > 1 && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => handleRemovePaymentCard(index)}
                    className='h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50'
                    disabled={disabled}
                  >
                    <X className='h-3 w-4' />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className='pt-0'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                <div className='space-y-2'>
                  {loading ? (
                    <div className='flex items-center gap-2 p-2 border rounded bg-white'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      <span className='text-sm text-gray-500'>Loading payment methods...</span>
                    </div>
                  ) : (
                    <PaymentMethodSelect
                      name={`payment_method_id_${index}`}
                      label='Payment Method *'
                      value={payment.payment_method_id}
                      onChange={(paymentMethodId) => handlePaymentMethodSelect(index, paymentMethodId)}
                      disabled={error || disabled}
                    />
                  )}
                </div>

                <div className='space-y-2'>
                  <Label className='text-sm font-medium text-gray-700'>Amount *</Label>
                  <Input
                    type='number'
                    step='0.01'
                    min='0'
                    value={payment.amount}
                    onChange={(e) => handleFieldChange(index, 'amount', e.target.value)}
                    placeholder='0.00'
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>Remarks</Label>
                <Textarea
                  value={payment.remarks}
                  onChange={(e) => handleFieldChange(index, 'remarks', e.target.value)}
                  placeholder='Optional remarks for this payment...'
                  rows={2}
                  disabled={disabled}
                />
              </div>

              {payment.payment_method_name && payment.amount > 0 && (
                <div className='mt-3 p-2 bg-green-50 border border-green-200 rounded'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-green-800'>{payment.payment_method_name}</span>
                    <span className='text-sm font-semibold text-green-800'>${payment.amount?.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AddPaymentForm;

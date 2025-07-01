import { useState } from 'react';
import { Trash2, ShoppingCart, User, Package, CreditCard, Gift, ArrowRightLeft } from 'lucide-react';
import useTransactionCartStore from '@/stores/useTransactionCartStore';
import { useNavigate } from 'react-router-dom';

const getItemIcon = (type) => {
  switch (type) {
    case 'service':
      return <Package className='w-4 h-4' />;
    case 'product':
      return <ShoppingCart className='w-4 h-4' />;
    case 'member-voucher':
      return <Gift className='w-4 h-4' />;
    case 'package':
      return <CreditCard className='w-4 h-4' />;
    case 'transfer':
      return <ArrowRightLeft className='w-4 h-4' />;
    default:
      return <Package className='w-4 h-4' />;
  }
};

const getItemTypeLabel = (type) => {
  switch (type) {
    case 'service':
      return 'Service';
    case 'product':
      return 'Product';
    case 'member-voucher':
      return 'Voucher';
    case 'package':
      return 'Package';
    case 'transfer':
      return 'Transfer';
    default:
      return 'Item';
  }
};

const formatItemDetails = (item) => {
  switch (item.type) {
    case 'service':
      return {
        name: item.data.name,
        price: item.data.price,
        details: item.data.duration ? `Duration: ${item.data.duration}` : null,
      };
    case 'product':
      return {
        name: item.data.name,
        price: item.data.price * item.data.quantity,
        details: `Qty: ${item.data.quantity} × $${item.data.price}`,
      };
    case 'member-voucher':
      return {
        name: item.data.member_voucher_name || 'Unnamed Voucher',
        price: item.data.total_price,
        details: item.data.starting_balance ? `Starting Balance: $${item.data.starting_balance}` : null,
      };
    case 'package':
      return {
        name: item.data.name,
        price: item.data.price,
        details: item.data.description || null,
      };
    case 'transfer':
      return {
        name: item.data.name || 'Balance Transfer',
        price: item.data.amount,
        details: item.data.description || null,
      };
    default:
      return {
        name: item.data.name || item.data.member_voucher_name || 'Unknown Item',
        price: item.data.price || item.data.total_price || 0,
        details: null,
      };
  }
};

export default function TransactionCart() {
  const navigate = useNavigate();
  const { selectedMember, cartItems, currentStep, removeCartItem, getCartTotal, clearCart } = useTransactionCartStore();

  const [showConfirm, setShowConfirm] = useState(false);

  const handleClearCart = () => {
    if (cartItems.length > 0) {
      setShowConfirm(true);
    }
  };

  const confirmClearCart = () => {
    clearCart();
    setShowConfirm(false);
  };

  const handleProceedToPayment = () => {
    navigate('/sale-transaction/summary');
  };

  const total = getCartTotal();

  return (
    <div className='flex flex-col h-full rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 shadow-sm'>
      {/* Header */}
      <div className='p-6 border-b border-slate-200 bg-white rounded-t-xl'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <ShoppingCart className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <h3 className='font-semibold text-lg text-slate-900'>Transaction Cart</h3>
              <p className='text-sm text-slate-500'>
                Step: {currentStep.charAt(0).toUpperCase() + currentStep.slice(1)}
              </p>
            </div>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={handleClearCart}
              className='px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors'
            >
              Clear All
            </button>
          )}
        </div>

        {/* Selected Member */}
        {selectedMember && (
          <div className='mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200'>
            <div className='flex items-center gap-2'>
              <User className='w-4 h-4 text-blue-600' />
              <span className='text-sm font-medium text-blue-900'>{selectedMember.name}</span>
              {selectedMember.membership && (
                <span className='px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full'>
                  {selectedMember.membership}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cart Content - Fix: Added flex-1 and overflow-y-auto directly to this div */}
      <div className='flex-1 overflow-y-auto'>
        <div className='p-6'>
          {cartItems.length === 0 ? (
            <div className='text-center py-12'>
              <ShoppingCart className='w-12 h-12 text-slate-300 mx-auto mb-4' />
              <p className='text-slate-500 font-medium'>No items in cart</p>
              <p className='text-sm text-slate-400 mt-1'>Add services, products, or vouchers to get started</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {cartItems.map((item) => {
                const itemDetails = formatItemDetails(item);
                return (
                  <div
                    key={item.id}
                    className='group bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-all duration-200'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex items-start gap-3 flex-1'>
                        <div className='p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors'>
                          {getItemIcon(item.type)}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 mb-1'>
                            <h4 className='font-medium text-slate-900 truncate'>{itemDetails.name}</h4>
                            <span className='px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full'>
                              {getItemTypeLabel(item.type)}
                            </span>
                          </div>
                          {itemDetails.details && <p className='text-sm text-slate-500 mb-2'>{itemDetails.details}</p>}
                          <div className='flex items-center justify-between'>
                            <span className='font-semibold text-slate-900'>${itemDetails.price.toFixed(2)}</span>
                            {item.status && (
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  item.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {item.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeCartItem(item.id)}
                        className='p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100'
                        title='Remove item'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer with Total */}
      {cartItems.length > 0 && (
        <div className='p-6 border-t border-slate-200 bg-white rounded-b-xl'>
          <div className='flex items-center justify-between mb-4'>
            <div className='text-right flex-1'>
              <p className='text-sm text-slate-500 mb-1'>Total Amount</p>
              <p className='text-2xl font-bold text-slate-900'>${total.toFixed(2)}</p>
            </div>
          </div>

          <div className='flex gap-2'>
            <button
              onClick={handleProceedToPayment}
              className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-sm w-full mx-4'>
            <h3 className='font-semibold text-lg mb-2'>Clear Cart</h3>
            <p className='text-slate-600 mb-4'>
              Are you sure you want to remove all items from the cart? This action cannot be undone.
            </p>
            <div className='flex gap-2'>
              <button
                onClick={() => setShowConfirm(false)}
                className='flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={confirmClearCart}
                className='flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

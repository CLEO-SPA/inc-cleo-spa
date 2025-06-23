import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import MemberSelectorPanel from './MemberSelectorPanel';
import FormSelectorPanel from './FormSelectorPanel';
import Cart from './Cart';
import { useNavigate } from 'react-router-dom';
import useTransactionCartStore from '@/stores/useTransactionCartStore';

export default function MockSalesTransactionPage() {
    const navigate = useNavigate();
    const { getCartTotal, cartItems } = useTransactionCartStore();
    
    // Handle checkout button click
    const handleCheckout = () => {
        // Redirect to the summary page
        navigate('/sale-transaction/summary');
    };
    
    // Get total amount from cart
    const totalAmount = getCartTotal();
    
    // Check if cart has items
    const hasItems = cartItems.length > 0;

    return (
        <div className='h-screen overflow-hidden [--header-height:calc(theme(spacing.14))]'>
            <SidebarProvider className='flex flex-col h-full'>
                <SiteHeader />
                <div className='flex flex-1 min-h-0'>
                    <AppSidebar />
                    <SidebarInset className='flex-1'>
                        <div className='flex flex-col h-full'>
                            {/* Top panel */}
                            <div className='flex-shrink-0'>
                                <MemberSelectorPanel />
                            </div>
                            
                            {/* Main content area divided horizontally */}
                            <div className='flex flex-1 min-h-0 '>
                                {/* Left side content */}
                                <div className='flex-1 bg-white'>
                                    <Cart />
                                </div>
                                
                                {/* Right side: FormSelectorPanel */}
                                <div className='w-1/2 bg-white'>
                                    <FormSelectorPanel />
                                </div>
                            </div>
                            
                            {/* Bottom horizontal panel - fixed at bottom */}
                            <div className='h-10 bg-muted flex items-center justify-end px-4 flex-shrink-0 border-t'>
                                <div className="flex items-center gap-4">
                                    <p className="text-sm text-gray-700">
                                        Total Amount: <span className="font-semibold">
                                            ${totalAmount.toFixed(2)}
                                        </span>
                                    </p>
                                    <button 
                                        onClick={handleCheckout}
                                        disabled={!hasItems}
                                        className={`${
                                            hasItems 
                                                ? "bg-primary text-white hover:bg-primary/90" 
                                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        } text-sm px-4 py-2 rounded transition-colors`}
                                    >
                                        Checkout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    );
}
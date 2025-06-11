import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import MemberSelectorPanel from './MemberSelectorPanel';
import FormSelectorPanel from './FormSelectorPanel';
import Cart from './Cart';

export default function MockSalesTransactionPage() {
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
                                    <p className="text-sm text-gray-700">Total Amount: <span className="font-semibold">$0.00</span></p>
                                    <button className="bg-primary text-white text-sm px-4 py-2 rounded hover:bg-primary/90">
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
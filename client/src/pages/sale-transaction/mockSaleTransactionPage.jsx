import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import MemberSelectorPanel from './MemberSelectorPanel';
import FormSelectorPanel from './FormSelectorPanel';
import Cart from './Cart';

export default function MockSalesTransactionPage() {
    return (
        <div className='[--header-height:calc(theme(spacing.14))]'>
            <SidebarProvider className='flex flex-col min-h-screen'>
                <SiteHeader />
                <div className='flex flex-1'>
                    <AppSidebar />
                    <SidebarInset>
                        <div className='flex flex-1 flex-col min-h-0'>
                            {/* Top panel */}
                            <MemberSelectorPanel />

                            {/* Main content area divided horizontally */}
                            <div className='flex flex-1 min-h-0'>
                                {/* Left side content */}
                                <div className='flex-1 bg-white overflow-auto'>
                                    <Cart />
                                </div>

                                {/* Right side: FormSelectorPanel */}
                                <div className='w-1/2 bg-white overflow-auto'>
                                    <FormSelectorPanel />
                                </div>
                            </div>

                            {/* Bottom horizontal panel */}
                            <div className='h-10 bg-muted flex items-center justify-end px-4'>
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

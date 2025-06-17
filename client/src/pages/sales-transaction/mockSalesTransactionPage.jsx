import { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import MemberSelectorPanel from './MemberSelectorPanel';
import FormSelectorPanel from './FormSelectorPanel';
import Cart from './Cart';
import axios from 'axios';

export default function MockSalesTransactionPage() {
    const [selectedTab, setSelectedTab] = useState('services');

    const handleCheckout = async () => {
        if (selectedTab === 'transfer_voucher') {
            try {
                await axios.post('/voucher/transfer');
                alert('Transfer successful');
            } catch (err) {
                console.error(err);
                alert('Transfer failed');
            }
        } else {
            alert('Checkout not implemented for this tab.');
        }
    };

    return (
        <div className='[--header-height:calc(theme(spacing.14))]'>
            <SidebarProvider className='flex flex-col min-h-screen'>
                <SiteHeader />
                <div className='flex flex-1'>
                    <AppSidebar />
                    <SidebarInset>
                        <div className='flex flex-1 flex-col min-h-0'>
                            <MemberSelectorPanel />
                            <div className='flex flex-1 min-h-0'>
                                <div className='flex-1 bg-white overflow-auto'>
                                    <Cart />
                                </div>
                                <div className='w-1/2 bg-white overflow-auto'>
                                    <FormSelectorPanel
                                        selectedTab={selectedTab}
                                        setSelectedTab={setSelectedTab}
                                    />
                                </div>
                            </div>
                            <div className='h-10 bg-muted flex items-center justify-end px-4'>
                                <div className="flex items-center gap-4">
                                    <p className="text-sm text-gray-700">Total Amount: <span className="font-semibold">$0.00</span></p>
                                    <button
                                        onClick={handleCheckout}
                                        className="bg-primary text-white text-sm px-4 py-2 rounded hover:bg-primary/90"
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

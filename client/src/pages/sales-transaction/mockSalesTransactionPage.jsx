import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import MemberSelectorPanel from './MemberSelectorPanel';
import FormSelectorPanel from './FormSelectorPanel';
import TransferVoucherForm from './TransferVoucherForm';
import Cart from './Cart';

import useTransactionCartStore from '@/stores/useTransactionCartStore';
import useTransferVoucherStore from '@/stores/useTransferVoucherStore';
import useSelectedMemberStore from '@/stores/useSelectedMemberStore';

export default function MockSalesTransactionPage() {
    const [selectedTab, setSelectedTab] = useState('services');
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const cartItems = useTransactionCartStore((state) => state.cartItems);
    const clearCart = useTransactionCartStore((state) => state.clearCart);
    const submitTransfer = useTransferVoucherStore((state) => state.submitTransfer);
    const getTotalOldBalance = useTransferVoucherStore((state) => state.getTotalOldBalance);
    const price = useTransferVoucherStore((state) => state.price);
    const transferFormData = useTransferVoucherStore((state) => state.transferFormData);

    const currentMember = useSelectedMemberStore((state) => state.currentMember);

    const isBalanceGreater = getTotalOldBalance() > Number(price);

    const handleCheckout = async () => {
        const hasTransferItem = cartItems.some(item => item.type === 'transfer');
        if (!hasTransferItem) {
            alert('Checkout not implemented for this cart type.');
            return;
        }

        if (!currentMember) {
            alert('No member selected.');
            return;
        }

        if (!transferFormData) {
            alert('Transfer form data is incomplete or missing.');
            return;
        }

        // Optionally, validate required fields in transferFormData here
        const {
            member_name,
            voucher_template_name,
            price: formPrice,
            foc,
            old_voucher_names,
            old_voucher_details,
            created_by,
            updated_by,
            remarks,
        } = transferFormData;

        if (
            !member_name ||
            !voucher_template_name ||
            !formPrice ||
            !old_voucher_names?.length ||
            !old_voucher_details?.length ||
            created_by == null || updated_by == null
        ) {
            alert('Please complete all required fields in the transfer form.');
            return;
        }

        try {
            await submitTransfer(transferFormData);
            clearCart();
            setShowSuccessModal(true);
        } catch (err) {
            console.error('Transfer failed:', err);
            alert('Transfer failed');
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

                            {/* Transfer form hidden but synced */}
                            <div className='hidden'>
                                <TransferVoucherForm />
                            </div>

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
                                    <p className="text-sm text-gray-700">
                                        Total Amount: <span className="font-semibold">$0.00</span>
                                    </p>
                                    <button
                                        onClick={handleCheckout}
                                        className="bg-primary text-white text-sm px-4 py-2 rounded hover:bg-primary/90 disabled:bg-gray-400"
                                        disabled={isBalanceGreater}
                                        title={isBalanceGreater ? "Cannot proceed: old voucher balance exceeds price" : ""}
                                    >
                                        Checkout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>

            <Dialog
                open={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                className="fixed z-50 inset-0 overflow-y-auto"
            >
                <div className="flex items-center justify-center min-h-screen p-4 bg-black/40">
                    <Dialog.Panel className="bg-white rounded-xl p-6 max-w-sm mx-auto shadow-lg">
                        <Dialog.Title className="text-lg font-semibold text-green-600">
                            Transfer Successful
                        </Dialog.Title>
                        <Dialog.Description className="mt-2 text-sm text-gray-600">
                            The voucher transfer has been completed successfully.
                        </Dialog.Description>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    window.location.reload(); // Refresh the page on OK
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                OK
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    );
}

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useMemberVoucherTransactionStore from '@/stores/MemberVoucher/useMemberVoucherTransactionStore';


const MemberVoucherServices = () => {
    const {
        loading,
        memberVoucherServiceList
    } = useMemberVoucherTransactionStore();

    const tableHeaders = [
        { key: 'id', label: 'ID' },
        { key: 'service_name', label: 'Service Name' },
        { key: 'original_price', label: 'Original Price' },
        { key: 'custom_price', label: 'Custom Price' },
        { key: 'discount', label: 'Discount' },
        { key: 'final_price', label: 'Final Price' },
        { key: 'duration', label: 'Duration (minutes)' }
    ];

    return (
        <Card className="mx-5 mb-1">
            <CardHeader>
                <CardTitle>Voucher Management</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div className='rounded-md border'>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {tableHeaders.map((header) => (
                                    <TableHead key={header.key} className={header.key === 'actions' ? 'text-right' : ''}>
                                        {header.label}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading &&
                                memberVoucherServiceList.length > 0 && ( // Show loading indicator over existing data
                                    <TableRow>
                                        <TableCell colSpan={tableHeaders.length} className='h-24 text-center'>
                                            Updating data...
                                        </TableCell>
                                    </TableRow>
                                )}
                            {!loading && memberVoucherServiceList.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={tableHeaders.length} className='h-24 text-center'>
                                        No Services found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loading &&
                                memberVoucherServiceList.map((voucher) => (
                                    <TableRow key={voucher.id}>
                                        {tableHeaders.map((header) => {
                                            if (header.key === 'original_price' || header.key === 'custom_price' || header.key === 'discount') {
                                                return <TableCell key={header.key}>${voucher[header.key]}</TableCell>;
                                            }
                                            return <TableCell key={header.key}>{voucher[header.key] || 'N/A'}</TableCell>;
                                        })}
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
};

export default MemberVoucherServices;
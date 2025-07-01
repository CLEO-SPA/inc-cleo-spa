import React from 'react';
import { useConsumptionStore } from '@/stores/MemberCarePackage/useMcpConsumptionStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const MemberCarePackageServices = () => {
  const { currentPackageInfo, isLoading } = useConsumptionStore();

  if (isLoading && !currentPackageInfo) {
    return (
      <Card className='m-4'>
        <CardHeader>
          <CardTitle>Available Services</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading services...</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentPackageInfo || !currentPackageInfo.details || currentPackageInfo.details.length === 0) {
    return null;
  }

  const { package: pkg, details } = currentPackageInfo;

  return (
    <Card className='m-4'>
      <CardHeader>
        <div className='flex justify-between items-start'>
          <div>
            <CardTitle>{pkg.package_name}</CardTitle>
            <CardDescription>Services included in this package.</CardDescription>
          </div>
          <div className='text-right shrink-0 ml-4'>
            <p className='text-sm font-medium text-muted-foreground'>Package Balance</p>
            <p className='text-2xl font-bold tracking-tight'>
              ${typeof pkg.balance === 'number' ? pkg.balance.toFixed(2) : 'N/A'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead className='text-right'>Price/Session</TableHead>
              <TableHead className='text-center'>Discount</TableHead>
              <TableHead className='text-right'>Final Price</TableHead>
              <TableHead className='text-center'>Total Qty</TableHead>
              <TableHead className='text-center'>Rem. Qty</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {details.map((detail) => {
              const finalPrice = detail.price * detail.discount;
              return (
                <TableRow key={detail.id}>
                  <TableCell className='font-medium'>{detail.service_name}</TableCell>
                  <TableCell className='text-right'>${detail.price.toFixed(2)}</TableCell>
                  <TableCell className='text-center'>{(detail.discount / 100).toFixed(0)}%</TableCell>
                  <TableCell className='text-right font-semibold'>${finalPrice.toFixed(2)}</TableCell>
                  <TableCell className='text-center'>{detail.quantity}</TableCell>
                  <TableCell className='text-center font-semibold'>{detail.remaining_quantity}</TableCell>
                  <TableCell>
                    <Badge variant={detail.status === 'ENABLED' ? 'default' : 'destructive'}>{detail.status}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MemberCarePackageServices;

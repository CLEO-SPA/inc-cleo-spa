import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent
} from '@/components/ui/card';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import useMembershipTypeStore from '@/stores/useMembershipTypeStore';

const MembershipTypeTable = () => {
    const {
        membershipTypeList,
        loading,
        employeeList,

        getNameById,
        setSelectedMembershipTypeId,
        setIsUpdating,
        setUpdateFormData,
        setDeleteFormData,
    } = useMembershipTypeStore();

    if (loading) {
        return <div className="text-center p-4">Loading...</div>;
    }

    return (
        <Card>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Membership Type Name</TableHead>
                                <TableHead>Default Services Discount (%)</TableHead>
                                <TableHead>Default Products Discount (%)</TableHead>
                                <TableHead>Created By</TableHead>
                                <TableHead>Last Updated By</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {membershipTypeList.map((type, index) => (
                                <TableRow key={type.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{type.membership_type_name}</TableCell>
                                    <TableCell>{type.default_percentage_discount_for_services}%</TableCell>
                                    <TableCell>{type.default_percentage_discount_for_products}%</TableCell>
                                    <TableCell style={{ textTransform: 'capitalize' }}>{employeeList.find(emp => emp.id === String(type.created_by))?.employee_name || 'Unknown'}</TableCell>
                                    <TableCell style={{ textTransform: 'capitalize' }}>{employeeList.find(emp => emp.id === String(type.last_updated_by))?.employee_name || 'Unknown'}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Open menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            const id = type.id;
                                                            setSelectedMembershipTypeId(id);
                                                            setUpdateFormData();
                                                            setIsUpdating(true);
                                                        }}
                                                    >
                                                        Update
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => {
                                                            const id = type.id
                                                            console.log("Delete Button Clicked");
                                                            setSelectedMembershipTypeId(id);
                                                            setDeleteFormData();
                                                        }}
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

export default MembershipTypeTable;
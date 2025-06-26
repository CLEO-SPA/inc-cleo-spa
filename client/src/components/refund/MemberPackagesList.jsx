import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/services/refundService';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

const MemberPackagesList = () => {
    const { memberId } = useParams();
    const [packages, setPackages] = useState([]);
    const [filteredPackages, setFilteredPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [memberName, setMemberName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const data = await api.getMemberPackages(memberId);
                console.log('Fetched packages:', data);
                setPackages(data);
                setFilteredPackages(data);
                if (data.length > 0) {
                    setMemberName(data[0].member_name);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchPackages();
    }, [memberId]);

    const debouncedSearch = useCallback(
        debounce(async (query) => {
            if (query.trim().length === 0) {
                setFilteredPackages(packages);
                setIsSearching(false);
                return;
            }

            if (query.trim().length < 2) {
                setFilteredPackages([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            setSearchError(null);

            try {
                const results = await api.searchMemberCarePackages(query, memberId);
                setFilteredPackages(results);
            } catch (err) {
                console.error('Search error:', err);
                setSearchError('Failed to search packages. Please try again.');
                setFilteredPackages([]);
            } finally {
                setIsSearching(false);
            }
        }, 300),
        [packages, memberId]
    );

    const navigate = useNavigate();
    const handleRefund = (packageId) => {
        console.log('Refund requested for package:', packageId);
        navigate(`/refunds/mcp/${packageId}`); 
    };

    useEffect(() => {
        if (packages.length > 0) {
            debouncedSearch(searchTerm);
        }
        return () => debouncedSearch.cancel();
    }, [searchTerm, debouncedSearch, packages]);

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    const formatCurrency = (amount) => {
        return `$${parseFloat(amount).toFixed(2)}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const renderRefundStatus = (pkg) => {
        const eligibility = pkg.is_eligible_for_refund;

        if (eligibility === 'refunded') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200">
                    Refunded
                </span>
            );
        } else if (eligibility === 'eligible') {
            return (
                <button
                    onClick={() => handleRefund(pkg.id)}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 text-white border border-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors shadow-sm"
                >
                    Refund
                </button>
            );
        } else {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200">
                    Ineligible
                </span>
            );
        }
    };

    if (loading) {
        return (
            <div className='[--header-height:calc(theme(spacing.14))]'>
                <SidebarProvider className='flex flex-col'>
                    <SiteHeader />
                    <div className='flex flex-1'>
                        <AppSidebar />
                        <SidebarInset>
                            <div className='flex flex-1 flex-col gap-4 p-4'>
                                <div className="flex items-center justify-center p-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <span className="ml-3 text-gray-600">Loading packages...</span>
                                </div>
                            </div>
                        </SidebarInset>
                    </div>
                </SidebarProvider>
            </div>
        );
    }

    return (
        <div className='[--header-height:calc(theme(spacing.14))]'>
            <SidebarProvider className='flex flex-col'>
                <SiteHeader />
                <div className='flex flex-1'>
                    <AppSidebar />
                    <SidebarInset>
                        <div className='flex flex-1 flex-col gap-4 p-4'>
                            <div className="max-w-6xl mx-auto w-full bg-white">
                                {/* Header Section */}
                                <div className="border-b border-gray-200 pb-6 mb-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h1 className="text-2xl font-semibold text-gray-900">Member Care Packages</h1>
                                            {memberName && (
                                                <p className="text-sm text-gray-600 mt-1">Member: {memberName}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Total Packages</p>
                                            <p className="text-2xl font-bold text-gray-900">{filteredPackages.length}</p>
                                            {searchTerm && (
                                                <p className="text-xs text-gray-400">of {packages.length} total</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {packages.length > 0 ? (
                                    <div className="space-y-4">
                                        {/* Search Bar */}
                                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Search packages by name, service, or employee..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                />
                                                {isSearching && (
                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                                    </div>
                                                )}
                                                {searchTerm && !isSearching && (
                                                    <button
                                                        onClick={() => setSearchTerm('')}
                                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                                    >
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>

                                            {searchError && (
                                                <div className="mt-3 p-3 text-red-600 bg-red-50 rounded-lg text-sm">
                                                    {searchError}
                                                </div>
                                            )}

                                            {searchTerm && (
                                                <div className="mt-3 text-sm text-gray-500">
                                                    {isSearching ? (
                                                        'Searching...'
                                                    ) : (
                                                        `Found ${filteredPackages.length} package${filteredPackages.length !== 1 ? 's' : ''} matching "${searchTerm}"`
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Table Header */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="grid grid-cols-13 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <div className="col-span-3">Package Details</div>
                                                <div className="col-span-2">Service Information</div>
                                                <div className="col-span-2">Financial Details</div>
                                                <div className="col-span-2">Dates</div>
                                                <div className="col-span-2">Staff</div>
                                                <div className="col-span-1">Quantity</div>
                                                <div className="col-span-1">Status</div>
                                            </div>
                                        </div>

                                        {/* Package List */}
                                        {filteredPackages.length > 0 ? (
                                            filteredPackages.map((pkg, index) => (
                                                <div key={pkg.id || index} className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
                                                    <div className="p-6">
                                                        <div className="grid grid-cols-13 gap-4 items-start">
                                                            {/* Package Details */}
                                                            <div className="col-span-3">
                                                                <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2">
                                                                    {pkg.package_name}
                                                                </h3>
                                                                {pkg.package_remarks && (
                                                                    <div className="mt-2">
                                                                        <p className="text-xs text-gray-500 mb-1">Remarks:</p>
                                                                        <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded border-l-2 border-blue-200">
                                                                            {pkg.package_remarks}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Service Information */}
                                                            <div className="col-span-2">
                                                                <div className="space-y-2">
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Service</p>
                                                                        <p className="text-sm font-medium text-gray-900">{pkg.service_name}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Unit Price</p>
                                                                        <p className="text-sm text-gray-700">{formatCurrency(pkg.price)}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Financial Details */}
                                                            <div className="col-span-2">
                                                                <div className="space-y-2">
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Total Price</p>
                                                                        <p className="text-lg font-bold text-gray-900">{formatCurrency(pkg.total_price)}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Discount</p>
                                                                        <p className="text-sm text-gray-700">
                                                                            {pkg.discount && parseFloat(pkg.discount) > 0
                                                                                ? `-${formatCurrency(pkg.discount)}`
                                                                                : 'No discount'
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Dates */}
                                                            <div className="col-span-2">
                                                                <div className="space-y-2">
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Created</p>
                                                                        <p className="text-sm text-gray-700">{formatDate(pkg.created_at)}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Updated</p>
                                                                        <p className="text-sm text-gray-700">{formatDate(pkg.updated_at)}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Staff */}
                                                            <div className="col-span-2">
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Handled By</p>
                                                                    <p className="text-sm font-medium text-gray-900">{pkg.employee_name}</p>
                                                                </div>
                                                            </div>

                                                            {/* Quantity */}
                                                            <div className="col-span-1">
                                                                <div className="text-center">
                                                                    <p className="text-xs text-gray-500 mb-1">No. of Services</p>
                                                                    <p className="text-2xl font-bold text-gray-900">{pkg.quantity}</p>
                                                                </div>
                                                            </div>

                                                            {/* Status Column */}
                                                            <div className="col-span-1 flex items-center justify-center">
                                                                {renderRefundStatus(pkg)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Bottom border for visual separation */}
                                                    <div className="border-t border-gray-100 bg-gray-50 px-6 py-2">
                                                        <div className="flex justify-between items-center text-xs text-gray-500">
                                                            <span>Package ID: #{pkg.id}</span>
                                                            <span>Last updated: {formatDate(pkg.updated_at)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
                                                <p className="text-gray-500">
                                                    {searchTerm
                                                        ? `No packages match your search for "${searchTerm}"`
                                                        : 'No packages to display'
                                                    }
                                                </p>
                                                {searchTerm && (
                                                    <button
                                                        onClick={() => setSearchTerm('')}
                                                        className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                                                    >
                                                        Clear search to show all packages
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h2.5" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
                                        <p className="text-gray-500">This member has no care packages associated with their account.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    );
};

export default MemberPackagesList;
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CreditCard, Package, TrendingUp } from 'lucide-react';
import { api } from '@/interceptors/axios';

const MemberCarePackageStatistics = () => {
  const [stats, setStats] = useState({
    pendingPayments: 0,
    Revenue: 0,
    packagesToday: 0,
    popularService: {
      name: 'No services',
      count: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.get(`/mcp/get-mcp`);
        const dfRevenue = await api.get(`/mcp/dr`);
        const revenue = parseFloat(dfRevenue.data.data) || 0;

        if (!response?.data) {
          throw new Error('Failed to fetch data');
        }

        const packages = response.data;

        // Calculate pending payments with safeguards
        const pendingPayments = packages.reduce((total, pkg) => {
          if (!pkg?.cs_status?.status_name) {
            return total;
          }

          if (pkg.cs_status.status_name === 'Invoice_Partially_Paid') {
            if (!pkg.cs_member_care_package_details || !Array.isArray(pkg.cs_member_care_package_details)) {
              return total;
            }

            const outstandingAmount = pkg.cs_member_care_package_details.reduce((sum, detail) => {
              if (detail?.cs_status?.status_name === 'Unpaid') {
                const detailAmount = parseFloat(detail.member_care_package_details_price);
                return !isNaN(detailAmount) ? sum + detailAmount : sum;
              }
              return sum;
            }, 0);

            return total + outstandingAmount;
          } else if (pkg.cs_status.status_name === 'Invoice_Unpaid') {
            const amount = parseFloat(pkg.member_care_package_total_amount);
            return !isNaN(amount) ? total + amount : total;
          }

          return total;
        }, 0);

        // Calculate packages created today with improved date handling
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const packagesToday = packages.reduce((count, pkg) => {
          if (!pkg.member_care_package_created_at) return count;

          const pkgDate = new Date(pkg.member_care_package_created_at);
          if (isNaN(pkgDate.getTime())) return count;

          pkgDate.setHours(0, 0, 0, 0);
          return pkgDate.getTime() === today.getTime() ? count + 1 : count;
        }, 0);

        // Calculate most popular service with improved error handling
        const serviceMap = new Map();
        packages.forEach((pkg) => {
          const details = pkg?.cs_member_care_package_details;
          if (!Array.isArray(details)) return;

          details.forEach((detail) => {
            const serviceName = detail?.cs_service?.service_name;
            if (serviceName && typeof serviceName === 'string') {
              serviceMap.set(serviceName, (serviceMap.get(serviceName) || 0) + 1);
            }
          });
        });

        let popularService = { name: 'No services', count: 0 };
        if (serviceMap.size > 0) {
          const sortedServices = Array.from(serviceMap.entries()).sort(([, a], [, b]) => b - a);
          popularService = {
            name: sortedServices[0][0],
            count: sortedServices[0][1],
          };
        }

        setStats({
          pendingPayments,
          Revenue: revenue,
          packagesToday,
          popularService,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError(error?.response?.data?.message || 'Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-50 rounded-md border border-red-200">
        <p className="font-medium">Error loading statistics</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const cards = [
    {
      title: 'Pending Payments',
      icon: <CreditCard className="w-6 h-6" />,
      value: formatCurrency(stats.pendingPayments),
      description: `Total unpaid invoices as of ${formatDate(new Date())}`,
    },
    {
      title: 'Deferred Revenue',
      icon: <CreditCard className="w-6 h-6" />,
      value: formatCurrency(stats.Revenue),
      description: `Total deferred revenue as of ${formatDate(new Date())}`,
    },
    {
      title: 'Packages Created Today',
      icon: <Package className="w-6 h-6" />,
      value: stats.packagesToday,
      description: `New packages created on ${formatDate(new Date())}`,
    },
    {
      title: 'Most Popular Service',
      icon: <TrendingUp className="w-6 h-6" />,
      content: (
        <div className="space-y-1">
          <p className="text-2xl font-bold text-gray-900 truncate max-w-[200px]">{stats.popularService.name}</p>
          <p className="text-sm text-gray-500">
            {`${stats.popularService.count} ${stats.popularService.count === 1 ? 'booking' : 'bookings'}`}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div data-testid="mcp-stats-cards" className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <Card
          key={index}
          data-testid="stats-card"
          className={`bg-white border border-gray-200 ${isLoading ? 'opacity-75' : ''}`}
        >
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-gray-900 gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">{card.icon}</div>
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {card.content ? (
              card.content
            ) : (
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-900">{isLoading ? '-' : card.value}</p>
                <p className="text-sm text-gray-500">{card.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MemberCarePackageStatistics;

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar, Users, TrendingUp } from 'lucide-react';
import { api } from '@/interceptors/axios';

const CarePackageStatistics = () => {
  const [stats, setStats] = useState({
    packagesToday: 0,
    totalMembers: 0,
    averagePrice: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [carePackagesResponse, membersResponse] = await Promise.all([
          api.get('/cp/get-cp'),
          api.get('/m/all')
        ]);

        if (!carePackagesResponse?.data || !membersResponse?.data) {
          throw new Error('Failed to fetch data');
        }

        // calculate packages created today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const packagesToday = carePackagesResponse.data.reduce((count, pkg) => {
          if (!pkg.care_package_created_at) return count;
          
          const pkgDate = new Date(pkg.care_package_created_at);
          pkgDate.setHours(0, 0, 0, 0);
          
          return pkgDate.getTime() === today.getTime() ? count + 1 : count;
        }, 0);

        // calculate average package price
        const totalPrice = carePackagesResponse.data.reduce((sum, pkg) => {
          const price = parseFloat(pkg.care_package_price);
          return !isNaN(price) ? sum + price : sum;
        }, 0);
        const averagePrice = carePackagesResponse.data.length > 0 
          ? totalPrice / carePackagesResponse.data.length 
          : 0;

        setStats({
          packagesToday,
          totalMembers: membersResponse.data.length,
          averagePrice
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

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const cards = [
    {
      title: "Packages Created Today",
      icon: <Calendar className="w-6 h-6" />,
      value: stats.packagesToday,
      description: `New packages created as of ${formatDate(new Date())}`
    },
    {
      title: "Total Members",
      icon: <Users className="w-6 h-6" />,
      value: stats.totalMembers,
      description: `Registered members as of ${formatDate(new Date())}`
    },
    {
      title: "Average Package Price",
      icon: <TrendingUp className="w-6 h-6" />,
      value: `$${stats.averagePrice.toFixed(2)}`,
      description: "Average price across all packages"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => (
        <Card 
          key={index} 
          className={`bg-white border border-gray-200 ${isLoading ? 'opacity-75' : ''}`}
        >
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-gray-900 gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                {card.icon}
              </div>
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">
              {isLoading ? "-" : card.value}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CarePackageStatistics;
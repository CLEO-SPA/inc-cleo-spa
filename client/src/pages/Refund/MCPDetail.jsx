import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '@/services/refundService';

const MCPDetail = () => {
  const { packageId } = useParams();
  const [packageData, setPackageData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPackageDetails = async () => {
      try {
        const data = await api.getPackageDetails(packageId);
        setPackageData(data);
      } catch (error) {
        console.error('Error fetching package details:', error);
        navigate('/refunds');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPackageDetails();
  }, [packageId, navigate]);

  const handleProcessRefund = async (serviceId) => {
    if (!remarks.trim()) {
      setError('Remarks are required');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await api.processRefund(packageId, remarks);
      // Refresh data after successful refund
      const updatedData = await api.getPackageDetails(packageId);
      setPackageData(updatedData);
      setRemarks('');
      // Optional: Show success message
      alert('Refund processed successfully!');
    } catch (err) {
      console.error('Refund processing failed:', err);
      setError(err.response?.data?.message || 'Failed to process refund');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <div className="p-4">Loading package details...</div>;
  if (!packageData) return <div className="p-4">Package not found</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{packageData.package_name}</h1>
      
      {/* Remarks Input Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Refund Remarks</h2>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Enter refund reason (e.g., Client requested full refund due to allergy reaction)"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {/* Services List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Services</h2>
        <div className="space-y-4">
          {packageData.services?.map(service => (
            <div key={service.service_id} className="border rounded-lg p-4">
              <h3 className="font-medium text-lg">{service.service_name}</h3>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <span className="text-gray-600">Purchased:</span> {service.totals.purchased}
                </div>
                <div>
                  <span className="text-gray-600">Consumed:</span> {service.totals.consumed}
                </div>
                <div>
                  <span className="text-gray-600">Refunded:</span> {service.totals.refunded}
                </div>
                <div>
                  <span className="text-gray-600">Remaining:</span> {service.totals.remaining}
                </div>
              </div>
              
              {service.is_eligible_for_refund && (
                <button
                  onClick={() => handleProcessRefund(service.service_id)}
                  disabled={isProcessing}
                  className={`mt-4 px-4 py-2 text-white rounded transition-colors ${
                    isProcessing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isProcessing ? 'Processing...' : 'Process Refund'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MCPDetail;
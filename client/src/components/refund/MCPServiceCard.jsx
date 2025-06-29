import { useNavigate } from 'react-router-dom';

const MCPServiceCard = ({ service, packageId, memberId }) => {
  const navigate = useNavigate();
  
  const handleRefund = () => {
    navigate(`/refunds/process/${packageId || memberId}/${service.service_id}`);
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold">{service.service_name}</h3>
      <div className="grid grid-cols-2 gap-2 my-2">
        <div>Purchased: <span className="font-medium">{service.totals.purchased}</span></div>
        <div>Consumed: <span className="font-medium">{service.totals.consumed}</span></div>
        <div>Refunded: <span className="font-medium">{service.totals.refunded}</span></div>
        <div>Remaining: <span className="font-medium">{service.totals.remaining}</span></div>
      </div>
      <button
        onClick={handleRefund}
        disabled={!service.is_eligible_for_refund}
        className={`mt-2 p-2 rounded text-white ${
          service.is_eligible_for_refund 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        {service.is_eligible_for_refund ? 'Process Refund' : 'Not Eligible'}
      </button>
    </div>
  );
};

export default MCPServiceCard;
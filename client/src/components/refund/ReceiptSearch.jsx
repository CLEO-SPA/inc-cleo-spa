import { useState } from 'react';

const ReceiptSearch = ({ onSearch }) => {
  const [receipt, setReceipt] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!receipt.trim()) {
      setError('Please enter a receipt number.');
      return;
    }
    setError('');
    onSearch(receipt.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="receipt" className="block text-sm font-medium text-gray-700">
          Search Ad-hoc Service Refund Transaction by Receipt No.
        </label>
        <div className="relative flex gap-2">
          <input
            id="receipt"
            type="text"
            value={receipt}
            onChange={(e) => setReceipt(e.target.value)}
            placeholder="e.g. RCPT-123456"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            Search
          </button>
        </div>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    </form>
  );
};

export default ReceiptSearch;
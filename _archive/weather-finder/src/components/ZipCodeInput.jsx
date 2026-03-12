import { useState } from 'react';

export default function ZipCodeInput({ onSubmit, loading }) {
  const [zipCode, setZipCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (zipCode.length === 5) {
      onSubmit(zipCode);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex gap-4">
        <input
          type="text"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
          placeholder="Enter ZIP code"
          pattern="[0-9]{5}"
          maxLength="5"
          className="flex-1 px-4 py-2 rounded-lg border-2 border-transparent focus:border-purple-400 outline-none"
          required
        />
        <button
          type="submit"
          disabled={loading || zipCode.length !== 5}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Search'}
        </button>
      </div>
    </form>
  );
}
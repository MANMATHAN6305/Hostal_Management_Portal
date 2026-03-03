import { useEffect, useState } from 'react';
import { studentApi } from '@/lib/api';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';

const statusColors: Record<string, string> = {
  'COMPLETED': 'bg-green-100 text-green-800',
  'PENDING': 'bg-yellow-100 text-yellow-800',
  'FAILED': 'bg-red-100 text-red-800',
  'CANCELLED': 'bg-gray-100 text-gray-800'
};

export default function StudentPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const res = await studentApi.getPayments();
        setPayments(res.payments || []);
        setError('');
      } catch (e: any) {
        setError(e?.message || 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    };
    loadPayments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const totalAmount = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingAmount = payments
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
        <p className="text-gray-600 mt-1">Track your hostel fee payments</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-6 py-4 shadow-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {payments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Paid</p>
                  <p className="text-3xl font-bold text-green-600">Rs {totalAmount.toLocaleString()}</p>
                </div>
                <span className="text-3xl">✓</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">Rs {pendingAmount.toLocaleString()}</p>
                </div>
                <span className="text-3xl">⏳</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Transactions</p>
                  <p className="text-3xl font-bold text-blue-600">{payments.length}</p>
                </div>
                <span className="text-3xl">💳</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payments Table/List */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Payment Records</h2>
        {payments.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No payments recorded yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="hidden md:block">
            <Card className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Payment Method</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        Rs {p.amount?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {p.mode || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          statusColors[p.status] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {p.referenceNumber || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* Mobile View */}
        {payments.length > 0 && (
          <div className="md:hidden space-y-3">
            {payments.map((p) => (
              <Card key={p.id}>
                <CardContent>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">Rs {p.amount?.toLocaleString() || '0'}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      statusColors[p.status] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Method:</span>
                      <span className="font-semibold text-gray-900">{p.mode || 'N/A'}</span>
                    </div>
                    {p.referenceNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reference:</span>
                        <span className="font-mono text-gray-900">{p.referenceNumber}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

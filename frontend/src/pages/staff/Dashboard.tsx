import { useEffect, useState } from 'react';
import { staffApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';

export default function StaffDashboard() {
  const [stats, setStats] = useState<any>({});
  useEffect(() => {
    staffApi.getDashboard().then((res) => setStats(res.stats || {}));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Staff Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(stats).map(([k, v]) => (
          <Card key={k}><CardContent><p className="text-sm text-gray-500">{k}</p><p className="text-2xl font-semibold">{String(v)}</p></CardContent></Card>
        ))}
      </div>
    </div>
  );
}

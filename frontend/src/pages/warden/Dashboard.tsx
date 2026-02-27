import { useEffect, useState } from 'react';
import { wardenApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';

export default function WardenDashboard() {
  const [stats, setStats] = useState<any>({});
  useEffect(() => {
    wardenApi.getDashboard().then((res) => setStats(res.stats || {}));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Warden Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(stats).map(([k, v]) => (
          <Card key={k}><CardContent><p className="text-sm text-gray-500">{k}</p><p className="text-2xl font-semibold">{String(v)}</p></CardContent></Card>
        ))}
      </div>
    </div>
  );
}

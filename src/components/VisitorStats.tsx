import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Eye, Globe, MapPin, Clock, Monitor } from "lucide-react";

interface VisitorLog {
  id: string;
  ip_address: string;
  user_agent: string;
  page_url: string;
  referrer: string;
  country: string | null;
  city: string | null;
  visited_at: string;
}

export const VisitorStats = () => {
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [todayVisitors, setTodayVisitors] = useState(0);
  const [recentVisitors, setRecentVisitors] = useState<VisitorLog[]>([]);
  const [uniqueIPs, setUniqueIPs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisitorStats();
  }, []);

  const fetchVisitorStats = async () => {
    setLoading(true);
    try {
      // Get all visitors
      const { data: allVisitors, error: allError } = await supabase
        .from('visitor_logs' as any)
        .select('*')
        .order('visited_at', { ascending: false });

      if (allError) throw allError;

      const visitors = (allVisitors as any) || [];
      setTotalVisitors(visitors.length);

      // Get today's visitors
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = visitors.filter((v: VisitorLog) => 
        new Date(v.visited_at) >= today
      ).length;
      setTodayVisitors(todayCount);

      // Get unique IPs
      const ips = new Set(visitors.map((v: VisitorLog) => v.ip_address));
      setUniqueIPs(ips.size);

      // Get recent 10 visitors
      setRecentVisitors(visitors.slice(0, 10));
    } catch (error) {
      console.error('Error fetching visitor stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getBrowserFromUserAgent = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Loading visitor stats...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Eye className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Visitors</p>
              <p className="text-2xl font-bold text-primary">{totalVisitors}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Visitors</p>
              <p className="text-2xl font-bold text-green-500">{todayVisitors}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Globe className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unique IPs</p>
              <p className="text-2xl font-bold text-purple-500">{uniqueIPs}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Visitors Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Recent Visitors
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left">
                <th className="pb-3 font-semibold">IP Address</th>
                <th className="pb-3 font-semibold">Location</th>
                <th className="pb-3 font-semibold">Browser</th>
                <th className="pb-3 font-semibold">Referrer</th>
                <th className="pb-3 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentVisitors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No visitors yet
                  </td>
                </tr>
              ) : (
                recentVisitors.map((visitor) => (
                  <tr key={visitor.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 font-mono text-xs">
                      {visitor.ip_address}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {visitor.city && visitor.country 
                            ? `${visitor.city}, ${visitor.country}`
                            : visitor.country || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      {getBrowserFromUserAgent(visitor.user_agent)}
                    </td>
                    <td className="py-3 text-muted-foreground truncate max-w-[150px]">
                      {visitor.referrer}
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {formatDate(visitor.visited_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

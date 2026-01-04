import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  TrendingUp, 
  Calendar, 
  ArrowRight,
  Wallet,
  Building,
  Target,
  Loader2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface DonationWithProject {
  id: string;
  amount: number;
  created_at: string;
  message: string | null;
  project: {
    id: string;
    name: string;
    ngo: {
      name: string;
    };
  };
}

// Sample data for demonstration
const SAMPLE_DONATIONS: DonationWithProject[] = [
  {
    id: 'sample-1',
    amount: 5000,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    message: 'Keep up the great work!',
    project: { id: 'p1', name: 'Clean Water Initiative', ngo: { name: 'WaterAid Foundation' } }
  },
  {
    id: 'sample-2',
    amount: 2500,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    message: 'Happy to support education',
    project: { id: 'p2', name: 'Rural Education Program', ngo: { name: 'Teach For All' } }
  },
  {
    id: 'sample-3',
    amount: 10000,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    message: null,
    project: { id: 'p3', name: 'Healthcare Access Project', ngo: { name: 'Health First NGO' } }
  },
  {
    id: 'sample-4',
    amount: 3000,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    message: 'For the children',
    project: { id: 'p4', name: 'Child Nutrition Program', ngo: { name: 'WaterAid Foundation' } }
  },
  {
    id: 'sample-5',
    amount: 7500,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    message: 'Great cause!',
    project: { id: 'p5', name: 'Women Empowerment Initiative', ngo: { name: 'Empower Her' } }
  },
];

export default function DonorDashboard() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<DonationWithProject[]>([]);
  const [stats, setStats] = useState({
    totalDonated: 0,
    projectsSupported: 0,
    ngosSupported: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [usingSampleData, setUsingSampleData] = useState(false);

  useEffect(() => {
    if (!loading && (!user || role !== 'donor')) {
      navigate('/auth');
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDonations();
    }
  }, [user]);

  const fetchDonations = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('donations_public')
      .select(`
        id,
        amount,
        created_at,
        message,
        project:projects (
          id,
          name,
          ngo:ngos (
            name
          )
        )
      `)
      .eq('donor_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching donations:', error);
    }
    
    // Use real data if available, otherwise use sample data
    const hasRealData = data && data.length > 0;
    const displayData = hasRealData ? data : SAMPLE_DONATIONS;
    setUsingSampleData(!hasRealData);

    const formattedData = displayData.map((d: any) => ({
      ...d,
      project: {
        ...d.project,
        ngo: d.project?.ngo
      }
    }));
    setDonations(formattedData);
    
    // Calculate stats
    const totalDonated = formattedData.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
    const projectIds = new Set(formattedData.map((d: any) => d.project?.id));
    const ngoNames = new Set(formattedData.map((d: any) => d.project?.ngo?.name));
    
    setStats({
      totalDonated,
      projectsSupported: projectIds.size,
      ngosSupported: ngoNames.size,
    });
    
    setIsLoading(false);
  };

  // Chart data
  const pieData = donations.reduce((acc: any[], d) => {
    const ngoName = d.project?.ngo?.name || 'Unknown';
    const existing = acc.find(item => item.name === ngoName);
    if (existing) {
      existing.value += Number(d.amount);
    } else {
      acc.push({ name: ngoName, value: Number(d.amount) });
    }
    return acc;
  }, []);

  const COLORS = ['hsl(215, 80%, 35%)', 'hsl(160, 70%, 40%)', 'hsl(38, 95%, 55%)', 'hsl(280, 65%, 55%)'];

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Donor Dashboard</h1>
            <p className="text-muted-foreground">Track your donations and their impact</p>
          </div>
          <Button asChild>
            <Link to="/projects">
              Browse Projects
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Sample Data Banner */}
        {usingSampleData && (
          <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span><strong>Sample Data:</strong> This is how your dashboard will look once you start donating. <Link to="/projects" className="underline font-medium">Browse projects to make your first donation!</Link></span>
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Donated
              </CardTitle>
              <Wallet className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalDonated.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{usingSampleData ? 'Sample data' : 'Lifetime contributions'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Projects Supported
              </CardTitle>
              <Target className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.projectsSupported}</div>
              <p className="text-xs text-muted-foreground">Unique projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                NGOs Supported
              </CardTitle>
              <Building className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ngosSupported}</div>
              <p className="text-xs text-muted-foreground">Organizations helped</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Recent Donations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Donations by NGO Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Donations by Organization</CardTitle>
              <CardDescription>Distribution of your contributions</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  No donations yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Donations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Donations</CardTitle>
              <CardDescription>Your latest contributions</CardDescription>
            </CardHeader>
            <CardContent>
              {donations.length > 0 ? (
                <div className="space-y-4">
                  {donations.slice(0, 5).map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Heart className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{donation.project?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {donation.project?.ngo?.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-accent">₹{Number(donation.amount).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(donation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[250px] text-center">
                  <Heart className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-4">You haven't made any donations yet</p>
                  <Button asChild variant="outline">
                    <Link to="/projects">Find a Project</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

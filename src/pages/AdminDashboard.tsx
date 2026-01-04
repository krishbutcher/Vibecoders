import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { sendVerificationNotification } from '@/lib/notifications';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Building, 
  Users,
  Wallet,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  Eye
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts';

interface NGO {
  id: string;
  name: string;
  description: string | null;
  is_verified: boolean;
  created_at: string;
  user_id: string;
}

interface FlaggedExpense {
  id: string;
  amount: number;
  purpose: string;
  is_flagged: boolean;
  flagged_reason: string | null;
  project: {
    name: string;
    ngo: {
      name: string;
    };
  };
}

export default function AdminDashboard() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Enable real-time notifications
  useRealtimeNotifications();
  
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [expenses, setExpenses] = useState<FlaggedExpense[]>([]);
  const [stats, setStats] = useState({
    totalNgos: 0,
    verifiedNgos: 0,
    totalDonations: 0,
    totalExpenses: 0,
    flaggedExpenses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      navigate('/auth');
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (user && role === 'admin') {
      fetchAdminData();
    }
  }, [user, role]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    
    // Fetch all NGOs
    const { data: ngosData } = await supabase
      .from('ngos')
      .select('*')
      .order('created_at', { ascending: false });

    if (ngosData) {
      setNgos(ngosData);
      setStats(prev => ({
        ...prev,
        totalNgos: ngosData.length,
        verifiedNgos: ngosData.filter(n => n.is_verified).length,
      }));
    }

    // Fetch donations total
    const { data: donations } = await supabase
      .from('donations')
      .select('amount');

    if (donations) {
      const total = donations.reduce((sum, d) => sum + Number(d.amount), 0);
      setStats(prev => ({ ...prev, totalDonations: total }));
    }

    // Fetch expenses with flagged ones
    const { data: expensesData } = await supabase
      .from('expenses')
      .select(`
        id,
        amount,
        purpose,
        is_flagged,
        flagged_reason,
        project:projects (
          name,
          ngo:ngos (
            name
          )
        )
      `)
      .order('is_flagged', { ascending: false });

    if (expensesData) {
      const formatted = expensesData.map((e: any) => ({
        ...e,
        project: {
          name: e.project?.name,
          ngo: e.project?.ngo
        }
      }));
      setExpenses(formatted);
      const totalExp = expensesData.reduce((sum, e) => sum + Number(e.amount), 0);
      const flaggedCount = expensesData.filter((e: any) => e.is_flagged).length;
      setStats(prev => ({ ...prev, totalExpenses: totalExp, flaggedExpenses: flaggedCount }));
    }

    setIsLoading(false);
  };

  const handleVerifyNgo = async (ngoId: string, verify: boolean) => {
    setProcessingId(ngoId);
    
    // Get NGO details before update
    const ngoToUpdate = ngos.find(n => n.id === ngoId);
    
    const { error } = await supabase
      .from('ngos')
      .update({ 
        is_verified: verify,
        verified_at: verify ? new Date().toISOString() : null,
        verified_by: verify ? user?.id : null,
      })
      .eq('id', ngoId);

    setProcessingId(null);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setNgos(prev => prev.map(n => n.id === ngoId ? { ...n, is_verified: verify } : n));
      toast({ 
        title: verify ? 'NGO Verified' : 'Verification Revoked',
        description: verify ? 'The NGO can now receive donations.' : 'The NGO verification has been revoked.',
      });
      
      // Send email notification to NGO
      if (ngoToUpdate) {
        const { data: ngoProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', ngoToUpdate.user_id)
          .maybeSingle();
        
        if (ngoProfile?.email) {
          sendVerificationNotification({
            ngoEmail: ngoProfile.email,
            ngoName: ngoToUpdate.name,
            verified: verify,
          });
        }
      }
    }
  };

  const handleFlagExpense = async (expenseId: string, flag: boolean, reason?: string) => {
    setProcessingId(expenseId);
    
    const { error } = await supabase
      .from('expenses')
      .update({ 
        is_flagged: flag,
        flagged_reason: flag ? reason || 'Flagged for review' : null,
        flagged_by: flag ? user?.id : null,
      })
      .eq('id', expenseId);

    setProcessingId(null);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, is_flagged: flag, flagged_reason: flag ? reason || 'Flagged for review' : null } : e));
      toast({ 
        title: flag ? 'Expense Flagged' : 'Flag Removed',
        description: flag ? 'This expense has been flagged for review.' : 'The flag has been removed.',
      });
    }
  };

  // Chart data
  const utilizationData = [
    { name: 'Donations', value: stats.totalDonations },
    { name: 'Expenses', value: stats.totalExpenses },
    { name: 'Remaining', value: Math.max(0, stats.totalDonations - stats.totalExpenses) },
  ];

  const COLORS = ['hsl(160, 70%, 40%)', 'hsl(215, 80%, 35%)', 'hsl(38, 95%, 55%)'];

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
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Monitor and manage the platform</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total NGOs</CardTitle>
              <Building className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNgos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Verified</CardTitle>
              <CheckCircle className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.verifiedNgos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Donations</CardTitle>
              <TrendingUp className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalDonations.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              <Wallet className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalExpenses.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Flagged</CardTitle>
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.flaggedExpenses}</div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
            <CardDescription>Donations vs Expenses across all NGOs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={utilizationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}
                >
                  {utilizationData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabs for Management */}
        <Tabs defaultValue="ngos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ngos">NGO Verification</TabsTrigger>
            <TabsTrigger value="expenses">Expense Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="ngos">
            <Card>
              <CardHeader>
                <CardTitle>NGO Management</CardTitle>
                <CardDescription>Verify and manage registered NGOs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ngos.map((ngo) => (
                    <div key={ngo.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{ngo.name}</h3>
                            {ngo.is_verified ? (
                              <Badge className="bg-success text-success-foreground">Verified</Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {ngo.description || 'No description provided'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ngo.is_verified ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleVerifyNgo(ngo.id, false)}
                            disabled={processingId === ngo.id}
                          >
                            {processingId === ngo.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 mr-1" />
                                Revoke
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button 
                            size="sm"
                            onClick={() => handleVerifyNgo(ngo.id, true)}
                            disabled={processingId === ngo.id}
                          >
                            {processingId === ngo.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Verify
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {ngos.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      No NGOs registered yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>Expense Monitoring</CardTitle>
                <CardDescription>Review and flag suspicious expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <div 
                      key={expense.id} 
                      className={`flex items-center justify-between p-4 rounded-lg border ${expense.is_flagged ? 'border-destructive/50 bg-destructive/5' : ''}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">₹{Number(expense.amount).toLocaleString()}</h3>
                          {expense.is_flagged && (
                            <Badge variant="destructive">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Flagged
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{expense.purpose}</p>
                        <p className="text-xs text-muted-foreground">
                          {expense.project?.name} • {expense.project?.ngo?.name}
                        </p>
                        {expense.flagged_reason && (
                          <p className="text-xs text-destructive mt-1">Reason: {expense.flagged_reason}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {expense.is_flagged ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleFlagExpense(expense.id, false)}
                            disabled={processingId === expense.id}
                          >
                            {processingId === expense.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Remove Flag'
                            )}
                          </Button>
                        ) : (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleFlagExpense(expense.id, true, 'Suspicious activity detected')}
                            disabled={processingId === expense.id}
                          >
                            {processingId === expense.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Flag
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      No expenses recorded yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { sendDonationNotification } from '@/lib/notifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, 
  Target,
  Building,
  Loader2,
  CheckCircle,
  Calendar,
  FileText,
  Wallet,
  Users,
  ExternalLink
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  target_amount: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  ngo: {
    id: string;
    name: string;
    description: string | null;
    is_verified: boolean;
  };
}

interface Expense {
  id: string;
  amount: number;
  purpose: string;
  description: string | null;
  expense_date: string;
  proof_url: string | null;
  proof_type: string | null;
}

interface Donation {
  id: string;
  amount: number;
  message: string | null;
  created_at: string;
  is_anonymous: boolean;
  profile: {
    full_name: string;
  } | null;
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState({
    totalDonated: 0,
    totalSpent: 0,
    donorsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showDonateDialog, setShowDonateDialog] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProjectData();
    }
  }, [id]);

  const fetchProjectData = async () => {
    setIsLoading(true);

    // Fetch project with NGO
    const { data: projectData, error } = await supabase
      .from('projects')
      .select(`
        *,
        ngo:ngos (
          id,
          name,
          description,
          is_verified
        )
      `)
      .eq('id', id)
      .single();

    if (error || !projectData) {
      console.error('Error fetching project:', error);
      navigate('/projects');
      return;
    }

    setProject(projectData);

    // Fetch expenses
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('*')
      .eq('project_id', id)
      .order('expense_date', { ascending: false });

    if (expensesData) {
      setExpenses(expensesData);
    }

    // Fetch donations with profiles
    const { data: donationsData } = await supabase
      .from('donations')
      .select(`
        id,
        amount,
        message,
        created_at,
        is_anonymous,
        donor_id
      `)
      .eq('project_id', id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (donationsData) {
      // Fetch profiles for non-anonymous donations
      const donationsWithProfiles = await Promise.all(
        donationsData.map(async (donation: any) => {
          if (!donation.is_anonymous && donation.donor_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', donation.donor_id)
              .maybeSingle();
            return { ...donation, profile };
          }
          return { ...donation, profile: null };
        })
      );
      setDonations(donationsWithProfiles);

      // Calculate stats
      const totalDonated = donationsData.reduce((sum, d) => sum + Number(d.amount), 0);
      const uniqueDonors = new Set(donationsData.map(d => d.donor_id)).size;
      const totalSpent = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      setStats({
        totalDonated,
        totalSpent,
        donorsCount: uniqueDonors,
      });
    }

    setIsLoading(false);
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate('/auth');
      return;
    }

    if (role !== 'donor') {
      toast({
        variant: 'destructive',
        title: 'Not Allowed',
        description: 'Only donor accounts can make donations.',
      });
      return;
    }

    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid donation amount.',
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('donations')
      .insert({
        donor_id: user.id,
        project_id: id,
        amount: amount,
        message: donationMessage || null,
        status: 'completed',
        transaction_id: `TXN${Date.now()}`,
      });

    setIsSubmitting(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Donation Failed',
        description: error.message,
      });
    } else {
      toast({
        title: 'Thank You! 🎉',
        description: `Your donation of ₹${amount.toLocaleString()} was successful.`,
      });
      
      // Send email notification to NGO (async, don't block)
      if (project?.ngo) {
        const { data: ngoProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', (await supabase.from('ngos').select('user_id').eq('id', project.ngo.id).single()).data?.user_id)
          .maybeSingle();
        
        if (ngoProfile?.email) {
          const { data: donorProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', user.id)
            .maybeSingle();
          
          sendDonationNotification({
            ngoEmail: ngoProfile.email,
            projectName: project.name,
            amount: amount,
            donorName: donorProfile?.full_name,
          });
        }
      }
      
      setShowDonateDialog(false);
      setDonationAmount('');
      setDonationMessage('');
      fetchProjectData();
    }
  };

  const getProgress = () => {
    if (!project?.target_amount || project.target_amount === 0) return 0;
    return Math.min((stats.totalDonated / project.target_amount) * 100, 100);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Project Not Found</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">
                  <Building className="w-3 h-3 mr-1" />
                  {project.ngo?.name}
                </Badge>
                {project.ngo?.is_verified && (
                  <Badge className="bg-success/10 text-success border-success/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-4">{project.name}</h1>
              <p className="text-muted-foreground">
                {project.description || 'Help support this important cause and make a difference.'}
              </p>
            </div>

            {/* Tabs for Details */}
            <Tabs defaultValue="expenses" className="space-y-4">
              <TabsList>
                <TabsTrigger value="expenses">Fund Utilization</TabsTrigger>
                <TabsTrigger value="donations">Recent Donations</TabsTrigger>
              </TabsList>

              <TabsContent value="expenses">
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Breakdown</CardTitle>
                    <CardDescription>
                      Track how donated funds are being utilized
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {expenses.length > 0 ? (
                      <div className="space-y-4">
                        {expenses.map((expense) => (
                          <div key={expense.id} className="flex items-start justify-between p-4 rounded-lg border">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                                <Wallet className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{expense.purpose}</p>
                                <p className="text-sm text-muted-foreground">
                                  {expense.description || 'No additional details'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  <Calendar className="w-3 h-3 inline mr-1" />
                                  {new Date(expense.expense_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">₹{Number(expense.amount).toLocaleString()}</p>
                              {expense.proof_url && (
                                <a 
                                  href={expense.proof_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary flex items-center gap-1 mt-1"
                                >
                                  <FileText className="w-3 h-3" />
                                  View Proof
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No expenses recorded yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="donations">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Donations</CardTitle>
                    <CardDescription>
                      Thank you to all our generous donors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {donations.length > 0 ? (
                      <div className="space-y-4">
                        {donations.map((donation) => (
                          <div key={donation.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                                <Heart className="w-5 h-5 text-accent" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {donation.is_anonymous 
                                    ? 'Anonymous Donor' 
                                    : donation.profile?.full_name || 'A Kind Donor'}
                                </p>
                                {donation.message && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    "{donation.message}"
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-accent">
                                ₹{Number(donation.amount).toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(donation.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Heart className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>Be the first to donate!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Donation Card */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Fundraising Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-2xl font-bold">₹{stats.totalDonated.toLocaleString()}</span>
                    <span className="text-muted-foreground">
                      of ₹{Number(project.target_amount).toLocaleString()}
                    </span>
                  </div>
                  <Progress value={getProgress()} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {getProgress().toFixed(0)}% of goal reached
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="text-lg font-semibold">{stats.donorsCount}</p>
                    <p className="text-xs text-muted-foreground">Donors</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <Wallet className="w-5 h-5 mx-auto mb-1 text-accent" />
                    <p className="text-lg font-semibold">₹{stats.totalSpent.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Utilized</p>
                  </div>
                </div>

                {/* Donate Button */}
                <Dialog open={showDonateDialog} onOpenChange={setShowDonateDialog}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full">
                      <Heart className="w-5 h-5 mr-2" />
                      Donate Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Make a Donation</DialogTitle>
                      <DialogDescription>
                        Support "{project.name}" and help make a difference.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleDonate} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Donation Amount (₹)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="Enter amount"
                          value={donationAmount}
                          onChange={(e) => setDonationAmount(e.target.value)}
                          min="1"
                          required
                        />
                        <div className="flex gap-2">
                          {[500, 1000, 2500, 5000].map((amt) => (
                            <Button
                              key={amt}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setDonationAmount(amt.toString())}
                            >
                              ₹{amt}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Message (Optional)</Label>
                        <Textarea
                          id="message"
                          placeholder="Leave a message of support..."
                          value={donationMessage}
                          onChange={(e) => setDonationMessage(e.target.value)}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Heart className="w-4 h-4 mr-2" />
                        )}
                        Complete Donation
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        This is a mock payment for demonstration purposes.
                      </p>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus,
  Loader2,
  Calendar,
  Wallet,
  Users,
  FileText,
  Upload,
  ArrowLeft,
  TrendingUp
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  target_amount: number;
  status: string;
}

interface Expense {
  id: string;
  amount: number;
  purpose: string;
  description: string | null;
  expense_date: string;
  proof_url: string | null;
}

export default function NgoProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState({
    totalDonated: 0,
    totalSpent: 0,
    donorsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    purpose: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || role !== 'ngo')) {
      navigate('/auth');
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (id && user) {
      fetchProjectData();
    }
  }, [id, user]);

  const fetchProjectData = async () => {
    setIsLoading(true);

    // Fetch project
    const { data: projectData, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !projectData) {
      console.error('Error fetching project:', error);
      navigate('/ngo');
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

    // Fetch donations
    const { data: donations } = await supabase
      .from('donations')
      .select('amount, donor_id')
      .eq('project_id', id)
      .eq('status', 'completed');

    if (donations) {
      const totalDonated = donations.reduce((sum, d) => sum + Number(d.amount), 0);
      const uniqueDonors = new Set(donations.map(d => d.donor_id)).size;
      const totalSpent = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      setStats({
        totalDonated,
        totalSpent,
        donorsCount: uniqueDonors,
      });
    }

    setIsLoading(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(expenseForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid expense amount.',
      });
      return;
    }

    setIsSubmitting(true);

    let proofUrl = null;

    // Upload proof file if provided
    if (proofFile) {
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('expense-proofs')
        .upload(fileName, proofFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: 'Failed to upload proof document.',
        });
      } else {
        const { data: urlData } = supabase.storage
          .from('expense-proofs')
          .getPublicUrl(fileName);
        proofUrl = urlData.publicUrl;
      }
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        project_id: id,
        amount: amount,
        purpose: expenseForm.purpose,
        description: expenseForm.description || null,
        expense_date: expenseForm.expense_date,
        proof_url: proofUrl,
        proof_type: proofFile ? (proofFile.type.includes('pdf') ? 'pdf' : 'image') : null,
      })
      .select()
      .single();

    setIsSubmitting(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      setExpenses(prev => [data, ...prev]);
      setStats(prev => ({ ...prev, totalSpent: prev.totalSpent + amount }));
      setShowExpenseDialog(false);
      setExpenseForm({
        amount: '',
        purpose: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
      });
      setProofFile(null);
      toast({
        title: 'Expense Added',
        description: 'Fund utilization has been recorded.',
      });
    }
  };

  const getProgress = () => {
    if (!project?.target_amount || project.target_amount === 0) return 0;
    return Math.min((stats.totalDonated / project.target_amount) * 100, 100);
  };

  const getUtilization = () => {
    if (stats.totalDonated === 0) return 0;
    return Math.min((stats.totalSpent / stats.totalDonated) * 100, 100);
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/ngo')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">{project.description || 'No description'}</p>
          </div>
          <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Expense</DialogTitle>
                <DialogDescription>
                  Add fund utilization details for transparency.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-amount">Amount (₹) *</Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-purpose">Purpose *</Label>
                  <Input
                    id="expense-purpose"
                    value={expenseForm.purpose}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, purpose: e.target.value }))}
                    placeholder="e.g., Medical supplies"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-description">Description</Label>
                  <Textarea
                    id="expense-description"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional details..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-date">Date</Label>
                  <Input
                    id="expense-date"
                    type="date"
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, expense_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-proof">Upload Proof (Image/PDF)</Label>
                  <Input
                    id="expense-proof"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Submit Expense
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Received
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">₹{stats.totalDonated.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Utilized
              </CardTitle>
              <Wallet className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalSpent.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Remaining
              </CardTitle>
              <Wallet className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                ₹{(stats.totalDonated - stats.totalSpent).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Donors
              </CardTitle>
              <Users className="w-4 h-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.donorsCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Fundraising Progress</CardTitle>
              <CardDescription>Target: ₹{Number(project.target_amount).toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={getProgress()} className="h-3 mb-2" />
              <p className="text-sm text-muted-foreground">{getProgress().toFixed(0)}% of goal reached</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Fund Utilization</CardTitle>
              <CardDescription>How much of received funds have been used</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={getUtilization()} className="h-3 mb-2" />
              <p className="text-sm text-muted-foreground">{getUtilization().toFixed(0)}% of funds utilized</p>
            </CardContent>
          </Card>
        </div>

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <CardTitle>Expense History</CardTitle>
            <CardDescription>All recorded fund utilization</CardDescription>
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
                          className="text-xs text-primary flex items-center gap-1 mt-1 justify-end"
                        >
                          <FileText className="w-3 h-3" />
                          View Proof
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="mb-4">No expenses recorded yet</p>
                <Button onClick={() => setShowExpenseDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Expense
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

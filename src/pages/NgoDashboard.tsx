import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  TrendingUp, 
  Users,
  Wallet,
  FolderOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

interface Project {
  id: string;
  name: string;
  description: string | null;
  target_amount: number;
  status: string;
  created_at: string;
}

interface NGO {
  id: string;
  name: string;
  description: string | null;
  is_verified: boolean;
}

export default function NgoDashboard() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Enable real-time notifications
  useRealtimeNotifications();
  
  const [ngo, setNgo] = useState<NGO | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    totalReceived: 0,
    totalSpent: 0,
    donorsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showNgoDialog, setShowNgoDialog] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [ngoForm, setNgoForm] = useState({ name: '', description: '', mission: '', address: '' });
  const [projectForm, setProjectForm] = useState({ name: '', description: '', target_amount: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || role !== 'ngo')) {
      navigate('/auth');
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchNgoData();
    }
  }, [user]);

  const fetchNgoData = async () => {
    setIsLoading(true);
    
    // Fetch NGO
    const { data: ngoData, error: ngoError } = await supabase
      .from('ngos')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (ngoError) {
      console.error('Error fetching NGO:', ngoError);
    } else if (ngoData) {
      setNgo(ngoData);
      
      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('ngo_id', ngoData.id)
        .order('created_at', { ascending: false });

      if (projectsData) {
        setProjects(projectsData);
        
        // Fetch stats
        const projectIds = projectsData.map(p => p.id);
        if (projectIds.length > 0) {
          const { data: donations } = await supabase
            .from('donations')
            .select('amount, donor_id')
            .in('project_id', projectIds);

          const { data: expenses } = await supabase
            .from('expenses')
            .select('amount')
            .in('project_id', projectIds);

          if (donations) {
            const totalReceived = donations.reduce((sum, d) => sum + Number(d.amount), 0);
            const uniqueDonors = new Set(donations.map(d => d.donor_id)).size;
            setStats(prev => ({ ...prev, totalReceived, donorsCount: uniqueDonors }));
          }

          if (expenses) {
            const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
            setStats(prev => ({ ...prev, totalSpent }));
          }
        }
      }
    }
    
    setIsLoading(false);
  };

  const handleCreateNgo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { data, error } = await supabase
      .from('ngos')
      .insert({
        user_id: user?.id,
        name: ngoForm.name,
        description: ngoForm.description,
        mission: ngoForm.mission,
        address: ngoForm.address,
      })
      .select()
      .single();

    setIsSubmitting(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setNgo(data);
      setShowNgoDialog(false);
      toast({ title: 'NGO Created!', description: 'Your organization profile has been created.' });
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ngo) return;
    
    setIsSubmitting(true);

    const { data, error } = await supabase
      .from('projects')
      .insert({
        ngo_id: ngo.id,
        name: projectForm.name,
        description: projectForm.description,
        target_amount: parseFloat(projectForm.target_amount) || 0,
      })
      .select()
      .single();

    setIsSubmitting(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setProjects(prev => [data, ...prev]);
      setShowProjectDialog(false);
      setProjectForm({ name: '', description: '', target_amount: '' });
      toast({ title: 'Project Created!', description: 'Your project is now live.' });
    }
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

  // If no NGO exists, show setup screen
  if (!ngo) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Building className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Set Up Your NGO</h1>
            <p className="text-muted-foreground mb-8">
              Create your organization profile to start receiving donations and managing projects.
            </p>
            
            <Dialog open={showNgoDialog} onOpenChange={setShowNgoDialog}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="mr-2 w-4 h-4" />
                  Create NGO Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Your NGO</DialogTitle>
                  <DialogDescription>
                    Fill in your organization details. You can update these later.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateNgo} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ngo-name">Organization Name *</Label>
                    <Input
                      id="ngo-name"
                      value={ngoForm.name}
                      onChange={(e) => setNgoForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ngo-description">Description</Label>
                    <Textarea
                      id="ngo-description"
                      value={ngoForm.description}
                      onChange={(e) => setNgoForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ngo-mission">Mission Statement</Label>
                    <Textarea
                      id="ngo-mission"
                      value={ngoForm.mission}
                      onChange={(e) => setNgoForm(prev => ({ ...prev, mission: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ngo-address">Address</Label>
                    <Input
                      id="ngo-address"
                      value={ngoForm.address}
                      onChange={(e) => setNgoForm(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                    Create NGO
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
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
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{ngo.name}</h1>
              {ngo.is_verified ? (
                <Badge className="bg-success text-success-foreground">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Pending Verification
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">Manage your projects and track fund utilization</p>
          </div>
          
          <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 w-4 h-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Add a new project for donors to contribute to.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name *</Label>
                  <Input
                    id="project-name"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    value={projectForm.description}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-target">Target Amount (₹)</Label>
                  <Input
                    id="project-target"
                    type="number"
                    value={projectForm.target_amount}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, target_amount: e.target.value }))}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                  Create Project
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Received
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">₹{stats.totalReceived.toLocaleString()}</div>
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
                Total Donors
              </CardTitle>
              <Users className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.donorsCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Projects
              </CardTitle>
              <FolderOpen className="w-4 h-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.filter(p => p.status === 'active').length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Utilization Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Fund Utilization</CardTitle>
            <CardDescription>Overview of received vs utilized funds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Utilized: ₹{stats.totalSpent.toLocaleString()}</span>
                <span>Received: ₹{stats.totalReceived.toLocaleString()}</span>
              </div>
              <Progress 
                value={stats.totalReceived > 0 ? (stats.totalSpent / stats.totalReceived) * 100 : 0} 
                className="h-3"
              />
              <p className="text-sm text-muted-foreground">
                Remaining Balance: ₹{(stats.totalReceived - stats.totalSpent).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Projects List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Projects</CardTitle>
            <CardDescription>Manage and track all your fundraising projects</CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length > 0 ? (
              <div className="space-y-4">
                {projects.map((project) => (
                  <Link 
                    key={project.id} 
                    to={`/ngo/projects/${project.id}`}
                    className="block p-4 rounded-lg border hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{project.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {project.description || 'No description'}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          Target: ₹{Number(project.target_amount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No projects yet</p>
                <Button onClick={() => setShowProjectDialog(true)}>
                  <Plus className="mr-2 w-4 h-4" />
                  Create Your First Project
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

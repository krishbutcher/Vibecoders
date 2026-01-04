import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Building,
  CheckCircle,
  MapPin,
  Globe,
  Mail,
  Target,
  Heart,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Users,
  Wallet
} from 'lucide-react';

interface NGO {
  id: string;
  name: string;
  description: string | null;
  mission: string | null;
  address: string | null;
  website: string | null;
  logo_url: string | null;
  is_verified: boolean;
  created_at: string;
}

interface ProjectWithStats {
  id: string;
  name: string;
  description: string | null;
  target_amount: number;
  status: string;
  total_donated: number;
}

export default function NGODetail() {
  const { id } = useParams();
  const [ngo, setNgo] = useState<NGO | null>(null);
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalRaised: 0,
    totalDonors: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchNGOData();
    }
  }, [id]);

  const fetchNGOData = async () => {
    setIsLoading(true);

    // Fetch NGO
    const { data: ngoData, error } = await supabase
      .from('ngos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !ngoData) {
      console.error('Error fetching NGO:', error);
      setIsLoading(false);
      return;
    }

    setNgo(ngoData);

    // Fetch projects with donation stats
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .eq('ngo_id', id)
      .order('created_at', { ascending: false });

    if (projectsData) {
      const projectsWithStats = await Promise.all(
        projectsData.map(async (project) => {
          const { data: donations } = await supabase
            .from('donations')
            .select('amount')
            .eq('project_id', project.id)
            .eq('status', 'completed');

          const totalDonated = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

          return {
            ...project,
            total_donated: totalDonated,
          };
        })
      );

      setProjects(projectsWithStats);

      // Calculate stats
      const totalRaised = projectsWithStats.reduce((sum, p) => sum + p.total_donated, 0);
      
      // Get unique donors
      const projectIds = projectsData.map(p => p.id);
      let totalDonors = 0;
      if (projectIds.length > 0) {
        const { data: donations } = await supabase
          .from('donations')
          .select('donor_id')
          .in('project_id', projectIds)
          .eq('status', 'completed');
        
        if (donations) {
          totalDonors = new Set(donations.map(d => d.donor_id)).size;
        }
      }

      setStats({
        totalProjects: projectsData.length,
        totalRaised,
        totalDonors,
      });
    }

    setIsLoading(false);
  };

  const getProgress = (project: ProjectWithStats) => {
    if (!project.target_amount || project.target_amount === 0) return 0;
    return Math.min((project.total_donated / project.target_amount) * 100, 100);
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

  if (!ngo) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Building className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">NGO Not Found</h1>
          <Button asChild>
            <Link to="/ngos">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to NGOs
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/ngos">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to NGOs
          </Link>
        </Button>

        {/* NGO Header */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-start gap-6">
              {/* Logo */}
              <div className="w-24 h-24 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                {ngo.logo_url ? (
                  <img src={ngo.logo_url} alt={ngo.name} className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <Building className="w-12 h-12 text-primary/40" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{ngo.name}</h1>
                  {ngo.is_verified && (
                    <Badge className="bg-success/10 text-success border-success/20">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>

                <p className="text-muted-foreground mb-4">
                  {ngo.description || 'Dedicated to making a positive impact in the community.'}
                </p>

                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {ngo.address && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {ngo.address}
                    </span>
                  )}
                  {ngo.website && (
                    <a 
                      href={ngo.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Globe className="w-4 h-4" />
                      Visit Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Mission */}
            {ngo.mission && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{ngo.mission}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Impact Overview</CardTitle>
              <CardDescription>Total contributions and reach</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-4 rounded-lg bg-accent/10">
                <p className="text-3xl font-bold text-accent">₹{stats.totalRaised.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Raised</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-semibold">{stats.totalProjects}</p>
                  <p className="text-xs text-muted-foreground">Projects</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <Users className="w-5 h-5 mx-auto mb-1 text-success" />
                  <p className="text-lg font-semibold">{stats.totalDonors}</p>
                  <p className="text-xs text-muted-foreground">Donors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Active Projects</h2>
          
          {projects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="card-hover">
                  <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Target className="w-12 h-12 text-primary/40" />
                  </div>
                  
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || 'Support this important cause.'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">₹{project.total_donated.toLocaleString()}</span>
                        <span className="text-muted-foreground">of ₹{Number(project.target_amount).toLocaleString()}</span>
                      </div>
                      <Progress value={getProgress(project)} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">
                        {getProgress(project).toFixed(0)}% funded
                      </p>
                    </div>

                    <Button asChild className="w-full group">
                      <Link to={`/projects/${project.id}`}>
                        <Heart className="w-4 h-4 mr-2" />
                        Donate Now
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No active projects at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

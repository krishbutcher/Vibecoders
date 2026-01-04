import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Heart, 
  Target,
  Building,
  Loader2,
  ArrowRight
} from 'lucide-react';

// Import project images
import cleanWaterImg from '@/assets/projects/clean-water.jpg';
import educationImg from '@/assets/projects/education.jpg';
import healthcareImg from '@/assets/projects/healthcare.jpg';
import womenEmpowermentImg from '@/assets/projects/women-empowerment.jpg';
import nutritionImg from '@/assets/projects/nutrition.jpg';
import environmentImg from '@/assets/projects/environment.jpg';

interface ProjectWithNgo {
  id: string;
  name: string;
  description: string | null;
  target_amount: number;
  status: string;
  image_url: string | null;
  ngo: {
    id: string;
    name: string;
    is_verified: boolean;
  };
  total_donated: number;
}

// Sample data for demonstration
const SAMPLE_PROJECTS: ProjectWithNgo[] = [
  {
    id: 'sample-1',
    name: 'Clean Water for Rural Villages',
    description: 'Providing clean drinking water access to 50 villages in drought-affected regions through bore wells and water purification systems.',
    target_amount: 500000,
    status: 'active',
    image_url: cleanWaterImg,
    ngo: { id: 'ngo-1', name: 'WaterAid Foundation', is_verified: true },
    total_donated: 325000
  },
  {
    id: 'sample-2',
    name: 'Education for Underprivileged Children',
    description: 'Supporting 200 children with school supplies, uniforms, and scholarship programs for quality education.',
    target_amount: 300000,
    status: 'active',
    image_url: educationImg,
    ngo: { id: 'ngo-2', name: 'Teach For All India', is_verified: true },
    total_donated: 180000
  },
  {
    id: 'sample-3',
    name: 'Healthcare Access Program',
    description: 'Mobile health clinics bringing medical care to remote communities with free check-ups and medicines.',
    target_amount: 750000,
    status: 'active',
    image_url: healthcareImg,
    ngo: { id: 'ngo-3', name: 'Health First NGO', is_verified: true },
    total_donated: 450000
  },
  {
    id: 'sample-4',
    name: 'Women Empowerment Initiative',
    description: 'Skill development and micro-finance support for 100 women to start their own small businesses.',
    target_amount: 400000,
    status: 'active',
    image_url: womenEmpowermentImg,
    ngo: { id: 'ngo-4', name: 'Empower Her Foundation', is_verified: true },
    total_donated: 275000
  },
  {
    id: 'sample-5',
    name: 'Child Nutrition Program',
    description: 'Daily nutritious meals for 500 malnourished children in urban slums and rural areas.',
    target_amount: 600000,
    status: 'active',
    image_url: nutritionImg,
    ngo: { id: 'ngo-1', name: 'WaterAid Foundation', is_verified: true },
    total_donated: 520000
  },
  {
    id: 'sample-6',
    name: 'Green Environment Initiative',
    description: 'Planting 10,000 trees and creating sustainable green spaces in urban communities.',
    target_amount: 250000,
    status: 'active',
    image_url: environmentImg,
    ngo: { id: 'ngo-5', name: 'Green Earth Trust', is_verified: true },
    total_donated: 125000
  }
];

export default function Projects() {
  const [projects, setProjects] = useState<ProjectWithNgo[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithNgo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [usingSampleData, setUsingSampleData] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [searchQuery, statusFilter, projects]);

  const fetchProjects = async () => {
    setIsLoading(true);

    // Fetch projects with verified NGOs
    const { data: projectsData, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        target_amount,
        status,
        image_url,
        ngo:ngos (
          id,
          name,
          is_verified
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      setProjects(SAMPLE_PROJECTS);
      setFilteredProjects(SAMPLE_PROJECTS);
      setUsingSampleData(true);
      setIsLoading(false);
      return;
    }
    
    if (projectsData) {
      // Filter only verified NGOs and fetch donation totals
      const verifiedProjects = projectsData.filter((p: any) => p.ngo?.is_verified);
      
      if (verifiedProjects.length === 0) {
        // Use sample data if no real projects
        setProjects(SAMPLE_PROJECTS);
        setFilteredProjects(SAMPLE_PROJECTS);
        setUsingSampleData(true);
        setIsLoading(false);
        return;
      }
      
      // Fetch donations for each project
      const projectsWithDonations = await Promise.all(
        verifiedProjects.map(async (project: any) => {
          const { data: donations } = await supabase
            .from('donations')
            .select('amount')
            .eq('project_id', project.id)
            .eq('status', 'completed');
          
          const totalDonated = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
          
          return {
            ...project,
            ngo: project.ngo,
            total_donated: totalDonated,
          };
        })
      );

      setProjects(projectsWithDonations);
      setFilteredProjects(projectsWithDonations);
      setUsingSampleData(false);
    }

    setIsLoading(false);
  };

  const filterProjects = () => {
    let filtered = [...projects];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.ngo?.name.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const getProgress = (project: ProjectWithNgo) => {
    if (!project.target_amount || project.target_amount === 0) return 0;
    return Math.min((project.total_donated / project.target_amount) * 100, 100);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Sample Data Banner */}
        {usingSampleData && (
          <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-primary flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span><strong>Sample Data:</strong> These are example projects to demonstrate the platform. Real projects will appear here once NGOs create them.</span>
            </p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Browse Projects</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover verified projects from trusted NGOs and make a real difference with your donations.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects or NGOs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="card-hover overflow-hidden">
                {/* Project Image */}
                <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                  {project.image_url ? (
                    <img 
                      src={project.image_url} 
                      alt={project.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Target className="w-16 h-16 text-primary/40" />
                  )}
                </div>
                
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      <Building className="w-3 h-3 mr-1" />
                      {project.ngo?.name}
                    </Badge>
                    <Badge className="bg-success/10 text-success border-success/20">
                      Verified
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description || 'Help support this important cause.'}
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

                  {/* Actions */}
                  {project.id.startsWith('sample-') ? (
                    <Button 
                      className="w-full group" 
                      variant="secondary"
                      onClick={() => {
                        const toast = document.createElement('div');
                        toast.className = 'fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-5';
                        toast.innerHTML = '<strong>Sample Data</strong><br/>Sign up and browse real projects to start donating!';
                        document.body.appendChild(toast);
                        setTimeout(() => toast.remove(), 3000);
                      }}
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Donate Now
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  ) : (
                    <Button asChild className="w-full group">
                      <Link to={`/projects/${project.id}`}>
                        <Heart className="w-4 h-4 mr-2" />
                        Donate Now
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Target className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Projects Found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search terms.' : 'No active projects available at the moment.'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

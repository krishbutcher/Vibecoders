import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Building,
  CheckCircle,
  MapPin,
  Globe,
  FolderOpen,
  Loader2,
  ArrowRight
} from 'lucide-react';

// Import NGO logos
import wateraidLogo from '@/assets/ngos/wateraid-logo.jpg';
import teachforallLogo from '@/assets/ngos/teachforall-logo.jpg';
import healthfirstLogo from '@/assets/ngos/healthfirst-logo.jpg';
import empowerherLogo from '@/assets/ngos/empowerher-logo.jpg';
import greenearthLogo from '@/assets/ngos/greenearth-logo.jpg';
import childcareLogo from '@/assets/ngos/childcare-logo.jpg';

interface NGOWithStats {
  id: string;
  name: string;
  description: string | null;
  mission: string | null;
  address: string | null;
  website: string | null;
  logo_url: string | null;
  is_verified: boolean;
  created_at: string;
  projects_count: number;
  total_raised: number;
}

// Sample data for demonstration
const SAMPLE_NGOS: NGOWithStats[] = [
  {
    id: 'sample-1',
    name: 'WaterAid Foundation',
    description: 'Providing clean water solutions to underserved communities across India.',
    mission: 'Clean water for every village by 2030',
    address: 'Mumbai, Maharashtra',
    website: 'https://wateraid.org',
    logo_url: wateraidLogo,
    is_verified: true,
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    projects_count: 8,
    total_raised: 2500000
  },
  {
    id: 'sample-2',
    name: 'Teach For All India',
    description: 'Bridging educational gaps for underprivileged children through quality teaching.',
    mission: 'Quality education for every child',
    address: 'Delhi, India',
    website: 'https://teachforall.org',
    logo_url: teachforallLogo,
    is_verified: true,
    created_at: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString(),
    projects_count: 12,
    total_raised: 4200000
  },
  {
    id: 'sample-3',
    name: 'Health First NGO',
    description: 'Mobile healthcare bringing medical services to remote and rural areas.',
    mission: 'Healthcare access for all',
    address: 'Bangalore, Karnataka',
    website: 'https://healthfirst.org',
    logo_url: healthfirstLogo,
    is_verified: true,
    created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    projects_count: 5,
    total_raised: 1800000
  },
  {
    id: 'sample-4',
    name: 'Empower Her Foundation',
    description: 'Supporting women through skill development, education, and microfinance.',
    mission: 'Empowering women to lead',
    address: 'Chennai, Tamil Nadu',
    website: 'https://empowerher.org',
    logo_url: empowerherLogo,
    is_verified: true,
    created_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
    projects_count: 6,
    total_raised: 1500000
  },
  {
    id: 'sample-5',
    name: 'Green Earth Trust',
    description: 'Environmental conservation and sustainable development initiatives.',
    mission: 'A greener tomorrow for everyone',
    address: 'Pune, Maharashtra',
    website: 'https://greenearth.org',
    logo_url: greenearthLogo,
    is_verified: true,
    created_at: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
    projects_count: 4,
    total_raised: 950000
  },
  {
    id: 'sample-6',
    name: 'Child Care Foundation',
    description: 'Comprehensive care and support for orphaned and vulnerable children.',
    mission: 'Every child deserves a loving home',
    address: 'Hyderabad, Telangana',
    website: 'https://childcare.org',
    logo_url: childcareLogo,
    is_verified: true,
    created_at: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
    projects_count: 7,
    total_raised: 3100000
  }
];

export default function NGOs() {
  const [ngos, setNgos] = useState<NGOWithStats[]>([]);
  const [filteredNgos, setFilteredNgos] = useState<NGOWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<string>('verified');
  const [usingSampleData, setUsingSampleData] = useState(false);

  useEffect(() => {
    fetchNGOs();
  }, []);

  useEffect(() => {
    filterNGOs();
  }, [searchQuery, verificationFilter, ngos]);

  const fetchNGOs = async () => {
    setIsLoading(true);

    // Fetch all NGOs
    const { data: ngosData, error } = await supabase
      .from('ngos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching NGOs:', error);
      setNgos(SAMPLE_NGOS);
      setFilteredNgos(SAMPLE_NGOS);
      setUsingSampleData(true);
      setIsLoading(false);
      return;
    }

    if (ngosData && ngosData.length > 0) {
      // Fetch stats for each NGO
      const ngosWithStats = await Promise.all(
        ngosData.map(async (ngo) => {
          // Get projects count
          const { count: projectsCount } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('ngo_id', ngo.id);

          // Get total raised from donations
          const { data: projects } = await supabase
            .from('projects')
            .select('id')
            .eq('ngo_id', ngo.id);

          let totalRaised = 0;
          if (projects && projects.length > 0) {
            const projectIds = projects.map(p => p.id);
            const { data: donations } = await supabase
              .from('donations')
              .select('amount')
              .in('project_id', projectIds)
              .eq('status', 'completed');

            if (donations) {
              totalRaised = donations.reduce((sum, d) => sum + Number(d.amount), 0);
            }
          }

          return {
            ...ngo,
            projects_count: projectsCount || 0,
            total_raised: totalRaised,
          };
        })
      );

      setNgos(ngosWithStats);
      setFilteredNgos(ngosWithStats.filter(n => n.is_verified));
      setUsingSampleData(false);
    } else {
      // Use sample data if no real NGOs
      setNgos(SAMPLE_NGOS);
      setFilteredNgos(SAMPLE_NGOS);
      setUsingSampleData(true);
    }

    setIsLoading(false);
  };

  const filterNGOs = () => {
    let filtered = [...ngos];

    // Verification filter
    if (verificationFilter === 'verified') {
      filtered = filtered.filter((n) => n.is_verified);
    } else if (verificationFilter === 'pending') {
      filtered = filtered.filter((n) => !n.is_verified);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.name.toLowerCase().includes(query) ||
          n.description?.toLowerCase().includes(query) ||
          n.mission?.toLowerCase().includes(query) ||
          n.address?.toLowerCase().includes(query)
      );
    }

    setFilteredNgos(filtered);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Sample Data Banner */}
        {usingSampleData && (
          <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-primary flex items-center gap-2">
              <Building className="w-4 h-4" />
              <span><strong>Sample Data:</strong> These are example NGOs to demonstrate the platform. Real organizations will appear here once they register and get verified.</span>
            </p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Browse NGOs</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover trusted non-profit organizations making a difference. All verified NGOs are thoroughly reviewed for transparency.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search NGOs by name, mission, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={verificationFilter} onValueChange={setVerificationFilter}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All NGOs</SelectItem>
              <SelectItem value="verified">Verified Only</SelectItem>
              <SelectItem value="pending">Pending Verification</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-6">
          Showing {filteredNgos.length} {filteredNgos.length === 1 ? 'organization' : 'organizations'}
        </p>

        {/* NGOs Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredNgos.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNgos.map((ngo) => (
              <Card key={ngo.id} className="card-hover overflow-hidden">
                {/* NGO Logo/Banner */}
                <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative">
                  {ngo.logo_url ? (
                    <img 
                      src={ngo.logo_url} 
                      alt={ngo.name} 
                      className="w-20 h-20 rounded-full object-cover border-4 border-background"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background">
                      <Building className="w-10 h-10 text-primary/40" />
                    </div>
                  )}
                  {ngo.is_verified && (
                    <Badge className="absolute top-3 right-3 bg-success/90 text-success-foreground">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                <CardHeader className="text-center pt-4">
                  <CardTitle className="line-clamp-1">{ngo.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {ngo.mission || ngo.description || 'Dedicated to making a positive impact.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Location & Website */}
                  <div className="flex flex-wrap gap-2 justify-center text-sm text-muted-foreground">
                    {ngo.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {ngo.address.split(',')[0]}
                      </span>
                    )}
                    {ngo.website && (
                      <a 
                        href={ngo.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <Globe className="w-3 h-3" />
                        Website
                      </a>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-y">
                    <div className="text-center">
                      <p className="text-lg font-semibold">{ngo.projects_count}</p>
                      <p className="text-xs text-muted-foreground">Projects</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-accent">
                        ₹{ngo.total_raised.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Raised</p>
                    </div>
                  </div>

                  {/* Action */}
                  <Button asChild className="w-full group" variant={ngo.is_verified ? 'default' : 'secondary'}>
                    <Link to={`/ngos/${ngo.id}`}>
                      <FolderOpen className="w-4 h-4 mr-2" />
                      View Projects
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Building className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No NGOs Found</h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? 'Try adjusting your search terms or filters.' 
                : 'No organizations match the selected filter.'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

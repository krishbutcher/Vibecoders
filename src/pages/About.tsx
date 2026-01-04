import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Eye, 
  Heart, 
  Users, 
  Building, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Target,
  FileText
} from 'lucide-react';

export default function About() {
  const features = [
    {
      icon: Shield,
      title: 'Verified NGOs',
      description: 'Every NGO on our platform undergoes rigorous verification to ensure legitimacy and trustworthiness.'
    },
    {
      icon: Eye,
      title: 'Full Transparency',
      description: 'Track every rupee donated with detailed expense reports, receipts, and real-time updates.'
    },
    {
      icon: FileText,
      title: 'Expense Tracking',
      description: 'NGOs upload proof for every expense, allowing donors to see exactly how funds are utilized.'
    },
    {
      icon: TrendingUp,
      title: 'Impact Metrics',
      description: 'Visual dashboards show project progress, funding goals, and community impact metrics.'
    }
  ];

  const stats = [
    { value: '100%', label: 'Transparency' },
    { value: '24/7', label: 'Real-time Tracking' },
    { value: '0%', label: 'Hidden Fees' },
    { value: '∞', label: 'Impact Potential' }
  ];

  const roles = [
    {
      icon: Users,
      title: 'Donors',
      description: 'Browse verified projects, make secure donations, and track exactly how your contributions are used with detailed expense reports.',
      color: 'text-primary'
    },
    {
      icon: Building,
      title: 'NGOs',
      description: 'Get verified, create projects, manage expenses with proof uploads, and build trust with transparent financial reporting.',
      color: 'text-accent'
    },
    {
      icon: Shield,
      title: 'Administrators',
      description: 'Verify NGOs, monitor transactions, flag suspicious expenses, and maintain platform integrity.',
      color: 'text-success'
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About <span className="text-primary">FundTracker</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            We're on a mission to bring complete transparency to charitable giving. 
            Every donation is tracked, every expense is documented, and every impact is measurable.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/projects">
                <Heart className="w-5 h-5 mr-2" />
                Start Donating
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/ngos">
                <Building className="w-5 h-5 mr-2" />
                Browse NGOs
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <p className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mission Section */}
        <div className="bg-secondary/30 rounded-2xl p-8 md:p-12 mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <Target className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-muted-foreground mb-6">
              In a world where trust in charitable organizations is declining, we believe transparency 
              is the key to rebuilding confidence. FundTracker empowers donors with complete visibility 
              into how their contributions are used, while helping NGOs demonstrate their impact and 
              build lasting relationships with supporters.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Verified Organizations
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Transparent Tracking
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Real Impact
              </span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Roles Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-10">Who Uses FundTracker?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((role, index) => (
              <Card key={index} className="card-hover">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4`}>
                    <role.icon className={`w-8 h-8 ${role.color}`} />
                  </div>
                  <CardTitle>{role.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">{role.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of donors and NGOs who trust FundTracker for transparent, 
            impactful charitable giving.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/auth">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/projects">
                Explore Projects
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

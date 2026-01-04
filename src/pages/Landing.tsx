import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Heart, 
  Shield, 
  BarChart3, 
  Users, 
  ArrowRight, 
  CheckCircle,
  Building,
  Wallet,
  FileText
} from 'lucide-react';

export default function Landing() {
  const features = [
    {
      icon: Shield,
      title: 'Complete Transparency',
      description: 'Every donation is tracked and accounted for. See exactly where your money goes.',
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Visual dashboards show fund utilization, project progress, and impact metrics.',
    },
    {
      icon: Users,
      title: 'Verified NGOs',
      description: 'All NGOs undergo verification before they can receive donations on our platform.',
    },
    {
      icon: FileText,
      title: 'Documented Expenses',
      description: 'NGOs upload proof for every expense, creating an auditable trail of spending.',
    },
  ];

  const stats = [
    { value: '500+', label: 'Verified NGOs' },
    { value: '₹10Cr+', label: 'Funds Tracked' },
    { value: '1000+', label: 'Active Projects' },
    { value: '50K+', label: 'Happy Donors' },
  ];

  const howItWorks = [
    {
      icon: Building,
      title: 'NGOs Register',
      description: 'Organizations create profiles and submit for verification.',
    },
    {
      icon: Heart,
      title: 'Donors Contribute',
      description: 'Browse verified projects and donate to causes you care about.',
    },
    {
      icon: Wallet,
      title: 'Track Utilization',
      description: 'Follow how your donations are spent with documented proof.',
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6">
              <CheckCircle className="w-4 h-4" />
              Trusted by thousands of donors
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Know Where Your{' '}
              <span className="text-gradient">Donations</span>{' '}
              Go
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The transparent platform connecting donors with verified NGOs. Track every rupee, 
              see documented proof of expenses, and measure real impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="group">
                <Link to="/auth?mode=signup">
                  Start Donating
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/projects">Browse Projects</Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10" />
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-sidebar text-sidebar-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-sidebar-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sidebar-foreground/70 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Trust & Transparency
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every feature is designed to ensure your donations create real, verifiable impact.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover border-2 border-transparent hover:border-primary/20">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 lg:py-28 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple, transparent, and effective donation tracking in three steps.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 overflow-hidden relative">
            <CardContent className="p-8 md:p-12 text-center relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Make a Difference?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Join thousands of donors who trust FundTracker to ensure their contributions create real impact.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/auth?mode=signup">Create Free Account</Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10" asChild>
                  <Link to="/auth?mode=signup&role=ngo">Register Your NGO</Link>
                </Button>
              </div>
            </CardContent>
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-2xl" />
          </Card>
        </div>
      </section>
    </Layout>
  );
}

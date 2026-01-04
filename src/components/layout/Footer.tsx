import { Link } from 'react-router-dom';
import { Heart, Github, Twitter, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">FundTracker</span>
            </div>
            <p className="text-sidebar-foreground/70 max-w-md">
              Bringing transparency to charitable giving. Track how your donations make a real difference in the world.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/projects" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                  Browse Projects
                </Link>
              </li>
              <li>
                <Link to="/ngos" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                  Find NGOs
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* For NGOs */}
          <div>
            <h4 className="font-semibold mb-4">For NGOs</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/auth?mode=signup&role=ngo" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                  Register NGO
                </Link>
              </li>
              <li>
                <Link to="/ngo" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                  NGO Dashboard
                </Link>
              </li>
              <li>
                <a href="#" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                  Documentation
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-sidebar-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sidebar-foreground/60 text-sm">
            © 2026 FundTracker. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

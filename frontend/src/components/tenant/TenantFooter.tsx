import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export const TenantFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm">
      <div className="px-6 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Side */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>© {currentYear} Etching Xenial. Made with</span>
            <Heart className="w-4 h-4 text-destructive fill-destructive" />
            <span>by <a href="https://github.com/canvastack" target="_blank">CanvaStack</a></span>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-6 text-sm">
            <Link 
              to="/admin/docs" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Documentation
            </Link>
            <Link 
              to="/admin/support" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Support
            </Link>
            <Link 
              to="/admin/settings" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Settings
            </Link>
            <span className="text-muted-foreground">v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
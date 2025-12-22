import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, X, ShoppingCart, LogOut } from "lucide-react";
import { useThemeComponents } from "@/hooks/useThemeComponents";
import { usePageContent } from "@/hooks/usePageContent";
import { useAuthState } from "@/hooks/useAuthState";
import { ContextSwitcher } from "@/components/ContextSwitcher";

const Header = () => {
  const [isDark, setIsDark] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user, account } = useAuthState();

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { headerContent } = useThemeComponents();
  const isHomePage = location.pathname === '/';

  // Use transparent style for home page, default style for other pages
  const activeStyle = isHomePage && !isScrolled ? headerContent.styles.transparent : headerContent.styles.default;
  const headerBackground = isScrolled ? headerContent.styles.default.background : activeStyle.background;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBackground}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-light rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-xl">{headerContent.brandInitials}</span>
            </div>
            <span className={`text-xl font-bold ${activeStyle.text}`}>
              {headerContent.brandName.split(' ')[0]} <span className="text-primary">{headerContent.brandName.split(' ')[1]}</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {headerContent.navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === item.path
                    ? activeStyle.active
                    : `${activeStyle.text} ${activeStyle.hover}`
                }`}
              >
                {item.name}
              </Link>
            ))}
            {!isAuthenticated && (
              <Link
                to="/platform/login"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeStyle.text} ${activeStyle.hover}`}
              >
                Platform Admin
              </Link>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="rounded-lg"
            >
              <Link to={headerContent.cartPath}>
                <ShoppingCart className="h-5 w-5" />
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDark(!isDark)}
              className="rounded-lg"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <ContextSwitcher className="hidden md:flex" />
                <Button
                  className="hidden md:flex bg-destructive hover:bg-destructive/90 text-white"
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                className="hidden md:flex bg-gradient-to-r from-primary to-orange-light text-white hover:shadow-glow"
                asChild
              >
                <Link to={headerContent.loginPath}>
                  {headerContent.loginText}
                </Link>
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <nav className="flex flex-col space-y-2">
              {headerContent.navigation.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === item.path
                      ? headerContent.styles.default.active
                      : `${headerContent.styles.default.text} ${headerContent.styles.default.hover}`
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <Button
                variant="ghost"
                className="w-full justify-start"
                asChild
              >
                <Link to={headerContent.cartPath} onClick={() => setIsMobileMenuOpen(false)}>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {headerContent.cartText}
                </Link>
              </Button>
              {isAuthenticated ? (
                <>
                  <div className="px-4">
                    <ContextSwitcher className="w-full" />
                  </div>
                  <Button
                    className="w-full bg-destructive hover:bg-destructive/90 text-white justify-start"
                    onClick={async () => {
                      await logout();
                      setIsMobileMenuOpen(false);
                      navigate('/');
                    }}
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-orange-light text-white"
                    asChild
                  >
                    <Link to={headerContent.loginPath} onClick={() => setIsMobileMenuOpen(false)}>
                      {headerContent.loginText}
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    asChild
                  >
                    <Link to="/platform/login" onClick={() => setIsMobileMenuOpen(false)}>
                      Platform Admin
                    </Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

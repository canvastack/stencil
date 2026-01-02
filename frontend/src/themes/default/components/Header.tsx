import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, X, ShoppingCart, LogOut } from "lucide-react";
import type { HeaderProps } from "@/core/engine/interfaces";
import { useAuthState } from "@/hooks/useAuthState";
import { useTenantAwareNavigation } from "@/hooks/useTenantAwareNavigation";
import { usePublicHeaderConfig, usePublicMenus } from "@/hooks/usePublicNavigation";

const Header: React.FC<HeaderProps> = ({ className }) => {
  // const [isDark, setIsDark] = useState(true);
  // const [isScrolled, setIsScrolled] = useState(false);
  // const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;

    const stored = window.localStorage.getItem('stencil_color_mode');
    if (stored === 'light') return false;
    if (stored === 'dark') return true;

    // Fallback ke preferensi sistem jika belum ada penyimpanan
    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user, account } = useAuthState();
  const { getUrl } = useTenantAwareNavigation();
  
  const { data: headerConfig } = usePublicHeaderConfig();
  const { data: menus = [] } = usePublicMenus('header');

  // useEffect(() => {
    // const root = document.documentElement;
    // if (isDark) {
      // root.classList.add("dark");
    // } else {
      // root.classList.remove("dark");
    // }
  // }, [isDark]);

  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      root.classList.add('dark');
      window.localStorage.setItem('stencil_color_mode', 'dark');
    } else {
      root.classList.remove('dark');
      window.localStorage.setItem('stencil_color_mode', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const brandName = headerConfig?.brand_name || "Etching Xenial";
  const brandInitials = headerConfig?.brand_initials || "CEX";
  const showCart = headerConfig?.show_cart ?? true;
  const showLogin = headerConfig?.show_login ?? true;
  const cartButtonText = headerConfig?.cart_button_text || "Keranjang";
  const loginButtonText = headerConfig?.login_button_text || "Login";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-white/10 shadow-lg"
          : "bg-transparent"
      } ${className || ''}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to={getUrl("")} className="flex items-center space-x-3 group">
            {headerConfig?.use_logo && headerConfig?.logo_url ? (
              <img
                src={isDark && headerConfig?.logo_dark_url ? headerConfig.logo_dark_url : headerConfig.logo_url}
                alt={headerConfig.logo_alt_text || brandName}
                style={{
                  width: headerConfig.logo_width ? `${headerConfig.logo_width}px` : 'auto',
                  height: headerConfig.logo_height ? `${headerConfig.logo_height}px` : 'auto',
                }}
                className="transform group-hover:scale-110 transition-transform"
              />
            ) : (
              <>
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-light rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-xl">{brandInitials}</span>
                </div>
                <span className="text-xl font-bold text-foreground">
                  {brandName.split(' ').map((word, i) => (
                    <span key={i} className={i === brandName.split(' ').length - 1 ? 'text-primary' : ''}>
                      {word}{' '}
                    </span>
                  ))}
                </span>
              </>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {menus.map((menu) => (
              <Link
                key={menu.uuid}
                to={menu.is_external ? menu.path || '#' : getUrl(menu.path || '')}
                target={menu.target}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === menu.path
                    ? "bg-primary text-white"
                    : isScrolled
                      ? "text-foreground/80 hover:text-foreground hover:bg-muted"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                }`}
              >
                {menu.label}
                {menu.badge_text && (
                  <span
                    className="ml-2 px-2 py-0.5 text-xs rounded-full"
                    style={{ backgroundColor: menu.badge_color || '#ff6b35' }}
                  >
                    {menu.badge_text}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {showCart && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="rounded-lg"
              >
                <Link to={getUrl("cart")}>
                  <ShoppingCart className="h-5 w-5" />
                </Link>
              </Button>
            )}

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
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10">
                  <span className="text-sm font-medium text-foreground">
                    {user?.name || account?.name || 'User'}
                  </span>
                </div>
                <Button
                  className="hidden md:flex bg-destructive hover:bg-destructive/90 text-white"
                  onClick={async () => {
                    await logout();
                    navigate(getUrl(''));
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              showLogin && (
                <Button
                  className="hidden md:flex bg-gradient-to-r from-primary to-orange-light text-white hover:shadow-glow"
                  asChild
                >
                  <Link to={getUrl("login")}>
                    {loginButtonText}
                  </Link>
                </Button>
              )
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
              {menus.map((menu) => (
                <Link
                  key={menu.uuid}
                  to={menu.is_external ? menu.path || '#' : getUrl(menu.path || '')}
                  target={menu.target}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === menu.path
                      ? "bg-primary text-white"
                      : "text-foreground/80 hover:bg-muted"
                  }`}
                >
                  {menu.label}
                  {menu.badge_text && (
                    <span
                      className="ml-2 px-2 py-0.5 text-xs rounded-full"
                      style={{ backgroundColor: menu.badge_color || '#ff6b35' }}
                    >
                      {menu.badge_text}
                    </span>
                  )}
                </Link>
              ))}
              {showCart && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                >
                  <Link to={getUrl("cart")} onClick={() => setIsMobileMenuOpen(false)}>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {cartButtonText}
                  </Link>
                </Button>
              )}
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-3 rounded-lg bg-primary/10">
                    <span className="text-sm font-medium text-foreground">
                      {user?.name || account?.name || 'User'}
                    </span>
                  </div>
                  <Button
                    className="w-full bg-destructive hover:bg-destructive/90 text-white justify-start"
                    onClick={async () => {
                      await logout();
                      setIsMobileMenuOpen(false);
                      navigate(getUrl(''));
                    }}
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                showLogin && (
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-orange-light text-white"
                    asChild
                  >
                    <Link to={getUrl("login")} onClick={() => setIsMobileMenuOpen(false)}>
                      {loginButtonText}
                    </Link>
                  </Button>
                )
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
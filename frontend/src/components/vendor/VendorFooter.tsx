export const VendorFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 md:px-6 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground text-center md:text-left">
            © {currentYear} PT Custom Etching Xenial. All rights reserved.
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a 
              href="/vendor/help" 
              className="hover:text-foreground transition-colors"
            >
              Help
            </a>
            <span className="text-border">|</span>
            <a 
              href="/vendor/terms" 
              className="hover:text-foreground transition-colors"
            >
              Terms
            </a>
            <span className="text-border">|</span>
            <a 
              href="/vendor/privacy" 
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Code, Video, HelpCircle, Shield, Rocket } from 'lucide-react';

export default function Documentation() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documentation</h1>
        <p className="text-muted-foreground">Complete guide for admin users and developers</p>
      </div>

      <Tabs defaultValue="user-guide" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="user-guide">
            <BookOpen className="mr-2 h-4 w-4" />
            User Guide
          </TabsTrigger>
          <TabsTrigger value="developer">
            <Code className="mr-2 h-4 w-4" />
            Developer
          </TabsTrigger>
          <TabsTrigger value="faq">
            <HelpCircle className="mr-2 h-4 w-4" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="deployment">
            <Rocket className="mr-2 h-4 w-4" />
            Deployment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user-guide" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Admin User Manual</h2>
            
            <Accordion type="single" collapsible className="space-y-2">
              <AccordionItem value="getting-started">
                <AccordionTrigger>Getting Started</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <h3 className="font-semibold">Accessing the Admin Panel</h3>
                  <p>Navigate to <code className="bg-muted px-2 py-1 rounded">/admin</code> to access the admin panel. You'll need admin credentials to log in.</p>
                  
                  <h3 className="font-semibold mt-4">Dashboard Overview</h3>
                  <p>The dashboard provides quick access to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Recent activity and statistics</li>
                    <li>Quick actions for common tasks</li>
                    <li>System health indicators</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="theme-management">
                <AccordionTrigger>Theme Management</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <h3 className="font-semibold">Managing Themes</h3>
                  <p>The theme system allows you to customize the look and feel of your website:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Colors:</strong> Primary, secondary, accent colors and their variants</li>
                    <li><strong>Typography:</strong> Font families, sizes, and weights</li>
                    <li><strong>Spacing:</strong> Margins, paddings, and layout spacing</li>
                    <li><strong>Effects:</strong> Shadows, borders, and animations</li>
                  </ul>
                  
                  <h3 className="font-semibold mt-4">Creating a New Theme</h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>Go to Themes section</li>
                    <li>Click "Create New Theme"</li>
                    <li>Configure colors, typography, and spacing</li>
                    <li>Preview changes in real-time</li>
                    <li>Save and activate the theme</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="content-editing">
                <AccordionTrigger>Content Editing</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <h3 className="font-semibold">Editing Page Content</h3>
                  <p>Each page has section-based editing:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Hero Section:</strong> Main headline, subtitle, and call-to-action</li>
                    <li><strong>Features:</strong> Service offerings and benefits</li>
                    <li><strong>About:</strong> Company information and values</li>
                    <li><strong>Contact:</strong> Contact details and form</li>
                  </ul>
                  
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded mt-4">
                    <p className="text-sm"><strong>Tip:</strong> Use the preview button to see changes before publishing.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="products">
                <AccordionTrigger>Product Management</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <h3 className="font-semibold">Adding a New Product</h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>Navigate to Products → Add Product</li>
                    <li>Fill in basic information (name, description, category)</li>
                    <li>Set pricing and stock details</li>
                    <li>Add specifications and customization options</li>
                    <li>Upload product images (recommended: 800x800px)</li>
                    <li>Configure SEO settings</li>
                    <li>Set status to "Published" when ready</li>
                  </ol>
                  
                  <h3 className="font-semibold mt-4">Product Categories</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Etching (glass, metal, etc.)</li>
                    <li>Awards & Trophies</li>
                    <li>Signage</li>
                    <li>Custom Products</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="media-library">
                <AccordionTrigger>Media Library</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <h3 className="font-semibold">Managing Media Files</h3>
                  <p>The media library helps organize images and documents:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Upload images by dragging and dropping</li>
                    <li>Organize files into folders</li>
                    <li>Search and filter by type or folder</li>
                    <li>View file details and metadata</li>
                  </ul>
                  
                  <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded mt-4">
                    <p className="text-sm"><strong>Best Practices:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4 mt-2 text-sm">
                      <li>Use JPG for photos (smaller file size)</li>
                      <li>Use PNG for logos and graphics with transparency</li>
                      <li>Optimize images before upload (max 2MB)</li>
                      <li>Use descriptive file names</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="reviews">
                <AccordionTrigger>Review Moderation</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <h3 className="font-semibold">Managing Customer Reviews</h3>
                  <p>Review the moderation workflow:</p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>New reviews appear with "Pending" status</li>
                    <li>Review the comment for appropriateness</li>
                    <li>Approve or reject the review</li>
                    <li>Approved reviews appear on product pages</li>
                  </ol>
                  
                  <h3 className="font-semibold mt-4">Moderation Guidelines</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Approve genuine customer feedback</li>
                    <li>Reject spam or offensive content</li>
                    <li>Reject reviews unrelated to the product</li>
                    <li>Maintain authenticity and trust</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </TabsContent>

        <TabsContent value="developer" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Developer Documentation</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Technology Stack</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Frontend</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>React 18 with TypeScript</li>
                      <li>Vite for build tooling</li>
                      <li>TailwindCSS for styling</li>
                      <li>Shadcn/UI components</li>
                      <li>React Router for navigation</li>
                      <li>Zustand for state management</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold">Backend (Recommended)</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>CanvaStencil Cloud (PostgreSQL)</li>
                      <li>PostgreSQL database</li>
                      <li>Row Level Security (RLS)</li>
                      <li>Edge Functions for API</li>
                      <li>Storage for media files</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Project Structure</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`src/
├── components/       # Reusable UI components
│   ├── admin/       # Admin-specific components
│   └── ui/          # Shadcn UI components
├── contexts/        # React contexts
│   ├── CartContext.tsx
│   ├── ThemeContext.tsx
│   └── ContentContext.tsx
├── hooks/           # Custom React hooks
│   └── useProducts.tsx
├── pages/           # Page components
│   ├── admin/       # Admin pages
│   └── ...          # Public pages
├── stores/          # Zustand stores
│   └── adminStore.ts
├── data/            # Mock data and types
└── lib/             # Utility functions`}
                </pre>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Key Concepts</h3>
                
                <h4 className="font-semibold mt-4">Theme System</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Themes are managed through ThemeContext and apply CSS variables to customize the entire site.
                </p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`// Using theme in components
const { currentTheme } = useTheme();

// Theme variables are available as CSS custom properties
// Example: var(--primary), var(--background)`}
                </pre>

                <h4 className="font-semibold mt-4">Content Management</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Content is managed through ContentContext with section-based structure.
                </p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`// Accessing content
const { getPageContent, updateContent } = useContent();
const homeContent = getPageContent('home');`}
                </pre>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Development Workflow</h3>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li><strong>Clone repository:</strong> <code className="bg-muted px-2 py-1 rounded text-sm">git clone [repo-url]</code></li>
                  <li><strong>Install dependencies:</strong> <code className="bg-muted px-2 py-1 rounded text-sm">npm install</code></li>
                  <li><strong>Start dev server:</strong> <code className="bg-muted px-2 py-1 rounded text-sm">npm run dev</code></li>
                  <li><strong>Build for production:</strong> <code className="bg-muted px-2 py-1 rounded text-sm">npm run build</code></li>
                </ol>
              </div>

              <div className="bg-green-50 dark:bg-green-950 p-4 rounded">
                <h4 className="font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security Best Practices
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2 text-sm">
                  <li>Always validate user input on both client and server</li>
                  <li>Use Row Level Security (RLS) policies in PostgreSQL</li>
                  <li>Never expose API keys in client code</li>
                  <li>Implement proper authentication and authorization</li>
                  <li>Sanitize HTML content before rendering</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            
            <Accordion type="single" collapsible className="space-y-2">
              <AccordionItem value="faq-1">
                <AccordionTrigger>How do I reset my admin password?</AccordionTrigger>
                <AccordionContent>
                  <p>Contact your system administrator or use the "Forgot Password" link on the login page. You'll receive an email with password reset instructions.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-2">
                <AccordionTrigger>What image formats are supported?</AccordionTrigger>
                <AccordionContent>
                  <p>The media library supports JPG, PNG, WebP, and GIF formats. For best results:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Product images: 800x800px, JPG format</li>
                    <li>Logos: PNG with transparency</li>
                    <li>Hero images: 1920x1080px, JPG format</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-3">
                <AccordionTrigger>Can I preview changes before publishing?</AccordionTrigger>
                <AccordionContent>
                  <p>Yes! Most editors include a "Preview" button that shows how changes will look on the live site before you save or publish them.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-4">
                <AccordionTrigger>How do I add SEO metadata?</AccordionTrigger>
                <AccordionContent>
                  <p>Each page and product has an SEO tab where you can set:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>SEO Title (max 60 characters)</li>
                    <li>Meta Description (max 160 characters)</li>
                    <li>Keywords (comma-separated)</li>
                  </ul>
                  <p className="mt-2">These settings help search engines understand and rank your content.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-5">
                <AccordionTrigger>What happens to draft content?</AccordionTrigger>
                <AccordionContent>
                  <p>Content saved as "Draft" is stored but not visible to website visitors. Only content with "Published" status appears on the live site. This allows you to work on updates without affecting the live site.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-6">
                <AccordionTrigger>How do I manage user roles?</AccordionTrigger>
                <AccordionContent>
                  <p>The system supports three role levels:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li><Badge>Admin</Badge> - Full access to all features</li>
                    <li><Badge variant="secondary">Editor</Badge> - Can create and edit content</li>
                    <li><Badge variant="outline">Viewer</Badge> - Read-only access</li>
                  </ul>
                  <p className="mt-2">Contact your administrator to change user roles.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-7">
                <AccordionTrigger>Can I restore previous versions of content?</AccordionTrigger>
                <AccordionContent>
                  <p>The system automatically saves changes. While version history is tracked, restoring previous versions requires developer assistance. Contact your technical team for help with content restoration.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-8">
                <AccordionTrigger>How often should I backup the database?</AccordionTrigger>
                <AccordionContent>
                  <p>If using CanvaStencil Cloud (PostgreSQL), automatic backups are included. For self-hosted installations, we recommend:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Daily automatic backups</li>
                    <li>Weekly manual verification of backups</li>
                    <li>Monthly off-site backup storage</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Deployment Guide</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Production Deployment</h3>
                <p className="text-muted-foreground mb-4">
                  This guide covers deploying your CMS to production with CanvaStencil.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">1. Pre-Deployment Checklist</h4>
                    <ul className="list-none space-y-2 ml-4 mt-2">
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>All content reviewed and finalized</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Images optimized and compressed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>SEO metadata configured for all pages</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Contact forms tested</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Mobile responsiveness verified</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Cross-browser testing completed</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold">2. Deploy with CanvaStencil</h4>
                    <ol className="list-decimal list-inside space-y-2 ml-4 mt-2">
                      <li>Click the <strong>"Publish"</strong> button in CanvaStencil</li>
                      <li>Your site will be deployed to <code className="bg-muted px-2 py-1 rounded text-sm">yoursite.canvastencil.app</code></li>
                      <li>SSL certificate is automatically configured</li>
                      <li>Changes go live immediately</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-semibold">3. Custom Domain Setup</h4>
                    <ol className="list-decimal list-inside space-y-2 ml-4 mt-2">
                      <li>Go to Project Settings → Domains</li>
                      <li>Add your custom domain</li>
                      <li>Update DNS records with your domain provider</li>
                      <li>Wait for DNS propagation (usually 24-48 hours)</li>
                      <li>SSL certificate auto-generates for custom domain</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-semibold">4. Enable CanvaStencil Cloud (Optional)</h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      For database, authentication, and backend features:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 ml-4 mt-2">
                      <li>Enable CanvaStencil Cloud from the dashboard</li>
                      <li>Database tables auto-generate from schema</li>
                      <li>Configure Row Level Security policies</li>
                      <li>Set up authentication (email/password, OAuth)</li>
                      <li>Upload media to storage buckets</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Analytics Integration</h3>
                <p className="text-muted-foreground mb-4">
                  Track visitor behavior and site performance.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Google Analytics 4 (GA4)</h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add to <code className="bg-muted px-2 py-1 rounded">index.html</code> before closing <code className="bg-muted px-2 py-1 rounded">&lt;/head&gt;</code>:
                    </p>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm mt-2">
{`<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>`}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded">
                <h4 className="font-semibold">Performance Optimization Tips</h4>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2 text-sm">
                  <li>Enable browser caching</li>
                  <li>Compress images (use WebP format when possible)</li>
                  <li>Minimize JavaScript and CSS</li>
                  <li>Use lazy loading for images</li>
                  <li>Enable CDN for static assets</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

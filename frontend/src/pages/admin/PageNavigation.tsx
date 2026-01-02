import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HeaderConfigForm } from '@/features/admin/navigation/components/HeaderConfigForm';
import { MenuBuilder } from '@/features/admin/navigation/components/MenuBuilder';
import { FooterConfigForm } from '@/features/admin/navigation/components/FooterConfigForm';
import { Layout, Menu, PanelBottom } from 'lucide-react';

const PageNavigation = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Navigasi & Branding</h1>
        <p className="text-muted-foreground mt-2">
          Kelola header, menu navigasi, dan footer website Anda
        </p>
      </div>

      <Tabs defaultValue="header" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="header" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Header
          </TabsTrigger>
          <TabsTrigger value="menus" className="flex items-center gap-2">
            <Menu className="h-4 w-4" />
            Menu
          </TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center gap-2">
            <PanelBottom className="h-4 w-4" />
            Footer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Konfigurasi Header</CardTitle>
              <CardDescription>
                Kelola brand, logo, dan pengaturan header website Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HeaderConfigForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menus" className="space-y-6">
          <MenuBuilder />
        </TabsContent>

        <TabsContent value="footer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Konfigurasi Footer</CardTitle>
              <CardDescription>
                Kelola footer sections, kontak, social media, dan pengaturan lainnya
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FooterConfigForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PageNavigation;

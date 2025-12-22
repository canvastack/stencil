import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Globe, Bell, Shield, Database, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { settingsService } from '@/services/api/settings';
import { Settings as SettingsType } from '@/types/settings';

export default function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await settingsService.getSettings();
        setSettings(data);
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await settingsService.updateSettings(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-destructive">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your CMS and site settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Globe className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Database className="mr-2 h-4 w-4" />
            Backup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Site Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.general.siteName}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  general: { ...settings.general, siteName: e.target.value } 
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteUrl">Site URL</Label>
              <Input
                id="siteUrl"
                type="url"
                value={settings.general.siteUrl}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  general: { ...settings.general, siteUrl: e.target.value } 
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.general.contactEmail}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  general: { ...settings.general, contactEmail: e.target.value } 
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Display maintenance page to visitors
                </p>
              </div>
              <Switch
                checked={settings.general.maintenanceMode}
                onCheckedChange={(checked) =>
                  setSettings({ 
                    ...settings, 
                    general: { ...settings.general, maintenanceMode: checked } 
                  })
                }
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Email Notifications</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email alerts for important events
                </p>
              </div>
              <Switch
                checked={settings.notifications.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ 
                    ...settings, 
                    notifications: { 
                      ...settings.notifications, 
                      emailNotifications: checked 
                    } 
                  })
                }
              />
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="font-medium">Notification Preferences</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>New Product Orders</Label>
                  <Switch 
                    checked={settings.notifications.notificationPreferences.newOrders}
                    onCheckedChange={(checked) =>
                      setSettings({ 
                        ...settings, 
                        notifications: { 
                          ...settings.notifications, 
                          notificationPreferences: {
                            ...settings.notifications.notificationPreferences,
                            newOrders: checked
                          }
                        } 
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>New Customer Reviews</Label>
                  <Switch 
                    checked={settings.notifications.notificationPreferences.newReviews}
                    onCheckedChange={(checked) =>
                      setSettings({ 
                        ...settings, 
                        notifications: { 
                          ...settings.notifications, 
                          notificationPreferences: {
                            ...settings.notifications.notificationPreferences,
                            newReviews: checked
                          }
                        } 
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Contact Form Submissions</Label>
                  <Switch 
                    checked={settings.notifications.notificationPreferences.contactSubmissions}
                    onCheckedChange={(checked) =>
                      setSettings({ 
                        ...settings, 
                        notifications: { 
                          ...settings.notifications, 
                          notificationPreferences: {
                            ...settings.notifications.notificationPreferences,
                            contactSubmissions: checked
                          }
                        } 
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Low Stock Alerts</Label>
                  <Switch 
                    checked={settings.notifications.notificationPreferences.lowStockAlerts}
                    onCheckedChange={(checked) =>
                      setSettings({ 
                        ...settings, 
                        notifications: { 
                          ...settings.notifications, 
                          notificationPreferences: {
                            ...settings.notifications.notificationPreferences,
                            lowStockAlerts: checked
                          }
                        } 
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>System Updates</Label>
                  <Switch 
                    checked={settings.notifications.notificationPreferences.systemUpdates}
                    onCheckedChange={(checked) =>
                      setSettings({ 
                        ...settings, 
                        notifications: { 
                          ...settings.notifications, 
                          notificationPreferences: {
                            ...settings.notifications.notificationPreferences,
                            systemUpdates: checked
                          }
                        } 
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Security Settings</h3>
            
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold">SSL Certificate</h4>
                <Badge variant="default">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Your site is secured with HTTPS. SSL certificate is automatically managed.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <h4 className="font-medium">Authentication</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Two-Factor Authentication (2FA)</Label>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Force Password Change</Label>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Session Timeout (30 minutes)</Label>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <Label>Allowed IP Addresses (Optional)</Label>
              <Textarea
                placeholder="Enter IP addresses (one per line) to restrict admin access"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to allow access from any IP address
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Analytics & Tracking</h3>
            
            <div className="space-y-2">
              <Label htmlFor="analyticsId">Google Analytics 4 Measurement ID</Label>
              <Input
                id="analyticsId"
                placeholder="G-XXXXXXXXXX"
                value={settings.analytics.googleAnalyticsId}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  analytics: { ...settings.analytics, googleAnalyticsId: e.target.value } 
                })}
              />
              <p className="text-xs text-muted-foreground">
                Get your Measurement ID from Google Analytics dashboard
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fbPixel">Facebook Pixel ID (Optional)</Label>
              <Input
                id="fbPixel"
                placeholder="Enter Facebook Pixel ID"
              />
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Email Service</h3>
            
            <div className="space-y-4">
              <Label>Email Provider</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Configure email service for contact forms and notifications
              </p>
              <Tabs defaultValue="smtp" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="smtp">SMTP</TabsTrigger>
                  <TabsTrigger value="sendgrid">SendGrid</TabsTrigger>
                  <TabsTrigger value="mailgun">Mailgun</TabsTrigger>
                </TabsList>
                
                <TabsContent value="smtp" className="space-y-3 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input id="smtpHost" placeholder="smtp.example.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">Port</Label>
                      <Input id="smtpPort" placeholder="587" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpEncryption">Encryption</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                        <option value="tls">TLS</option>
                        <option value="ssl">SSL</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpUsername">Username</Label>
                    <Input id="smtpUsername" placeholder="your-email@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">Password</Label>
                    <Input id="smtpPassword" type="password" placeholder="••••••••" />
                  </div>
                  <Button className="w-full">Save SMTP Configuration</Button>
                </TabsContent>
                
                <TabsContent value="sendgrid" className="space-y-3 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="sendgridApiKey">SendGrid API Key</Label>
                    <Input id="sendgridApiKey" type="password" placeholder="SG.xxxxxxxxxxxxxxxx" />
                    <p className="text-xs text-muted-foreground">
                      Get your API key from SendGrid dashboard
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sendgridFromEmail">From Email</Label>
                    <Input id="sendgridFromEmail" placeholder="noreply@yourdomain.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sendgridFromName">From Name</Label>
                    <Input id="sendgridFromName" placeholder="Your Company Name" />
                  </div>
                  <Button className="w-full">Save SendGrid Configuration</Button>
                </TabsContent>
                
                <TabsContent value="mailgun" className="space-y-3 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="mailgunDomain">Mailgun Domain</Label>
                    <Input id="mailgunDomain" placeholder="mg.yourdomain.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mailgunApiKey">Mailgun API Key</Label>
                    <Input id="mailgunApiKey" type="password" placeholder="key-xxxxxxxxxxxxxxxx" />
                    <p className="text-xs text-muted-foreground">
                      Get your API key from Mailgun dashboard
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mailgunFromEmail">From Email</Label>
                    <Input id="mailgunFromEmail" placeholder="noreply@yourdomain.com" />
                  </div>
                  <Button className="w-full">Save Mailgun Configuration</Button>
                </TabsContent>
              </Tabs>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Payment Gateway</h3>
            
            <div className="space-y-4">
              <Label>Payment Providers</Label>
              <Tabs defaultValue="midtrans" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="midtrans">Midtrans</TabsTrigger>
                  <TabsTrigger value="xendit">Xendit</TabsTrigger>
                  <TabsTrigger value="stripe">Stripe</TabsTrigger>
                </TabsList>
                
                <TabsContent value="midtrans" className="space-y-3 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="midtransServerKey">Server Key</Label>
                    <Input id="midtransServerKey" type="password" placeholder="SB-Mid-server-xxxxxxxx" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="midtransClientKey">Client Key</Label>
                    <Input id="midtransClientKey" placeholder="SB-Mid-client-xxxxxxxx" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="midtransProduction" />
                    <Label htmlFor="midtransProduction">Production Mode</Label>
                  </div>
                  <Button className="w-full">Save Midtrans Configuration</Button>
                </TabsContent>
                
                <TabsContent value="xendit" className="space-y-3 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="xenditSecretKey">Secret Key</Label>
                    <Input id="xenditSecretKey" type="password" placeholder="xnd_development_xxxxxxxx" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="xenditPublicKey">Public Key</Label>
                    <Input id="xenditPublicKey" placeholder="xnd_public_xxxxxxxx" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="xenditProduction" />
                    <Label htmlFor="xenditProduction">Production Mode</Label>
                  </div>
                  <Button className="w-full">Save Xendit Configuration</Button>
                </TabsContent>
                
                <TabsContent value="stripe" className="space-y-3 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="stripeSecretKey">Secret Key</Label>
                    <Input id="stripeSecretKey" type="password" placeholder="sk_test_xxxxxxxx" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripePublicKey">Publishable Key</Label>
                    <Input id="stripePublicKey" placeholder="pk_test_xxxxxxxx" />
                  </div>
                  <Button className="w-full">Save Stripe Configuration</Button>
                </TabsContent>
              </Tabs>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="font-medium">General Settings</h4>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                  <option value="IDR">IDR - Indonesian Rupiah</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="SGD">SGD - Singapore Dollar</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Accepted Payment Methods</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="paymentCash" defaultChecked />
                    <Label htmlFor="paymentCash">Cash</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="paymentCreditCard" defaultChecked />
                    <Label htmlFor="paymentCreditCard">Credit Card</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="paymentEWallet" defaultChecked />
                    <Label htmlFor="paymentEWallet">E-Wallet (GoPay, OVO, Dana)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="paymentTransfer" defaultChecked />
                    <Label htmlFor="paymentTransfer">Bank Transfer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="paymentQRIS" defaultChecked />
                    <Label htmlFor="paymentQRIS">QRIS</Label>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">WhatsApp Integration</h3>
            
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp Business Number</Label>
              <Input
                id="whatsappNumber"
                placeholder="+62812345678"
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +62 for Indonesia)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappMessage">Default Message Template</Label>
              <Textarea
                id="whatsappMessage"
                placeholder="Hello, I'm interested in your products..."
                rows={3}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Backup Configuration</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Automatic Backups</Label>
                <p className="text-sm text-muted-foreground">
                  Daily automated backups of database and media
                </p>
              </div>
              <Switch
                checked={settings.backup.enabled}
                onCheckedChange={(checked) =>
                  setSettings({ 
                    ...settings, 
                    backup: { ...settings.backup, enabled: checked } 
                  })
                }
              />
            </div>

            {settings.backup.enabled && (
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded">
                <h4 className="font-semibold mb-2">Backup Schedule</h4>
                <ul className="text-sm space-y-1">
                  <li>• {settings.backup.schedule.charAt(0).toUpperCase() + settings.backup.schedule.slice(1)} backups at 2:00 AM UTC</li>
                  <li>• Retention: {settings.backup.retention.daily} days for daily, {settings.backup.retention.weekly} weeks for weekly</li>
                  <li>• Storage: {settings.backup.storage}</li>
                </ul>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Manual Backup</h4>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Database className="mr-2 h-4 w-4" />
                  Backup Now
                </Button>
                <Button variant="outline">Download Backup</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Last backup: {settings.backup.lastBackup}
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

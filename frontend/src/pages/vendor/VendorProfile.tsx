/**
 * VendorProfile Page
 * 
 * Displays vendor profile information and allows editing.
 * Shows performance metrics and profile details.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.8, 8.9
 */

import { useState, useEffect } from 'react';
import vendorApi from '@/services/api/vendorApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Clock,
  Award,
} from 'lucide-react';
import type { VendorProfile as VendorProfileType } from '@/types/vendor/portal';

export default function VendorProfile() {
  // State
  const [profile, setProfile] = useState<VendorProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    contact_person: '',
    address: '',
  });

  // Form errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  /**
   * Fetch vendor profile
   */
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await vendorApi.getProfile();

      if (response.success) {
        setProfile(response.data);
        setFormData({
          email: response.data.email || '',
          phone: response.data.phone || '',
          contact_person: response.data.contact_person || '',
          address: response.data.address || '',
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initial data fetch
   */
  useEffect(() => {
    fetchProfile();
  }, []);

  /**
   * Handle form field change
   */
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone && formData.phone.length < 10) {
      errors.phone = 'Phone number must be at least 10 digits';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle save profile
   */
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await vendorApi.updateProfile(formData);

      if (response.success) {
        setProfile(response.data);
        setIsEditing(false);
        setSuccessMessage('Profile updated successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle cancel edit
   */
  const handleCancel = () => {
    if (profile) {
      setFormData({
        email: profile.email || '',
        phone: profile.phone || '',
        contact_person: profile.contact_person || '',
        address: profile.address || '',
      });
    }
    setFormErrors({});
    setIsEditing(false);
    setError(null);
  };

  /**
   * Format percentage
   */
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  /**
   * Format hours
   */
  const formatHours = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    }
    return `${hours.toFixed(1)} hours`;
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error && !profile) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive mb-4">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">Error Loading Profile</h3>
            </div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchProfile()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Profile</h1>
          <p className="text-muted-foreground">Manage your profile information and view performance metrics</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(profile.performance_metrics.acceptance_rate)}</div>
            <p className="text-xs text-muted-foreground">
              {profile.performance_metrics.accepted_quotes} of {profile.performance_metrics.total_quotes} quotes accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHours(profile.performance_metrics.average_response_time)}</div>
            <p className="text-xs text-muted-foreground">
              Average time to respond to quotes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.performance_metrics.total_quotes}</div>
            <p className="text-xs text-muted-foreground">
              {profile.performance_metrics.pending_quotes} pending responses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription>
            Your company details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Name (Read-only) */}
          <div>
            <Label>Company Name</Label>
            <div className="mt-1.5 p-3 bg-muted rounded-md">
              <p className="font-medium">{profile.company_name}</p>
              <p className="text-xs text-muted-foreground mt-1">Company name cannot be changed</p>
            </div>
          </div>

          <Separator />

          {/* Email */}
          <div>
            <Label htmlFor="email">Email Address</Label>
            {isEditing ? (
              <>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className={formErrors.email ? 'border-destructive' : ''}
                  disabled={isSaving}
                />
                {formErrors.email && (
                  <p className="text-sm text-destructive mt-1">{formErrors.email}</p>
                )}
                {formData.email !== profile.email && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Email verification will be required after saving
                  </p>
                )}
              </>
            ) : (
              <div className="mt-1.5 flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p>{profile.email || 'Not provided'}</p>
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            {isEditing ? (
              <>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className={formErrors.phone ? 'border-destructive' : ''}
                  disabled={isSaving}
                  placeholder="+62 xxx xxxx xxxx"
                />
                {formErrors.phone && (
                  <p className="text-sm text-destructive mt-1">{formErrors.phone}</p>
                )}
              </>
            ) : (
              <div className="mt-1.5 flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p>{profile.phone || 'Not provided'}</p>
              </div>
            )}
          </div>

          {/* Contact Person */}
          <div>
            <Label htmlFor="contact_person">Contact Person</Label>
            {isEditing ? (
              <Input
                id="contact_person"
                type="text"
                value={formData.contact_person}
                onChange={(e) => handleFieldChange('contact_person', e.target.value)}
                disabled={isSaving}
                placeholder="John Doe"
              />
            ) : (
              <div className="mt-1.5 flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <p>{profile.contact_person || 'Not provided'}</p>
              </div>
            )}
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address">Address</Label>
            {isEditing ? (
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                disabled={isSaving}
                placeholder="Street address, City, Province"
              />
            ) : (
              <div className="mt-1.5 flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p>{profile.address || 'Not provided'}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

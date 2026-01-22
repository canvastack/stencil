import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Link, FolderTree, Check } from 'lucide-react';
import type { UrlPatternType } from '@/types/tenant-url';

/**
 * Props untuk UrlPatternSelector component
 */
interface UrlPatternSelectorProps {
  value: UrlPatternType | undefined;
  onChange: (pattern: UrlPatternType) => void;
  tenantSlug: string;
}

interface PatternOption {
  value: UrlPatternType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  example: (slug: string) => string;
  badge?: string;
  recommended?: boolean;
}

const PATTERN_OPTIONS: PatternOption[] = [
  {
    value: 'subdomain',
    label: 'Subdomain-Based',
    description: 'Access via unique subdomain',
    icon: Globe,
    example: (slug) => `${slug}.stencil.canvastack.com`,
    recommended: true,
    badge: 'Recommended',
  },
  {
    value: 'path',
    label: 'Path-Based',
    description: 'Access via URL path prefix',
    icon: FolderTree,
    example: (slug) => `stencil.canvastack.com/${slug}`,
  },
  {
    value: 'custom_domain',
    label: 'Custom Domain',
    description: 'Use your own domain name',
    icon: Link,
    example: () => 'yourdomain.com',
    badge: 'Pro',
  },
];

/**
 * UrlPatternSelector Component
 * 
 * Komponen untuk memilih pola URL yang akan digunakan tenant untuk mengakses aplikasi.
 * Menyediakan 3 pilihan: Subdomain-based, Path-based, atau Custom Domain.
 * Menampilkan contoh URL untuk setiap pola dan menandai pilihan yang recommended.
 * 
 * @component
 * @example
 * ```tsx
 * <UrlPatternSelector 
 *   value="subdomain" 
 *   onChange={(pattern) => console.log(pattern)} 
 *   tenantSlug="mytenant" 
 * />
 * ```
 * 
 * @param {UrlPatternSelectorProps} props - Component props
 * @param {UrlPatternType | undefined} props.value - Pola URL yang sedang dipilih
 * @param {Function} props.onChange - Callback saat pola URL berubah
 * @param {string} props.tenantSlug - Slug tenant untuk generate contoh URL
 * 
 * @returns {JSX.Element} Grid of selectable URL pattern cards
 * 
 * @see {@link UrlPatternType} untuk tipe pattern yang tersedia
 */
export default function UrlPatternSelector({
  value,
  onChange,
  tenantSlug,
}: UrlPatternSelectorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PATTERN_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        const Icon = option.icon;

        return (
          <Card
            key={option.value}
            className={cn(
              'relative cursor-pointer transition-all hover:border-primary',
              isSelected && 'border-primary bg-primary/5'
            )}
            onClick={() => onChange(option.value)}
          >
            {isSelected && (
              <div className="absolute top-3 right-3">
                <div className="bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="h-4 w-4" />
                </div>
              </div>
            )}

            {option.badge && (
              <div className="absolute top-3 left-3">
                <Badge variant={option.recommended ? 'default' : 'secondary'}>
                  {option.badge}
                </Badge>
              </div>
            )}

            <div className="p-6 pt-12 space-y-4">
              <div className="flex justify-center">
                <div className={cn(
                  'p-3 rounded-lg',
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                  <Icon className="h-8 w-8" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">{option.label}</h3>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>

              <div className="bg-muted p-3 rounded-md">
                <p className="text-xs text-muted-foreground mb-1">Contoh:</p>
                <code className="text-sm font-mono break-all">
                  {option.example(tenantSlug)}
                </code>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

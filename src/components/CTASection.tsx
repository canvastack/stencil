import { Button } from "@/components/ui/button";
import { Target, MessageSquare } from "lucide-react";

interface CTASectionProps {
  title: string;
  subtitle: string;
  primaryButtonText: string;
  primaryButtonIcon?: React.ReactNode;
  secondaryButtonText: string;
  secondaryButtonIcon?: React.ReactNode;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  stats?: Array<{
    value: string;
    label: string;
  }>;
  className?: string;
}

export const CTASection = ({
  title,
  subtitle,
  primaryButtonText,
  primaryButtonIcon,
  secondaryButtonText,
  secondaryButtonIcon,
  onPrimaryClick,
  onSecondaryClick,
  stats,
  className = ""
}: CTASectionProps) => {
  return (
    <section className={`py-20 px-4 bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-white ${className}`}>
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {title}
          </h2>
          <p className="text-lg md:text-xl text-white/90">
            {subtitle}
          </p>
        </div>

        {stats && stats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-white/90 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-[#475569] hover:bg-[#334155] text-white font-semibold px-8 shadow-xl hover:shadow-2xl transition-all"
            onClick={onPrimaryClick}
          >
            {primaryButtonIcon}
            {primaryButtonText}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-[#fbbf24] bg-transparent hover:bg-white/10 text-white font-semibold px-8 shadow-xl hover:shadow-2xl transition-all"
            onClick={onSecondaryClick}
          >
            {secondaryButtonIcon}
            {secondaryButtonText}
          </Button>
        </div>
      </div>
    </section>
  );
};
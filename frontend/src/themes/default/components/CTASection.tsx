import { Button } from "@/components/ui/button";
import type { CTASectionProps } from "@/core/engine/interfaces";

const CTASection: React.FC<CTASectionProps> = ({
  className,
  title = "Title",
  description = "Description",
  buttonText = "Get Started",
  onAction
}) => {
  return (
    <section className={`py-20 px-4 bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-white ${className || ''}`}>
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {title}
          </h2>
          <p className="text-lg md:text-xl text-white/90">
            {description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-[#475569] hover:bg-[#334155] text-white font-semibold px-8 shadow-xl hover:shadow-2xl transition-all"
            onClick={onAction}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
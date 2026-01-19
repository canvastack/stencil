import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette } from "lucide-react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  showPresets?: boolean;
  required?: boolean;
}

const presetColors = [
  { name: "Hitam", value: "#000000" },
  { name: "Putih", value: "#FFFFFF" },
  { name: "Merah", value: "#EF4444" },
  { name: "Biru", value: "#3B82F6" },
  { name: "Hijau", value: "#10B981" },
  { name: "Kuning", value: "#F59E0B" },
  { name: "Ungu", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Abu-abu", value: "#6B7280" },
  { name: "Coklat", value: "#92400E" },
  { name: "Emas", value: "#FFD700" },
  { name: "Perak", value: "#C0C0C0" },
];

export const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(
  ({ value, onChange, label = "Pilih Warna", showPresets = true, required = false }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [gradientStart, setGradientStart] = React.useState("#000000");
    const [gradientEnd, setGradientEnd] = React.useState("#FFFFFF");
    const [useGradient, setUseGradient] = React.useState(false);

    const handlePresetClick = (color: string) => {
      onChange(color);
      setIsOpen(false);
    };

    const handleGradientApply = () => {
      const gradientValue = `linear-gradient(to right, ${gradientStart}, ${gradientEnd})`;
      onChange(gradientValue);
      setIsOpen(false);
    };

    const isGradient = value.startsWith("linear-gradient");
    const displayColor = isGradient ? gradientStart : (value.startsWith('#') ? value : '#000000');

    return (
      <div className="space-y-2">
        {label && (
          <Label className="text-sm font-medium text-foreground">
            {label} {required && <span className="text-destructive">*</span>}
          </Label>
        )}
        
        <div className="space-y-3">
          {/* Manual Text Input */}
          <Input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Contoh: Hitam, Putih, atau #FF0000"
            className="w-full"
            required={required}
          />

          {/* Color Picker Popover */}
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <Palette className="h-4 w-4" />
                <span>Pilih dari Color Picker</span>
                <div
                  className="ml-auto w-6 h-6 rounded border-2 border-border"
                  style={{ 
                    background: isGradient ? value : displayColor 
                  }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-4">
                {/* Mode Selection */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={!useGradient ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseGradient(false)}
                    className="flex-1"
                  >
                    Solid Color
                  </Button>
                  <Button
                    type="button"
                    variant={useGradient ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseGradient(true)}
                    className="flex-1"
                  >
                    Gradient
                  </Button>
                </div>

                {!useGradient ? (
                  <>
                    {/* Dynamic Color Picker */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-foreground">Pilih Warna Dinamis:</Label>
                      <div className="flex gap-3 items-center p-3 bg-muted/50 rounded-lg border border-border">
                        <div className="flex-1">
                          <input
                            type="color"
                            value={displayColor}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-full h-12 rounded border-2 border-border cursor-pointer bg-background"
                            style={{ minHeight: '48px' }}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div
                            className="w-16 h-12 rounded border-2 border-border shadow-sm"
                            style={{ backgroundColor: displayColor }}
                          />
                          <span className="text-xs text-center text-muted-foreground font-mono">
                            {displayColor.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        💡 Klik pada kotak warna untuk membuka color picker
                      </p>
                    </div>

                    {/* Preset Colors */}
                    {showPresets && (
                      <div className="border-t border-border pt-3">
                        <Label className="text-sm font-medium text-foreground mb-2 block">
                          Atau Pilih Warna Template:
                        </Label>
                        <div className="grid grid-cols-4 gap-2">
                          {presetColors.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => handlePresetClick(color.value)}
                              className="flex flex-col items-center gap-1 p-2 rounded hover:bg-muted transition-colors"
                              title={color.name}
                            >
                              <div
                                className="w-8 h-8 rounded border-2 border-border shadow-sm"
                                style={{ backgroundColor: color.value }}
                              />
                              <span className="text-xs text-muted-foreground">
                                {color.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Gradient Color Picker */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-foreground">Buat Gradasi Warna:</Label>
                      
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Warna Awal:</Label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={gradientStart}
                            onChange={(e) => setGradientStart(e.target.value)}
                            className="w-full h-10 rounded border-2 border-border cursor-pointer"
                          />
                          <div
                            className="w-10 h-10 rounded border-2 border-border flex-shrink-0"
                            style={{ backgroundColor: gradientStart }}
                          />
                          <span className="text-xs text-muted-foreground font-mono">
                            {gradientStart.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Warna Akhir:</Label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={gradientEnd}
                            onChange={(e) => setGradientEnd(e.target.value)}
                            className="w-full h-10 rounded border-2 border-border cursor-pointer"
                          />
                          <div
                            className="w-10 h-10 rounded border-2 border-border flex-shrink-0"
                            style={{ backgroundColor: gradientEnd }}
                          />
                          <span className="text-xs text-muted-foreground font-mono">
                            {gradientEnd.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-muted/50 rounded-lg border border-border">
                        <Label className="text-xs text-muted-foreground mb-2 block">Preview Gradasi:</Label>
                        <div
                          className="w-full h-16 rounded border-2 border-border"
                          style={{
                            background: `linear-gradient(to right, ${gradientStart}, ${gradientEnd})`
                          }}
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={handleGradientApply}
                        className="w-full"
                      >
                        Terapkan Gradasi
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Color Preview */}
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded border border-border">
            <div
              className="w-8 h-8 rounded border-2 border-border shadow-sm flex-shrink-0"
              style={{
                background: isGradient ? value : displayColor
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Preview Warna:</p>
              <p className="text-xs font-mono text-foreground truncate">{value || 'Belum dipilih'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ColorPicker.displayName = "ColorPicker";

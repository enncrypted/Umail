import { Moon, Sun, SunMoon } from "lucide-react";
import { useTheme, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "Auto", Icon: SunMoon },
];

/** Segmented light / dark / auto slider with an animated thumb. */
export function ThemeSlider({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { preference, setPreference } = useTheme();
  const index = OPTIONS.findIndex((o) => o.value === preference);

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className={cn(
        "relative grid grid-cols-3 gap-1 rounded-full border border-border bg-secondary/70 p-1",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-full bg-card shadow-panel transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          width: `calc((100% - 0.5rem) / 3)`,
          transform: `translateX(calc(${Math.max(index, 0)} * (100% + 0.25rem)))`,
        }}
      />
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => setPreference(value)}
            className={cn(
              "focus-ring relative z-10 flex items-center justify-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition-colors duration-200",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "size-3.5 transition-transform duration-500",
                active && value === "dark" && "-rotate-12",
                active && value === "light" && "rotate-90",
              )}
            />
            {!compact && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}

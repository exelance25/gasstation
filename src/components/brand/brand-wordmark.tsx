import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/one-coin-icon";

type BrandWordmarkProps = {
  size?: "sm" | "md" | "lg" | "hero";
  variant?: "default" | "splash" | "auth";
  hideLogo?: boolean;
  showTagline?: boolean;
  tagline?: string;
  className?: string;
};

const logoSizes = {
  sm: "sm" as const,
  md: "md" as const,
  lg: "lg" as const,
  hero: "xl" as const
};

const textSizes = {
  sm: "text-xl sm:text-2xl",
  md: "text-2xl sm:text-3xl",
  lg: "text-3xl sm:text-4xl",
  hero: "text-4xl sm:text-5xl"
};

export function BrandWordmark({
  size = "md",
  variant = "default",
  hideLogo = false,
  showTagline = false,
  tagline,
  className
}: BrandWordmarkProps) {
  const isSplash = variant === "splash";
  const isAuth = variant === "auth" || variant === "default";

  return (
    <div className={cn("flex flex-col items-center gap-3 text-center", className)}>
      <div className={cn("flex items-center", hideLogo ? "justify-center" : "gap-3 sm:gap-4")}>
        {!hideLogo && (
          <div className="embossed-3d shrink-0 rounded-full p-1">
            <BrandLogo size={logoSizes[size]} />
          </div>
        )}
        <span
          className={cn(
            "font-bold leading-none tracking-tight",
            textSizes[size],
            isSplash
              ? "bg-gradient-to-r from-white via-monad-100 to-monad-200 bg-clip-text text-transparent drop-shadow-sm"
              : isAuth
                ? "bg-gradient-to-r from-monad-600 via-monad-500 to-monad-400 bg-clip-text text-transparent"
                : "bg-gradient-to-r from-accent via-primary-light to-accent bg-clip-text text-transparent"
          )}
        >
          ONEBALANCE
        </span>
      </div>
      {(showTagline || tagline) && (
        <p
          className={cn(
            "max-w-xs text-sm font-medium leading-relaxed sm:text-base",
            isSplash ? "text-white/90" : "text-monad-ink/75"
          )}
        >
          {tagline}
        </p>
      )}
    </div>
  );
}

"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: string) {
    if (next === locale) return;
    const segments = pathname.split("/");
    segments[1] = next;
    router.replace(segments.join("/") || `/${next}`);
  }

  return (
    <div className="flex overflow-hidden rounded-md border border-ink/10 bg-white/70 text-xs font-600">
      {(["en", "fr"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => switchTo(code)}
          className={`px-2.5 py-1.5 uppercase tracking-wide transition ${
            locale === code
              ? "bg-ink text-accent"
              : "text-ink/55 hover:text-ink"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

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
    <div className="flex items-center gap-1 text-sm text-slate">
      <button
        type="button"
        onClick={() => switchTo("en")}
        className={locale === "en" ? "font-semibold text-ink" : "hover:text-ink"}
      >
        EN
      </button>
      <span aria-hidden>/</span>
      <button
        type="button"
        onClick={() => switchTo("fr")}
        className={locale === "fr" ? "font-semibold text-ink" : "hover:text-ink"}
      >
        FR
      </button>
    </div>
  );
}

import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { DM_Sans, Syne } from "next/font/google";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";

const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const display = Syne({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "common" });
  return {
    title: t("brand"),
    description: t("metaDescription"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!routing.locales.includes(locale as "en" | "fr")) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Header />
            <main className="relative mx-auto min-h-[calc(100vh-5rem)] max-w-6xl px-4 pb-16 pt-6 sm:px-6">
              {children}
            </main>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

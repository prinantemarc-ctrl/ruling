import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const serif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-serif",
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
    description: "Prediction markets settled in USDC",
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
      <body className={`${sans.variable} ${serif.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Header />
            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

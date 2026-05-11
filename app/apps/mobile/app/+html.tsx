import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* PWA / home-screen icon — iOS Safari uses apple-touch-icon */}
        <link rel="apple-touch-icon" href="/assets/icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/icon.png" />

        {/* Android / Chrome PWA icons are declared in the auto-generated manifest.json */}

        {/* iOS standalone display */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KC" />

        {/* Theme colour for Android Chrome */}
        <meta name="theme-color" content="#F97316" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}

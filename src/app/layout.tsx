import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { MainNavigation } from "./main-navigation";

import "./globals.css";
import "./case-led.css";
import "./studies/evidence-state.css";
import "./workstation.css";

export const metadata: Metadata = {
  title: {
    default: "Synapse Atlas",
    template: "%s",
  },
  description:
    "Compare saved clinical-trial evidence with a fresh registry record and export a reproducible research brief.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body><a className="skip-link" href="#main-content">Skip to content</a><header className="site-header"><Link className="brand" href="/"><Image src="/brand/synapse-atlas-mark.png" width={36} height={36} priority alt="" /><span className="brand-wordmark">Synapse Atlas</span></Link><MainNavigation /></header>{children}<footer className="site-footer"><span>Synapse Atlas · Research use only</span><Link href="/catalogue">Saved catalogue</Link><Link href="/programs">Programme context</Link><Link href="/trials">Live registry search</Link><Link href="/methodology">Sources &amp; limitations</Link></footer></body>
    </html>
  );
}

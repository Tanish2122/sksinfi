import React from "react";
import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact SKS INFI | Financial Consultant & Loan Advisory in Jaipur",
  description:
    "Get in touch with SKS INFI in Jaipur for expert financial consultation, home loans, MSME government subsidies, mutual funds and 24/7 NRI advisory services. Call +91 99285 29222.",
  keywords: [
    "SKS INFI Contact Number",
    "Financial Consultant in Jaipur",
    "Loan Advisory Jaipur",
    "MSME Subsidy Consultant Jaipur",
    "Sunny Trade Centre Mansarovar Jaipur",
    "NRI Financial Desk Jaipur",
    "CA Aarun Jain Contact"
  ],
  alternates: {
    canonical: "https://www.sksinfi.com/contact"
  },
  openGraph: {
    title: "Contact SKS INFI | Trusted Financial Advisory & Loans in Jaipur",
    description:
      "Connect with CA Aarun Jain and the SKS INFI senior advisory panel. 12+ nationwide branches, ₹85+ Cr loan facilitation track record.",
    url: "https://www.sksinfi.com/contact",
    siteName: "SKS INFI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://www.sksinfi.com/img/aboutus.png",
        width: 1200,
        height: 630,
        alt: "Contact SKS INFI Jaipur"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact SKS INFI | Trusted Financial Advisory in Jaipur",
    description: "Get in touch for home loans, MSME subsidies, and wealth advisory. Call +91 99285 29222.",
    images: ["https://www.sksinfi.com/img/aboutus.png"]
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FinancialService",
  name: "SKS INFI",
  description: "Premier financial consultancy, loan DSA, MSME subsidy advisory and wealth management firm.",
  url: "https://www.sksinfi.com/contact",
  telephone: "+91-99285-29222",
  email: "infi@sksinfi.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "520, 5th Floor, Sunny Trade Centre, New Aatish Market, Mansarovar",
    addressLocality: "Jaipur",
    addressRegion: "Rajasthan",
    postalCode: "302020",
    addressCountry: "IN"
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 26.87697977666848,
    longitude: 75.7583884754382
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:30",
      closes: "19:30"
    }
  ],
  priceRange: "₹₹"
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContactClient />
    </>
  );
}

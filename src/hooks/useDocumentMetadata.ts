import { useEffect } from "react";

const SITE_URL = "https://orbitalwatch.vercel.app";
const SITE_NAME = "Orbital Watch";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

function setMetaAttribute(
  selector: string,
  attributeName: "name" | "property",
  attributeValue: string,
  content: string
) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function setCanonicalUrl(url: string) {
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }

  canonical.setAttribute("href", url);
}

export function useDocumentMetadata(
  title: string,
  description: string,
  ogImage: string = DEFAULT_OG_IMAGE
) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    const canonicalUrl = `${SITE_URL}${window.location.pathname}`;

    let metaDescription = document.querySelector('meta[name="description"]');
    const hasExistingMeta = !!metaDescription;
    let prevDescription = "";

    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    } else {
      prevDescription = metaDescription.getAttribute("content") || "";
    }

    metaDescription.setAttribute("content", description);
    setCanonicalUrl(canonicalUrl);

    // Open Graph
    setMetaAttribute('meta[property="og:site_name"]', "property", "og:site_name", SITE_NAME);
    setMetaAttribute('meta[property="og:type"]', "property", "og:type", "website");
    setMetaAttribute('meta[property="og:title"]', "property", "og:title", title);
    setMetaAttribute('meta[property="og:description"]', "property", "og:description", description);
    setMetaAttribute('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    setMetaAttribute('meta[property="og:image"]', "property", "og:image", ogImage);
    setMetaAttribute('meta[property="og:image:alt"]', "property", "og:image:alt", `${SITE_NAME} — ${title}`);

    // Twitter / X
    setMetaAttribute('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMetaAttribute('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMetaAttribute('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMetaAttribute('meta[name="twitter:image"]', "name", "twitter:image", ogImage);
    setMetaAttribute('meta[name="twitter:image:alt"]', "name", "twitter:image:alt", `${SITE_NAME} — ${title}`);

    // Dynamic Page JSON-LD Structured Data Schema
    let ldJsonScript = document.head.querySelector<HTMLScriptElement>('script[type="application/ld+json"]#page-schema');
    if (!ldJsonScript) {
      ldJsonScript = document.createElement("script");
      ldJsonScript.setAttribute("type", "application/ld+json");
      ldJsonScript.setAttribute("id", "page-schema");
      document.head.appendChild(ldJsonScript);
    }
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "url": canonicalUrl,
      "image": ogImage,
      "author": {
        "@type": "Organization",
        "name": "Orbital Watch"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Orbital Watch",
        "logo": {
          "@type": "ImageObject",
          "url": `${SITE_URL}/og-image.png`
        }
      }
    };
    ldJsonScript.textContent = JSON.stringify(schema);

    return () => {
      document.title = prevTitle;
      if (metaDescription) {
        if (hasExistingMeta) {
          metaDescription.setAttribute("content", prevDescription);
        } else {
          document.head.removeChild(metaDescription);
        }
      }
      const scriptToRemove = document.head.querySelector('script[type="application/ld+json"]#page-schema');
      if (scriptToRemove) {
        document.head.removeChild(scriptToRemove);
      }
    };
  }, [title, description, ogImage]);
}

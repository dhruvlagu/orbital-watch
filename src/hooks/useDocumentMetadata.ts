import { useEffect } from "react";

const SITE_URL = "https://orbitalwatch.vercel.app";
const SITE_NAME = "Orbital Watch";

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

export function useDocumentMetadata(title: string, description: string) {
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
    setMetaAttribute('meta[property="og:site_name"]', "property", "og:site_name", SITE_NAME);
    setMetaAttribute('meta[property="og:type"]', "property", "og:type", "website");
    setMetaAttribute('meta[property="og:title"]', "property", "og:title", title);
    setMetaAttribute(
      'meta[property="og:description"]',
      "property",
      "og:description",
      description
    );
    setMetaAttribute('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    setMetaAttribute('meta[name="twitter:card"]', "name", "twitter:card", "summary");
    setMetaAttribute('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMetaAttribute(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      description
    );

    return () => {
      document.title = prevTitle;
      if (metaDescription) {
        if (hasExistingMeta) {
          metaDescription.setAttribute("content", prevDescription);
        } else {
          document.head.removeChild(metaDescription);
        }
      }
    };
  }, [title, description]);
}

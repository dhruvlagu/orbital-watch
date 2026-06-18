import { useEffect } from "react";

export function useDocumentMetadata(title: string, description: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

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

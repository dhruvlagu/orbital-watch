export interface RepresentativeContact {
  contactForm: string | null;
  officialSite: string | null;
  phone: string | null;
  mailingAddress: string | null;
}

export interface RepresentativeResult {
  representativeName?: string;
  lastName?: string;
  district?: number;
  matchProportion?: number;
  isAmbiguousMatch?: boolean;
  contact?: RepresentativeContact;
  noMatch?: boolean;
  message?: string;
  error?: string;
}

export async function lookupRepresentative(zip: string): Promise<RepresentativeResult> {
  const cleanZip = zip.trim();
  if (!cleanZip) {
    throw new Error("Please enter a valid zip code.");
  }

  // Add timeout to prevent indefinite hanging on slow/unavailable API
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const res = await fetch(`/api/spacetrack/representative?zip=${encodeURIComponent(cleanZip)}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Lookup failed with status ${res.status}`);
    }

    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error("Lookup timed out. Please try again.");
    }
    throw err;
  }
}

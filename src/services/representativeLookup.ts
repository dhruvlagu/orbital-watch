export interface RepresentativeContact {
  contactForm: string | null;
  officialSite: string | null;
  phone: string | null;
  mailingAddress: string | null;
}

export interface RepresentativeResult {
  representativeName?: string;
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

  const res = await fetch(`/api/spacetrack/representative?zip=${encodeURIComponent(cleanZip)}`);
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Lookup failed with status ${res.status}`);
  }

  return res.json();
}

// api/representative.mjs
// Vercel serverless function using Geocodio API to look up US House representative by zip code.
// Uses process.env.GEOCODIO_API_KEY (never exposed client-side).

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawZip = req.query.zip || req.query.q;
  if (!rawZip || typeof rawZip !== "string") {
    return res.status(400).json({ error: "Missing or invalid zip code parameter." });
  }

  const zip = rawZip.trim();
  const apiKey = process.env.GEOCODIO_API_KEY;

  if (!apiKey) {
    console.error("[api/representative] Missing GEOCODIO_API_KEY environment variable.");
    return res.status(500).json({ error: "Representative lookup service is unconfigured." });
  }

  try {
    const geocodioUrl = `https://api.geocod.io/v1.9/geocode?q=${encodeURIComponent(zip)}&fields=cd&api_key=${apiKey}`;
    const apiRes = await fetch(geocodioUrl);

    if (!apiRes.ok) {
      console.error(`[api/representative] Geocodio API returned status ${apiRes.status}`);
      return res.status(502).json({ error: "Unable to reach address lookup service." });
    }

    const data = await apiRes.json();
    const results = data.results;

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(200).json({ noMatch: true, message: "No match found for this zip code." });
    }

    // Collect all congressional_districts from all returned geocodio results
    let bestDistrict = null;
    let maxProportion = -1;

    for (const result of results) {
      const districts = result.fields?.congressional_districts;
      if (Array.isArray(districts) && districts.length > 0) {
        for (const dist of districts) {
          const prop = typeof dist.proportion === "number" ? dist.proportion : 1;
          if (prop > maxProportion) {
            maxProportion = prop;
            bestDistrict = dist;
          }
        }
      }
    }

    if (!bestDistrict) {
      return res.status(200).json({ noMatch: true, message: "No congressional district found for this zip code." });
    }

    const legislators = bestDistrict.current_legislators;
    if (!Array.isArray(legislators) || legislators.length === 0) {
      return res.status(200).json({ noMatch: true, message: "No legislators found for this district." });
    }

    // Filter to ONLY House representative (type === "representative"), discard senators
    const rep = legislators.find((l) => l.type === "representative");

    if (!rep) {
      return res.status(200).json({ noMatch: true, message: "No House representative found for this district." });
    }

    const bio = rep.bio || {};
    const contact = rep.contact || {};
    const firstName = bio.first_name || "";
    const lastName = bio.last_name || "";
    const representativeName = `${firstName} ${lastName}`.trim() || "Representative";
    const districtNumber = typeof bestDistrict.district_number === "number"
      ? bestDistrict.district_number
      : parseInt(bestDistrict.district_number || "0", 10);

    const matchProportion = maxProportion > 0 ? maxProportion : 1;
    const isAmbiguousMatch = matchProportion < 0.9;

    return res.status(200).json({
      representativeName,
      district: districtNumber,
      matchProportion,
      isAmbiguousMatch,
      contact: {
        contactForm: contact.contact_form || null,
        officialSite: contact.url || null,
        phone: contact.phone || null,
        mailingAddress: contact.address || null,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[api/representative] Lookup error:", msg);
    return res.status(500).json({ error: "Failed to perform representative lookup." });
  }
}

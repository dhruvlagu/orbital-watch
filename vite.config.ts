import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function representativeLookupPlugin(apiKey: string | undefined) {
  return {
    name: "representative-lookup",
    configureServer(server: any) {
      const handleRepresentativeRoute = async (req: any, res: any) => {
        try {
          const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
          const zip = url.searchParams.get("zip") || url.searchParams.get("q");
          if (!zip) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing or invalid zip code parameter." }));
            return;
          }

          if (!apiKey) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing GEOCODIO_API_KEY environment variable." }));
            return;
          }

          const geocodioUrl =
            `https://api.geocod.io/v1.9/geocode?q=${encodeURIComponent(zip.trim())}` +
            `&fields=cd&api_key=${apiKey}`;
          const apiResponse = await fetch(geocodioUrl);
          if (!apiResponse.ok) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Unable to reach address lookup service." }));
            return;
          }

          const data: any = await apiResponse.json();
          const results = data.results;
          if (!Array.isArray(results) || results.length === 0) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ noMatch: true, message: "No match found for this zip code." }));
            return;
          }

          let bestDistrict: any = null;
          let maxProportion = -1;
          for (const result of results) {
            const districts = result.fields?.congressional_districts;
            if (Array.isArray(districts)) {
              for (const district of districts) {
                const proportion = typeof district.proportion === "number" ? district.proportion : 1;
                if (proportion > maxProportion) {
                  maxProportion = proportion;
                  bestDistrict = district;
                }
              }
            }
          }

          const noMatch = (message: string) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ noMatch: true, message }));
          };
          if (!bestDistrict) {
            noMatch("No congressional district found for this zip code.");
            return;
          }

          const legislators = bestDistrict.current_legislators;
          if (!Array.isArray(legislators) || legislators.length === 0) {
            noMatch("No legislators found for this district.");
            return;
          }

          const representative = legislators.find((legislator: any) => legislator.type === "representative");
          if (!representative) {
            noMatch("No House representative found for this district.");
            return;
          }

          const bio = representative.bio || {};
          const contact = representative.contact || {};
          const representativeName =
            `${bio.first_name || ""} ${bio.last_name || ""}`.trim() || "Representative";
          const districtNumber = typeof bestDistrict.district_number === "number"
            ? bestDistrict.district_number
            : parseInt(bestDistrict.district_number || "0", 10);
          const matchProportion = maxProportion > 0 ? maxProportion : 1;

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            representativeName,
            district: districtNumber,
            matchProportion,
            isAmbiguousMatch: matchProportion < 0.9,
            contact: {
              contactForm: contact.contact_form || null,
              officialSite: contact.url || null,
              phone: contact.phone || null,
              mailingAddress: contact.address || null,
            },
          }));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to perform representative lookup.",
          }));
        }
      };

      server.middlewares.use("/api/spacetrack/representative", handleRepresentativeRoute);
      server.middlewares.use("/api/representative", handleRepresentativeRoute);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "GEOCODIO_");

  return {
    plugins: [react(), representativeLookupPlugin(env.GEOCODIO_API_KEY)],
    server: {
      proxy: {
        "/api/spacetrack/satcat": {
          target: "https://orbitalwatch.app",
          changeOrigin: true,
        },
        "/api/spacetrack/conjunctions": {
          target: "https://orbitalwatch.app",
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("scheduler") || id.includes("prop-types")) {
                return "vendor";
              }
              if (id.includes("chart.js") || id.includes("react-chartjs-2")) {
                return "charts";
              }
              return "deps";
            }
          },
        },
      },
    },
  };
});

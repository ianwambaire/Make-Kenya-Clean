const endpoint = import.meta.env.VITE_NOMINATIM_REVERSE_URL || "https://nominatim.openstreetmap.org/reverse";
const names = new Map();
const pending = new Map();
let queue = Promise.resolve();
let lastRequestAt = 0;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function conciseLocationName(result) {
  const address = result?.address || {};
  const namedPlace = text(address.amenity) || text(address.university) ||
    text(address.school) || text(address.hospital) || text(address.tourism) ||
    text(address.leisure) || text(address.shop) || text(address.office);
  const objectName = ["amenity", "building", "tourism", "leisure", "shop", "office", "historic"].includes(result?.category || result?.class)
    ? text(result.name) : "";
  const place = namedPlace || objectName || text(address.building) ||
    text(address.neighbourhood) || text(address.suburb) || text(address.quarter) ||
    text(address.residential) || text(address.road) || text(address.pedestrian) ||
    text(address.village) || text(address.hamlet);
  const city = text(address.city) || text(address.town) || text(address.municipality);
  const parts = [place, city].filter(Boolean);
  return [...new Map(parts.map((part) => [part.toLowerCase(), part])).values()].join(", ").slice(0, 240);
}

export function reverseGeocode(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return Promise.reject(new Error("Invalid location"));
  }
  const key = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  if (names.has(key)) return Promise.resolve(names.get(key));
  if (pending.has(key)) return pending.get(key);

  const request = queue.then(async () => {
    const delay = Math.max(0, 1100 - (Date.now() - lastRequestAt));
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    lastRequestAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const url = new URL(endpoint);
      url.search = new URLSearchParams({ format: "jsonv2", lat: latitude.toFixed(5), lon: longitude.toFixed(5), addressdetails: "1", zoom: "18", "accept-language": "en" }).toString();
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        referrerPolicy: "strict-origin-when-cross-origin",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Place lookup unavailable");
      const name = conciseLocationName(await response.json());
      if (name.length < 3) throw new Error("No mapped place name");
      if (names.size >= 100) names.delete(names.keys().next().value);
      names.set(key, name);
      return name;
    } finally {
      clearTimeout(timeout);
    }
  });
  pending.set(key, request);
  queue = request.catch(() => {});
  request.finally(() => pending.delete(key)).catch(() => {});
  return request;
}

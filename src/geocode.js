const cache = new Map()

export async function geocodeCity(cityName) {
    const key = cityName.toLowerCase().trim()
    if (cache.has(key)) return cache.get(key)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    let response
    try {
        response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`,
            {
                signal: controller.signal,
                headers: { 'User-Agent': 'oracle-celeste/1.0 (contact: aurelien.delogu@gmail.com)' }
            }
        )
    } finally {
        clearTimeout(timeout)
    }

    const data = await response.json()
    if (!data.length) throw new GeocodingError(`Ville introuvable : "${cityName}". Essayez un nom plus précis.`)

    const result = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), displayName: data[0].display_name }
    cache.set(key, result)
    return result
}

export class GeocodingError extends Error {}

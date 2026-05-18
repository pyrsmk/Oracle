import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { Origin, Horoscope } = require('circular-natal-horoscope-js')

const PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']

// Planet significance order for sorting when orbs are tied
const PLANET_WEIGHT = { sun: 0, moon: 1, mercury: 2, venus: 3, mars: 4, jupiter: 5, saturn: 6, uranus: 7, neptune: 8, pluto: 9 }

const ASPECT_ANGLES = { conjunction: 0, opposition: 180, trine: 120, square: 90, sextile: 60 }
const ASPECT_ORBS   = { conjunction: 8, opposition: 8, trine: 8, square: 7, sextile: 6 }

const MINOR_ASPECT_ANGLES = { quincunx: 150, semisquare: 45 }
const MINOR_ASPECT_ORBS   = { quincunx: 3, semisquare: 3 }

const ALL_ASPECT_ANGLES = { ...ASPECT_ANGLES, ...MINOR_ASPECT_ANGLES }
const ALL_ASPECT_ORBS   = { ...ASPECT_ORBS,   ...MINOR_ASPECT_ORBS }

const MOON_PHASES = [
    { key: 'nouvelle',         label: 'Nouvelle Lune',             emoji: '🌑', min: 0,   max: 45  },
    { key: 'croissant',        label: 'Premier Croissant',         emoji: '🌒', min: 45,  max: 90  },
    { key: 'premier-quartier', label: 'Premier Quartier',          emoji: '🌓', min: 90,  max: 135 },
    { key: 'gibbeuse-crois',   label: 'Lune Gibbeuse Croissante',  emoji: '🌔', min: 135, max: 180 },
    { key: 'pleine',           label: 'Pleine Lune',               emoji: '🌕', min: 180, max: 225 },
    { key: 'gibbeuse-decr',    label: 'Lune Gibbeuse Décroissante',emoji: '🌖', min: 225, max: 270 },
    { key: 'dernier-quartier', label: 'Dernier Quartier',          emoji: '🌗', min: 270, max: 315 },
    { key: 'decroissant',      label: 'Dernier Croissant',         emoji: '🌘', min: 315, max: 360 },
]

function buildOrigin(year, month, day, hour, minute, lat, lon) {
    // Origin uses 0-indexed months (January = 0)
    return new Origin({ year, month: month - 1, date: day, hour, minute, second: 0, latitude: lat, longitude: lon })
}

function buildHoroscope(origin, houseSystem = 'placidus') {
    try {
        return new Horoscope({ origin, houseSystem, zodiac: 'tropical', aspectPoints: ['bodies'], aspectWithPoints: ['bodies'], aspectTypes: ['major'] })
    } catch {
        // Placidus is undefined at high latitudes — fall back to whole-sign
        if (houseSystem !== 'whole-sign') return buildHoroscope(origin, 'whole-sign')
        throw new Error('Impossible de calculer les maisons pour cette position géographique.')
    }
}

function extractPlanets(horoscope) {
    const bodies = horoscope.CelestialBodies
    const map = new Map()
    for (const key of PLANETS) {
        const body = bodies[key]
        if (!body) continue
        map.set(key, {
            key,
            signKey: body.Sign.key,
            eclipticDeg: body.ChartPosition.Ecliptic.DecimalDegrees,
            houseId: body.House?.id ?? null,
            isRetrograde: body.isRetrograde ?? false,
        })
    }
    return map
}

function angularDiff(deg1, deg2) {
    const diff = Math.abs(deg1 - deg2) % 360
    return diff > 180 ? 360 - diff : diff
}

function isApplying(tPlanet, nPlanet, aspectAngle) {
    const epsilon = 0.01
    const direction = tPlanet.isRetrograde ? -1 : 1
    const nextDeg = (tPlanet.eclipticDeg + direction * epsilon + 360) % 360
    const currentOrb = Math.abs(angularDiff(tPlanet.eclipticDeg, nPlanet.eclipticDeg) - aspectAngle)
    const nextOrb = Math.abs(angularDiff(nextDeg, nPlanet.eclipticDeg) - aspectAngle)
    return nextOrb < currentOrb
}

function computeTransitAspects(transitPlanets, natalPlanets) {
    const aspects = []
    for (const [tKey, tPlanet] of transitPlanets) {
        for (const [nKey, nPlanet] of natalPlanets) {
            const diff = angularDiff(tPlanet.eclipticDeg, nPlanet.eclipticDeg)
            for (const [aspectKey, angle] of Object.entries(ALL_ASPECT_ANGLES)) {
                const orb = Math.abs(diff - angle)
                if (orb <= ALL_ASPECT_ORBS[aspectKey]) {
                    aspects.push({
                        transitPlanetKey: tKey,
                        natalPlanetKey: nKey,
                        aspectKey,
                        orb,
                        applying: isApplying(tPlanet, nPlanet, angle),
                    })
                }
            }
        }
    }
    aspects.sort((a, b) => {
        if (Math.abs(a.orb - b.orb) > 0.01) return a.orb - b.orb
        return (PLANET_WEIGHT[a.transitPlanetKey] ?? 9) - (PLANET_WEIGHT[b.transitPlanetKey] ?? 9)
    })
    return aspects.slice(0, 8)
}

function computeNatalAspects(natalPlanets) {
    const keys = [...natalPlanets.keys()]
    const aspects = []
    for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
            const p1 = natalPlanets.get(keys[i])
            const p2 = natalPlanets.get(keys[j])
            const diff = angularDiff(p1.eclipticDeg, p2.eclipticDeg)
            for (const [aspectKey, angle] of Object.entries(ALL_ASPECT_ANGLES)) {
                const orb = Math.abs(diff - angle)
                if (orb <= ALL_ASPECT_ORBS[aspectKey]) {
                    aspects.push({ planet1Key: keys[i], planet2Key: keys[j], aspectKey, orb })
                }
            }
        }
    }
    aspects.sort((a, b) => a.orb - b.orb)
    return aspects.slice(0, 8)
}

function computeTransitTransitAspects(transitPlanets) {
    const keys = [...transitPlanets.keys()]
    const aspects = []
    for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
            const p1 = transitPlanets.get(keys[i])
            const p2 = transitPlanets.get(keys[j])
            const diff = angularDiff(p1.eclipticDeg, p2.eclipticDeg)
            for (const [aspectKey, angle] of Object.entries(ASPECT_ANGLES)) {
                const orb = Math.abs(diff - angle)
                if (orb <= ASPECT_ORBS[aspectKey]) {
                    aspects.push({
                        planet1Key: keys[i],
                        planet2Key: keys[j],
                        aspectKey,
                        orb,
                        applying: isApplying(p1, p2, angle),
                    })
                }
            }
        }
    }
    aspects.sort((a, b) => a.orb - b.orb)
    return aspects.slice(0, 5)
}

function computeVoidOfCourse(transitMoon, transitPlanets) {
    const moonDeg = transitMoon.eclipticDeg
    const signBoundary = Math.floor(moonDeg / 30) * 30 + 30
    for (const [key, planet] of transitPlanets) {
        if (key === 'moon') continue
        const pDeg = planet.eclipticDeg
        for (const angle of Object.values(ASPECT_ANGLES)) {
            const exact1 = (pDeg + angle) % 360
            const exact2 = ((pDeg - angle) % 360 + 360) % 360
            if ((exact1 >= moonDeg && exact1 < signBoundary) || (exact2 >= moonDeg && exact2 < signBoundary)) {
                return false
            }
        }
    }
    return true
}

function computeMoonPhase(sunDeg, moonDeg) {
    const diff = ((moonDeg - sunDeg) % 360 + 360) % 360
    const phase = MOON_PHASES.find(p => diff >= p.min && diff < p.max) ?? MOON_PHASES[0]
    const illumination = (1 - Math.cos((diff * Math.PI) / 180)) / 2
    return { ...phase, illumination: Math.round(illumination * 100) / 100 }
}

export function computeChart({ birthYear, birthMonth, birthDay, birthHour, birthMinute, birthLat, birthLon, birthTimeUnknown }) {
    const hour   = birthHour   ?? 12
    const minute = birthMinute ?? 0

    const natalOrigin = buildOrigin(birthYear, birthMonth, birthDay, hour, minute, birthLat, birthLon)
    const natalChart  = buildHoroscope(natalOrigin)

    const now = new Date()
    const transitOrigin = buildOrigin(
        now.getFullYear(), now.getMonth() + 1, now.getDate(),
        now.getHours(), now.getMinutes(), birthLat, birthLon
    )
    const transitChart = buildHoroscope(transitOrigin)

    const natalPlanets   = extractPlanets(natalChart)
    const transitPlanets = extractPlanets(transitChart)

    const ascendant = {
        signKey:    natalChart.Ascendant.Sign.key,
        eclipticDeg: natalChart.Ascendant.ChartPosition.Ecliptic.DecimalDegrees,
    }
    const midheaven = {
        signKey:    natalChart.Midheaven.Sign.key,
        eclipticDeg: natalChart.Midheaven.ChartPosition.Ecliptic.DecimalDegrees,
    }

    const aspects        = computeTransitAspects(transitPlanets, natalPlanets)
    const natalAspects   = computeNatalAspects(natalPlanets)
    const transitAspects = computeTransitTransitAspects(transitPlanets)
    const transitSun     = transitPlanets.get('sun')
    const transitMoon    = transitPlanets.get('moon')
    const moonPhase      = computeMoonPhase(transitSun.eclipticDeg, transitMoon.eclipticDeg)
    const moonVoC        = computeVoidOfCourse(transitMoon, transitPlanets)

    return {
        natal: { planets: natalPlanets, ascendant, midheaven, birthTimeUnknown: !!birthTimeUnknown },
        transits: { planets: transitPlanets, date: now },
        aspects,
        natalAspects,
        transitAspects,
        moonPhase,
        moonSignKey: transitMoon.signKey,
        moonVoC,
    }
}

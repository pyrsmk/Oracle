import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL = 'gemini-2.5-flash'

// In-memory cache: cacheKey → oracle text. Keyed by person + date, valid for the current day.
const cache = new Map()

function todayKey() {
    return new Date().toISOString().slice(0, 10)
}

function buildPrompt(interpretation, birthData) {
    const { natal, transits, lune } = interpretation
    const { prenom, dateNaissance, heureNaissance, lieuNaissance } = birthData

    const heure = heureNaissance ?? 'inconnue'

    const planeteLines = natal.planetes.map(p => {
        const retro = p.retrograde ? ' (rétrograde)' : ''
        return `  - ${p.nom} : ${p.signe} ${p.degres}, maison ${p.maison}${retro}`
    }).join('\n')

    const transitLines = transits.map(t => {
        const retro = t.retrograde ? ' (rétrograde)' : ''
        return `  - ${t.planeteTrans} en ${t.signeTrans}${retro} ${t.aspectNom} ${t.planeteNatale} natal (orbe ${t.orbe}°, ${t.tonalite})`
    }).join('\n')

    return `Tu es un astrologue expert. Voici le thème astral complet de ${prenom}. \
Rédige une interprétation claire et accessible en français, en 4 à 6 phrases, en prenant \
en compte l'âge de la personne. \
Ton objectif : que quelqu'un qui ne connaît rien à l'astrologie comprenne concrètement \
ce que cette journée représente pour lui/elle — quelles énergies sont à l'œuvre, \
quels défis ou opportunités se présentent, et comment les aborder. \
Pas de jargon technique non expliqué. Pas de style littéraire. \
Sois direct, précis et utile. \
Réponds uniquement avec le texte, sans titre, sans guillemets.

IDENTITÉ
Prénom : ${prenom}
Date de naissance : ${dateNaissance}
Heure de naissance : ${heure}
Lieu de naissance : ${lieuNaissance}

THÈME NATAL
Ascendant : ${natal.ascendant.signe} ${natal.ascendant.degres}
Planètes :
${planeteLines}

TRANSITS ACTIFS AUJOURD'HUI (${todayKey()})
${transitLines}

LUNE DU JOUR
Phase : ${lune.phase} en ${lune.signe} — ${Math.round(lune.illumination * 100)}% d'illumination`
}

export function isRateLimit(err) {
    return err.status === 429 || err.message?.includes('429')
}

// Extracts retry delay from Gemini's RetryInfo error detail (e.g. "30s")
export function getRetryDelay(err) {
    const retryInfo = err.errorDetails?.find(d => d['@type']?.includes('RetryInfo'))
    return retryInfo?.retryDelay ?? null
}

async function callGemini(model, prompt) {
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
}

export async function enrichWithGemini(interpretation, birthData, cacheKey) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY non définie')

    const key = `${cacheKey}:${todayKey()}`
    if (cache.has(key)) return cache.get(key)

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: MODEL })

    const text = await callGemini(model, buildPrompt(interpretation, birthData))
    cache.set(key, text)
    return text
}

import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL = 'gemini-2.5-flash'

// In-memory cache: cacheKey → oracle text. Keyed by person + date, valid for the current day.
const cache = new Map()

function todayKey() {
    return new Date().toISOString().slice(0, 10)
}

function buildPrompt(interpretation, birthData) {
    const { natal, transits, aspectsNataux, aspectsTransits, lune } = interpretation
    const { prenom, dateNaissance, heureNaissance, lieuNaissance } = birthData

    const heure = heureNaissance ?? 'inconnue'

    const planeteLines = natal.planetes.map(p => {
        const retro = p.retrograde ? ' (rétrograde)' : ''
        return `  - ${p.nom} : ${p.signe} ${p.degres}, maison ${p.maison}${retro}`
    }).join('\n')

    const natalAspectLines = aspectsNataux.map(a =>
        `  - ${a.planete1} ${a.aspectNom} ${a.planete2} (orbe ${a.orbe}°, ${a.tonalite})`
    ).join('\n')

    const transitLines = transits.map(t => {
        const retro = t.retrograde ? ' (rétrograde)' : ''
        const dynamique = t.appliquant ? "[s'applique]" : '[se sépare]'
        return `  - ${t.planeteTrans} en ${t.signeTrans}${retro} ${t.aspectNom} ${t.planeteNatale} natal (orbe ${t.orbe}°, ${t.tonalite}) ${dynamique}`
    }).join('\n')

    const transitTransitLines = aspectsTransits.map(a => {
        const dynamique = a.appliquant ? "[s'applique]" : '[se sépare]'
        return `  - ${a.planete1} en ${a.signe1} ${a.aspectNom} ${a.planete2} en ${a.signe2} (orbe ${a.orbe}°, ${a.tonalite}) ${dynamique}`
    }).join('\n')

    const luneStatut = lune.videOfCourse
        ? '\nStatut : Lune Vide de Cours (aucun aspect exact avant le changement de signe)'
        : ''

    return `Tu es un astrologue expert. Voici le thème astral complet de ${prenom}. \
Rédige une interprétation claire et accessible en français, en 4 à 6 phrases, en prenant \
en compte l'âge de la personne. Tu vouvoieras la personne ${prenom}. \
Ton objectif : décrire avec justesse les nuances de cette journée pour une personne qui vit \
une vie ordinaire. Si les aspects sont légers ou séparants, l'interprétation doit l'être aussi \
— quelques tendances subtiles, une légère coloration émotionnelle, un contexte favorable ou \
légèrement frictionnant. Réserve les formulations fortes (défis majeurs, opportunités \
décisives, tournants de vie) aux configurations vraiment intenses. Pas de dramatisation par \
défaut. Les aspects qui s'appliquent sont plus actifs que ceux qui se séparent ; un orbe \
serré (< 1°) est plus fort qu'un orbe large — calibre ton interprétation en conséquence. \
Pas de jargon technique non expliqué. Pas de style littéraire. \
Sois précis, calibré et utile. \
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

ASPECTS NATAUX (configuration de base)
${natalAspectLines || '  - Aucun aspect significatif'}

TRANSITS ACTIFS AUJOURD'HUI (${todayKey()})
${transitLines || '  - Aucun transit significatif'}

ÉNERGIE GÉNÉRALE DU JOUR (aspects entre planètes actuelles)
${transitTransitLines || '  - Aucun aspect significatif'}

LUNE DU JOUR
Phase : ${lune.phase} en ${lune.signe} — ${Math.round(lune.illumination * 100)}% d'illumination${luneStatut}`
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

export async function enrich(interpretation, birthData, cacheKey) {
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

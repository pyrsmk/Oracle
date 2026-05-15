import 'dotenv/config'
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { geocodeCity, GeocodingError } from './src/geocode.js'
import { computeChart } from './src/astro.js'
import { buildInterpretation } from './src/interpretations.js'
import { enrichWithGemini, isRateLimit, getRetryDelay } from './src/gemini.js'

const port = 9999
const app = express()
app.use(express.json())

const __dirname = dirname(fileURLToPath(import.meta.url))

app.get('/', (req, res) => res.sendFile(`${__dirname}/index.html`))

app.post('/api/horoscope', async (req, res) => {
    const { prenom, dateNaissance, heureNaissance, lieuNaissance } = req.body

    if (!prenom || !dateNaissance || !lieuNaissance) {
        return res.status(400).json({ erreur: 'Paramètres manquants : prenom, dateNaissance et lieuNaissance sont requis.' })
    }

    try {
        const { lat, lon, displayName } = await geocodeCity(lieuNaissance)

        const [birthYear, birthMonth, birthDay] = dateNaissance.split('-').map(Number)
        if (birthYear < 1) return res.status(400).json({ erreur: 'Les dates avant J.-C. ne sont pas supportées.' })

        const birthTimeUnknown = !heureNaissance
        const [birthHour, birthMinute] = heureNaissance ? heureNaissance.split(':').map(Number) : [null, null]

        const astroResult = computeChart({ birthYear, birthMonth, birthDay, birthHour, birthMinute, birthLat: lat, birthLon: lon, birthTimeUnknown })
        const response = buildInterpretation(astroResult, prenom)

        if (!req.body.skipOracle) {
            try {
                const birthData = { prenom, dateNaissance, heureNaissance, lieuNaissance }
                const cacheKey = `${prenom}:${dateNaissance}:${lieuNaissance}`
                response.oracle = await enrichWithGemini(response, birthData, cacheKey)
            } catch (err) {
                console.error('Gemini oracle failed:', err.message, JSON.stringify({ status: err.status, errorDetails: err.errorDetails }, null, 2))
                response.oracleError = isRateLimit(err) ? 'rate_limit' : 'error'
                if (isRateLimit(err)) response.oracleRetryDelay = getRetryDelay(err)
            }
        }

        response.meta = {
            lieuNaissance: displayName,
            coordonnees: { lat, lon },
            heureUtilisee: heureNaissance ?? '12:00',
            heureInconnue: birthTimeUnknown,
            dateTransits: astroResult.transits.date.toISOString().slice(0, 10),
        }

        res.json(response)
    } catch (err) {
        if (err instanceof GeocodingError) return res.status(400).json({ erreur: err.message })
        console.error(err)
        res.status(500).json({ erreur: 'Erreur interne du serveur.' })
    }
})

app.post('/api/oracle', async (req, res) => {
    const { prenom, dateNaissance, heureNaissance, lieuNaissance } = req.body

    if (!prenom || !dateNaissance || !lieuNaissance) {
        return res.status(400).json({ oracleError: 'error' })
    }

    try {
        const { lat, lon } = await geocodeCity(lieuNaissance)

        const [birthYear, birthMonth, birthDay] = dateNaissance.split('-').map(Number)
        const birthTimeUnknown = !heureNaissance
        const [birthHour, birthMinute] = heureNaissance ? heureNaissance.split(':').map(Number) : [null, null]

        const astroResult = computeChart({ birthYear, birthMonth, birthDay, birthHour, birthMinute, birthLat: lat, birthLon: lon, birthTimeUnknown })
        const interpretation = buildInterpretation(astroResult, prenom)

        const birthData = { prenom, dateNaissance, heureNaissance, lieuNaissance }
        const cacheKey = `${prenom}:${dateNaissance}:${lieuNaissance}`
        const oracle = await enrichWithGemini(interpretation, birthData, cacheKey)
        res.json({ oracle })
    } catch (err) {
        console.error('Gemini oracle retry failed:', err)
        const oracleError = isRateLimit(err) ? 'rate_limit' : 'error'
        const oracleRetryDelay = isRateLimit(err) ? getRetryDelay(err) : null
        res.json({ oracleError, ...(oracleRetryDelay && { oracleRetryDelay }) })
    }
})

app.listen(port, () => console.log(`Running on http://localhost:${port}`))

import 'dotenv/config'
import express from 'express'
import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { geocodeCity, GeocodingError } from './src/geocode.js'
import { computeChart } from './src/astro.js'
import { buildInterpretation } from './src/interpretations.js'
import { enrich, isRateLimit, getRetryDelay } from './src/ai.js'

const port = 9999
const app = express()
app.use(express.json())

const __dirname = dirname(fileURLToPath(import.meta.url))

function fileHash(path) {
    return createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 8)
}

const faviconHash = fileHash(`${__dirname}/public/favicon.svg`)
const cssHash     = fileHash(`${__dirname}/public/style.css`)
const jsHash      = fileHash(`${__dirname}/public/script.js`)

const { version } = JSON.parse(readFileSync(`${__dirname}/package.json`, 'utf8'))

const indexHtml = readFileSync(`${__dirname}/index.html`, 'utf8')
    .replace('<title>L\'Oracle Céleste</title>', `<title>L'Oracle Céleste v${version}</title>`)
    .replace('href="favicon.svg"', `href="favicon.svg?v=${faviconHash}"`)
    .replace('href="style.css"', `href="style.css?v=${cssHash}"`)
    .replace('src="script.js"', `src="script.js?v=${jsHash}"`)

app.get('/', (req, res) => res.type('html').send(indexHtml))
app.get('/favicon.svg', (req, res) => res.sendFile(`${__dirname}/public/favicon.svg`))
app.get('/icons.svg', (req, res) => res.sendFile(`${__dirname}/public/icons.svg`))
app.get('/style.css',   (req, res) => res.sendFile(`${__dirname}/public/style.css`))
app.get('/script.js',   (req, res) => res.sendFile(`${__dirname}/public/script.js`))

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
                response.oracle = await enrich(response, birthData, cacheKey)
            } catch (err) {
                console.error('Oracle failed:', err.message, JSON.stringify({ status: err.status, errorDetails: err.errorDetails }, null, 2))
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
        const oracle = await enrich(interpretation, birthData, cacheKey)
        res.json({ oracle })
    } catch (err) {
        console.error('Oracle retry failed:', err)
        const oracleError = isRateLimit(err) ? 'rate_limit' : 'error'
        const oracleRetryDelay = isRateLimit(err) ? getRetryDelay(err) : null
        res.json({ oracleError, ...(oracleRetryDelay && { oracleRetryDelay }) })
    }
})

app.listen(port, () => console.log(`Running on http://localhost:${port}`))

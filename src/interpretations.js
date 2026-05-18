const PLANETS_FR = {
    sun:     { nom: 'Soleil',   emoji: '☀️',  domaine: "l'identité et la vitalité",       archetype: 'le moi profond' },
    moon:    { nom: 'Lune',     emoji: '🌙',  domaine: "les émotions et l'intuition",     archetype: "l'âme sensible" },
    mercury: { nom: 'Mercure',  emoji: '☿',   domaine: "la communication et l'intellect", archetype: "l'esprit vif" },
    venus:   { nom: 'Vénus',    emoji: '♀',   domaine: "l'amour et les valeurs",          archetype: 'le cœur aimant' },
    mars:    { nom: 'Mars',     emoji: '♂',   domaine: "l'action et le désir",            archetype: 'la volonté agissante' },
    jupiter: { nom: 'Jupiter',  emoji: '♃',   domaine: "la chance et l'expansion",        archetype: 'le bienfaiteur céleste' },
    saturn:  { nom: 'Saturne',  emoji: '♄',   domaine: 'la discipline et le karma',       archetype: 'le maître du temps' },
    uranus:  { nom: 'Uranus',   emoji: '⛢',   domaine: "la révolution et l'éveil",        archetype: 'le libérateur électrique' },
    neptune: { nom: 'Neptune',  emoji: '♆',   domaine: 'la spiritualité et le mystère',   archetype: 'le dissolvant mystique' },
    pluto:   { nom: 'Pluton',   emoji: '♇',   domaine: 'la transformation et le pouvoir', archetype: 'le phénix renaissant' },
}

const ASPECTS_FR = {
    conjunction: {
        nom: 'Conjonction',
        tonalite: 'fusion',
        phrase: (tNom, nDomaine) => `${tNom} s'unit à ${nDomaine}`,
    },
    opposition: {
        nom: 'Opposition',
        tonalite: 'tension',
        phrase: (tNom, nDomaine) => `${tNom} met en tension ${nDomaine}`,
    },
    trine: {
        nom: 'Trigone',
        tonalite: 'harmonie',
        phrase: (tNom, nDomaine) => `${tNom} harmonise ${nDomaine}`,
    },
    square: {
        nom: 'Carré',
        tonalite: 'friction',
        phrase: (tNom, nDomaine) => `${tNom} défie ${nDomaine}`,
    },
    sextile: {
        nom: 'Sextile',
        tonalite: 'opportunite',
        phrase: (tNom, nDomaine) => `${tNom} ouvre ${nDomaine}`,
    },
    quincunx: {
        nom: 'Quinconce',
        tonalite: 'tension',
        phrase: (tNom, nDomaine) => `${tNom} demande un ajustement autour de ${nDomaine}`,
    },
    semisquare: {
        nom: 'Demi-carré',
        tonalite: 'friction',
        phrase: (tNom, nDomaine) => `${tNom} crée une légère friction avec ${nDomaine}`,
    },
}

const SIGNS_FR = {
    aries:       { nom: 'Bélier',     emoji: '♈', element: 'Feu',   energie: 'ardente et pionnière' },
    taurus:      { nom: 'Taureau',    emoji: '♉', element: 'Terre', energie: 'stable et sensuelle' },
    gemini:      { nom: 'Gémeaux',    emoji: '♊', element: 'Air',   energie: 'curieuse et duale' },
    cancer:      { nom: 'Cancer',     emoji: '♋', element: 'Eau',   energie: 'intuitive et protectrice' },
    leo:         { nom: 'Lion',       emoji: '♌', element: 'Feu',   energie: 'royale et créatrice' },
    virgo:       { nom: 'Vierge',     emoji: '♍', element: 'Terre', energie: 'analytique et dévouée' },
    libra:       { nom: 'Balance',    emoji: '♎', element: 'Air',   energie: 'harmonieuse et juste' },
    scorpio:     { nom: 'Scorpion',   emoji: '♏', element: 'Eau',   energie: 'intense et transformatrice' },
    sagittarius: { nom: 'Sagittaire', emoji: '♐', element: 'Feu',   energie: 'philosophique et aventurière' },
    capricorn:   { nom: 'Capricorne', emoji: '♑', element: 'Terre', energie: 'ambitieuse et patiente' },
    aquarius:    { nom: 'Verseau',    emoji: '♒', element: 'Air',   energie: 'visionnaire et rebelle' },
    pisces:      { nom: 'Poissons',   emoji: '♓', element: 'Eau',   energie: 'mystique et empathique' },
}

const MOON_PHASE_INTERPRETATIONS = {
    'nouvelle':         "La Nouvelle Lune invite au renouveau intérieur. C'est le temps des semences.",
    'croissant':        "Le Premier Croissant porte l'élan des commencements. Agissez avec intention.",
    'premier-quartier': "Le Premier Quartier appelle à l'action et à la décision.",
    'gibbeuse-crois':   "L'énergie s'intensifie. Ce que vous avez semé cherche à mûrir.",
    'pleine':           "La Pleine Lune illumine ce qui était caché. Les révélations sont proches.",
    'gibbeuse-decr':    "Vient le temps de la gratitude et du partage de ce qui a été accompli.",
    'dernier-quartier': "Le Dernier Quartier demande de lâcher prise sur ce qui n'est plus utile.",
    'decroissant':      "Le cycle touche à sa fin. L'introspection prépare la renaissance.",
}

const TONALITE_SYNTHESIS = {
    harmonie: (planetes) =>
        `Les astres tissent aujourd'hui des liens harmonieux autour de ${planetes}. ` +
        `Laissez-vous porter par cette énergie favorable.`,
    tension: (planetes) =>
        `${planetes} se trouvent aujourd'hui sous tension créatrice. ` +
        `La friction peut devenir force si vous l'accueillez consciemment.`,
    friction: (planetes) =>
        `${planetes} appellent aujourd'hui à surmonter un obstacle. ` +
        `C'est dans la résistance que se forge la volonté.`,
    fusion: (planetes) =>
        `${planetes} convergent aujourd'hui dans une même direction. ` +
        `Cette concentration d'énergie peut être puissante si elle est bien orientée.`,
    opportunite: (planetes) =>
        `${planetes} ouvrent aujourd'hui de nouvelles portes. ` +
        `Restez attentif aux opportunités qui se présentent.`,
}

function formatDeg(deg) {
    const sign = Math.floor(deg / 30)
    const inSign = deg % 30
    return `${Math.floor(inSign)}°${Math.round((inSign % 1) * 60).toString().padStart(2, '0')}'`
}

export function buildInterpretation(astroResult, prenom) {
    const { natal, transits, aspects, natalAspects, transitAspects, moonPhase, moonSignKey, moonVoC } = astroResult

    const natalSection = {
        planetes: [],
        ascendant: null,
        heureInconnue: natal.birthTimeUnknown,
    }

    for (const [key, planet] of natal.planets) {
        const fr = PLANETS_FR[key]
        const sign = SIGNS_FR[planet.signKey]
        if (!fr || !sign) continue
        natalSection.planetes.push({
            cle: key,
            nom: fr.nom,
            emoji: fr.emoji,
            signe: sign.nom,
            signeKey: planet.signKey,
            signeEmoji: sign.emoji,
            degres: formatDeg(planet.eclipticDeg),
            maison: planet.houseId,
            retrograde: planet.isRetrograde,
        })
    }

    const ascSign = SIGNS_FR[natal.ascendant.signKey]
    natalSection.ascendant = {
        signe: ascSign?.nom ?? natal.ascendant.signKey,
        signeKey: natal.ascendant.signKey,
        emoji: ascSign?.emoji ?? '',
        degres: formatDeg(natal.ascendant.eclipticDeg),
    }

    const soleil = natal.planets.get('sun')
    const lune   = natal.planets.get('moon')
    natalSection.soleil = {
        signe: SIGNS_FR[soleil?.signKey]?.nom ?? '',
        signeKey: soleil?.signKey ?? '',
        emoji: SIGNS_FR[soleil?.signKey]?.emoji ?? '',
        degres: soleil ? formatDeg(soleil.eclipticDeg) : '',
        maison: soleil?.houseId ?? null,
    }
    natalSection.lune = {
        signe: SIGNS_FR[lune?.signKey]?.nom ?? '',
        signeKey: lune?.signKey ?? '',
        emoji: SIGNS_FR[lune?.signKey]?.emoji ?? '',
        degres: lune ? formatDeg(lune.eclipticDeg) : '',
        maison: lune?.houseId ?? null,
    }

    const transitSection = aspects.map(({ transitPlanetKey, natalPlanetKey, aspectKey, orb, applying }) => {
        const tPlanet  = PLANETS_FR[transitPlanetKey]
        const nPlanet  = PLANETS_FR[natalPlanetKey]
        const aspectFr = ASPECTS_FR[aspectKey]
        const tPlanetData = transits.planets.get(transitPlanetKey)
        const tSign    = SIGNS_FR[tPlanetData?.signKey]
        if (!tPlanet || !nPlanet || !aspectFr || !tSign) return null

        const phrase = aspectFr.phrase(tPlanet.nom, nPlanet.domaine)
        const retro  = tPlanetData?.isRetrograde ? ' (rétrograde)' : ''
        const interpretation = `${phrase}, depuis l'énergie ${tSign.energie} du ${tSign.nom}.${retro}`

        return {
            planeteTrans:     tPlanet.nom,
            planeteTransCle:  transitPlanetKey,
            emojiTrans:       tPlanet.emoji,
            signeTrans:       tSign.nom,
            signeTransKey:    tPlanetData?.signKey ?? '',
            aspect:           aspectKey,
            aspectNom:        aspectFr.nom,
            tonalite:         aspectFr.tonalite,
            planeteNatale:    nPlanet.nom,
            planeteNataleCle: natalPlanetKey,
            emojiNatale:      nPlanet.emoji,
            orbe:             Math.round(orb * 100) / 100,
            retrograde:       tPlanetData?.isRetrograde ?? false,
            appliquant:       applying,
            interpretation,
        }
    }).filter(Boolean)

    const aspectsNatauxSection = natalAspects.map(({ planet1Key, planet2Key, aspectKey, orb }) => {
        const p1 = PLANETS_FR[planet1Key]
        const p2 = PLANETS_FR[planet2Key]
        const aspectFr = ASPECTS_FR[aspectKey]
        if (!p1 || !p2 || !aspectFr) return null
        return {
            planete1: p1.nom,
            planete1Cle: planet1Key,
            planete2: p2.nom,
            planete2Cle: planet2Key,
            aspect: aspectKey,
            aspectNom: aspectFr.nom,
            tonalite: aspectFr.tonalite,
            orbe: Math.round(orb * 100) / 100,
        }
    }).filter(Boolean)

    const aspectsTransitsSection = transitAspects.map(({ planet1Key, planet2Key, aspectKey, orb, applying }) => {
        const p1 = PLANETS_FR[planet1Key]
        const p2 = PLANETS_FR[planet2Key]
        const aspectFr = ASPECTS_FR[aspectKey]
        const p1Data = transits.planets.get(planet1Key)
        const p2Data = transits.planets.get(planet2Key)
        const s1 = SIGNS_FR[p1Data?.signKey]
        const s2 = SIGNS_FR[p2Data?.signKey]
        if (!p1 || !p2 || !aspectFr || !s1 || !s2) return null
        return {
            planete1: p1.nom,
            planete1Cle: planet1Key,
            signe1: s1.nom,
            planete2: p2.nom,
            planete2Cle: planet2Key,
            signe2: s2.nom,
            aspect: aspectKey,
            aspectNom: aspectFr.nom,
            tonalite: aspectFr.tonalite,
            orbe: Math.round(orb * 100) / 100,
            appliquant: applying,
        }
    }).filter(Boolean)

    const moonSign = SIGNS_FR[moonSignKey]
    const luneSection = {
        phase:          moonPhase.label,
        phaseKey:       moonPhase.key,
        emoji:          moonPhase.emoji,
        illumination:   moonPhase.illumination,
        signe:          moonSign?.nom ?? moonSignKey,
        signeKey:       moonSignKey,
        interpretation: MOON_PHASE_INTERPRETATIONS[moonPhase.key] ?? '',
        videOfCourse:   moonVoC,
    }

    const top3 = transitSection.slice(0, 3)
    const tonalites = top3.map(t => t.tonalite)
    const dominant = tonalites.sort((a, b) =>
        tonalites.filter(t => t === b).length - tonalites.filter(t => t === a).length
    )[0] ?? 'harmonie'
    let planetesList = [...new Set(top3.map(t => t.planeteTrans))]
    planetesList = `${planetesList.slice(0, planetesList.length - 1).join(', ')} et ${planetesList.slice(-1)}`
    const synthese = (TONALITE_SYNTHESIS[dominant] ?? TONALITE_SYNTHESIS.harmonie)(planetesList || 'les astres')

    return {
        natal: natalSection,
        transits: transitSection,
        aspectsNataux: aspectsNatauxSection,
        aspectsTransits: aspectsTransitsSection,
        lune: luneSection,
        synthese,
    }
}

export { SIGNS_FR, PLANETS_FR }

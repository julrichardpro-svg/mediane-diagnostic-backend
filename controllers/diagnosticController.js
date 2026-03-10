/*
MEDIANE AI DIAGNOSTIC
version: 1.1 (Payload adaptation)
model: gemini-2.5-flash
date: 2026-03-09
*/

const notion = require('../notion');

const truncate = (text, maxLength = 2000) => {
    if (!text) return "";
    if (typeof text !== 'string') text = String(text);
    return text.length > maxLength ? text.substring(0, maxLength - 3) + "..." : text;
};

exports.createDiagnostic = async (req, res) => {
    try {
        console.log("📥 [DIAGNOSTIC] Reçu:", JSON.stringify(req.body, null, 2));

        // 1. Mapping des données Frontend -> Backend
        const { 
            session_id, 
            profile_title, 
            scores, 
            analysis, 
            history 
        } = req.body;

        // Validation
        if (!scores || typeof scores.vision !== 'number') {
            return res.status(400).json({ status: 'error', message: 'Scores invalides ou manquants.' });
        }
        if (!session_id) {
            return res.status(400).json({ status: 'error', message: 'session_id manquant.' });
        }

        const databaseId = process.env.NOTION_DATABASE_ID;
        const tension = analysis?.tension || "";
        const recommandation = analysis?.recommendation || "";

        // 2. Historique (Blocks)
        const childrenBlocks = [];
        childrenBlocks.push({
            object: 'block',
            type: 'heading_2',
            heading_2: { rich_text: [{ text: { content: 'Historique de conversation' } }] }
        });

        // Le frontend envoie 'history', on itère dessus
        if (Array.isArray(history)) {
            history.forEach(msg => {
                const role = msg.role === 'user' ? '👤 Utilisateur' : '🤖 Agent';
                const rawContent = (msg.parts && msg.parts[0] && msg.parts[0].text) ? msg.parts[0].text : "";
                const cleanContent = truncate(rawContent.replace(/\*/g, ''), 1900); 

                if (cleanContent) {
                    childrenBlocks.push({
                        object: 'block',
                        type: 'paragraph',
                        paragraph: {
                            rich_text: [
                                { 
                                    type: 'text', 
                                    text: { content: `${role}: ` },
                                    annotations: { bold: true } // <-- CORRECTION : Sorti de l'objet "text"
                                },
                                { 
                                    type: 'text', 
                                    text: { content: cleanContent } 
                                }
                            ]
                        }
                    });
                }
            });
        }

        let conversationSummary = truncate(JSON.stringify(history || []), 1990);

        // 3. Création Page Notion
        const response = await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                "Nom": {
                    title: [{ text: { content: `Diag ${new Date().toLocaleDateString('fr-FR')} - ${truncate(profile_title || 'Inconnu', 50)}` } }]
                },
                "ID Session": { // INDISPENSABLE POUR LE LEAD
                    rich_text: [{ text: { content: session_id } }]
                },
                "Date": {
                    date: { start: new Date().toISOString() }
                },
                "Profil": {
                    select: { name: profile_title || 'Non défini' }
                },
                "Vision": { number: scores.vision },
                "Organisation": { number: scores.organisation },
                "Technologie": { number: scores.technologie },
                "Tension": {
                    rich_text: [{ text: { content: truncate(tension) } }]
                },
                "Recommandation": {
                    rich_text: [{ text: { content: truncate(recommandation) } }]
                },
                "Conversation": {
                    rich_text: [{ text: { content: conversationSummary } }]
                },
                "Statut": {
                    select: { name: "Nouveau diagnostic" }
                }
            },
            children: childrenBlocks
        });

        console.log(`✅ [DIAGNOSTIC CRÉÉ] ID Notion: ${response.id} | Session: ${session_id}`);

        res.status(201).json({
            status: 'success',
            diagnostic_id: response.id,
            session_id: session_id
        });

    } catch (error) {
        console.error('❌ [ERREUR NOTION DIAGNOSTIC]', error.body || error.message);
        res.status(500).json({ status: 'error', message: 'Erreur Notion', details: error.message });
    }
};
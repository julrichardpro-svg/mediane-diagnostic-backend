/*
MEDIANE AI DIAGNOSTIC
version: 1.0
model: gemini-2.5-flash
date: 2026-03-09
*/

const notion = require('../notion');

// Helper pour tronquer les textes (Limite Notion : 2000 chars)
const truncate = (text, maxLength = 2000) => {
    if (!text) return "";
    if (typeof text !== 'string') text = String(text);
    return text.length > maxLength ? text.substring(0, maxLength - 3) + "..." : text;
};

exports.createDiagnostic = async (req, res) => {
    try {
        const { profil, scores, tension, recommandation, conversation } = req.body;

        // 1. Validation des données
        if (!scores || typeof scores.vision !== 'number' || typeof scores.organisation !== 'number' || typeof scores.technologie !== 'number') {
            console.warn("⚠️ Validation échouée : Scores invalides", req.body);
            return res.status(400).json({ 
                status: 'error', 
                message: 'Les scores (Vision, Organisation, Technologie) sont obligatoires et doivent être des nombres.' 
            });
        }

        const databaseId = process.env.NOTION_DATABASE_ID;

        // 2. Préparation Historique (Blocks Notion)
        const childrenBlocks = [];
        
        childrenBlocks.push({
            object: 'block',
            type: 'heading_2',
            heading_2: { rich_text: [{ text: { content: 'Historique de conversation' } }] }
        });

        // Sécurisation : on s'assure que conversation est un tableau pour l'itération
        const safeConversation = Array.isArray(conversation) ? conversation : [];

        if (safeConversation.length > 0) {
            safeConversation.forEach(msg => {
                const role = msg.role === 'user' ? '👤 Utilisateur' : '🤖 Agent';
                const rawContent = (msg.parts && msg.parts[0] && msg.parts[0].text) ? msg.parts[0].text : "";
                const cleanContent = truncate(rawContent.replace(/\*/g, ''), 1900); 

                if (cleanContent) {
                    childrenBlocks.push({
                        object: 'block',
                        type: 'paragraph',
                        paragraph: {
                            rich_text: [
                                { type: 'text', text: { content: `${role}: `, annotations: { bold: true } } },
                                { type: 'text', text: { content: cleanContent } }
                            ]
                        }
                    });
                }
            });
        }

        // 3. Préparation Résumé Conversation (Propriété Texte)
        // CORRECTION APPORTÉE : Gestion sécurisée du JSON
        // Si conversation est null/undefined, on stringify un tableau vide []
        let conversationSummary = truncate(JSON.stringify(safeConversation), 1990);

        // 4. Création Page Notion
        const response = await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                "Nom": {
                    title: [{ text: { content: `Diag ${new Date().toLocaleDateString('fr-FR')} - ${truncate(profil || 'Inconnu', 50)}` } }]
                },
                "Date": {
                    date: { start: new Date().toISOString() }
                },
                "Profil": {
                    select: { name: profil || 'Non défini' }
                },
                "Vision": {
                    number: scores.vision
                },
                "Organisation": {
                    number: scores.organisation
                },
                "Technologie": {
                    number: scores.technologie
                },
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

        console.log(`✅ [DIAGNOSTIC CRÉÉ] ID: ${response.id} | Profil: ${profil}`);

        res.status(201).json({
            status: 'success',
            diagnostic_id: response.id
        });

    } catch (error) {
        console.error('❌ [ERREUR NOTION DIAGNOSTIC]', error.body || error.message);
        res.status(500).json({ 
            status: 'error', 
            message: 'Erreur lors de l\'enregistrement dans Notion.',
            details: error.message 
        });
    }
};
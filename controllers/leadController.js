/*
MEDIANE AI DIAGNOSTIC
version: 1.1 (Query by Session ID)
model: gemini-2.5-flash
date: 2026-03-09
*/

const notion = require('../notion');

const truncate = (text, maxLength = 2000) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength - 3) + "..." : text;
};

exports.updateLead = async (req, res) => {
    try {
        console.log("📥 [LEAD] Reçu:", JSON.stringify(req.body, null, 2));

        // Mapping Frontend -> Backend
        const { 
            session_id, 
            firstName, 
            lastName, 
            company, 
            email, 
            role 
        } = req.body;

        if (!session_id) {
            return res.status(400).json({ status: 'error', message: 'session_id obligatoire.' });
        }

        // 1. RECHERCHE de la page via ID Session
        console.log(`🔍 Recherche du diagnostic pour session: ${session_id}`);
        
        const query = await notion.databases.query({
            database_id: process.env.NOTION_DATABASE_ID,
            filter: {
                property: "ID Session",
                rich_text: {
                    equals: session_id
                }
            }
        });

        if (query.results.length === 0) {
            console.warn(`⚠️ Aucun diagnostic trouvé pour la session: ${session_id}`);
            return res.status(404).json({ status: 'error', message: 'Diagnostic introuvable pour cette session.' });
        }

        const pageId = query.results[0].id;
        const pageTitle = `${truncate(lastName, 50)} ${truncate(firstName, 50)}`.trim() || "Lead Sans Nom";

        // 2. MISE À JOUR de la page trouvée
        await notion.pages.update({
            page_id: pageId,
            properties: {
                "Nom": {
                    title: [{ text: { content: pageTitle } }]
                },
                "Prénom": {
                    rich_text: [{ text: { content: truncate(firstName) } }]
                },
                "Nom famille": {
                    rich_text: [{ text: { content: truncate(lastName) } }]
                },
                "Entreprise": {
                    rich_text: [{ text: { content: truncate(company) } }]
                },
                "Fonction": {
                    rich_text: [{ text: { content: truncate(role) } }]
                },
                "Email": {
                    email: email
                },
                "Statut": {
                    select: { name: "Lead qualifié" }
                }
            }
        });

        console.log(`✅ [LEAD MIS À JOUR] Page: ${pageId} | Email: ${email}`);

        res.status(200).json({
            status: 'success',
            message: 'Lead lié au diagnostic avec succès.'
        });

    } catch (error) {
        console.error('❌ [ERREUR NOTION LEAD]', error.body || error.message);
        res.status(500).json({ status: 'error', message: 'Erreur Notion', details: error.message });
    }
};
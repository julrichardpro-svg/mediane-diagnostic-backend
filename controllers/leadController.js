/*
MEDIANE AI DIAGNOSTIC - LEAD CONTROLLER
version: 2.0 (Native Fetch API)
*/

const truncate = (text, maxLength = 2000) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength - 3) + "..." : text;
};

exports.updateLead = async (req, res) => {
    try {
        console.log("📥 [LEAD] Reçu:", JSON.stringify(req.body, null, 2));

        const { session_id, firstName, lastName, company, email, role } = req.body;

        if (!session_id) {
            return res.status(400).json({ status: 'error', message: 'session_id obligatoire.' });
        }

        const NOTION_API_KEY = process.env.NOTION_API_KEY;
        const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

        // Configuration standard de l'API Notion
        const headers = {
            'Authorization': `Bearer ${NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        };

        // ---------------------------------------------------------
        // 1. RECHERCHE DE LA PAGE (via API native au lieu du SDK)
        // ---------------------------------------------------------
        console.log(`🔍 Recherche du diagnostic pour session: ${session_id}`);
        
        const searchResponse = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                filter: {
                    property: "ID Session",
                    rich_text: {
                        equals: session_id
                    }
                }
            })
        });

        const searchData = await searchResponse.json();

        if (!searchResponse.ok) {
            throw new Error(`Erreur recherche Notion: ${JSON.stringify(searchData)}`);
        }

        if (!searchData.results || searchData.results.length === 0) {
            console.warn(`⚠️ Aucun diagnostic trouvé pour la session: ${session_id}`);
            return res.status(404).json({ status: 'error', message: 'Diagnostic introuvable.' });
        }

        const pageId = searchData.results[0].id;
        const pageTitle = `${truncate(lastName, 50)} ${truncate(firstName, 50)}`.trim() || "Lead Sans Nom";

        // ---------------------------------------------------------
        // 2. MISE À JOUR DE LA PAGE (via API native)
        // ---------------------------------------------------------
        const updateResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({
                properties: {
                    "Nom": { title: [{ text: { content: pageTitle } }] },
                    "Prénom": { rich_text: [{ text: { content: truncate(firstName) } }] },
                    "Nom famille": { rich_text: [{ text: { content: truncate(lastName) } }] },
                    "Entreprise": { rich_text: [{ text: { content: truncate(company) } }] },
                    "Fonction": { rich_text: [{ text: { content: truncate(role) } }] },
                    "Email": { email: email },
                    "Statut": { select: { name: "Lead qualifié" } }
                }
            })
        });

        const updateData = await updateResponse.json();

        if (!updateResponse.ok) {
            throw new Error(`Erreur mise à jour Notion: ${JSON.stringify(updateData)}`);
        }

        console.log(`✅ [LEAD MIS À JOUR] Page: ${pageId} | Email: ${email}`);

        res.status(200).json({ status: 'success', message: 'Lead lié avec succès.' });

    } catch (error) {
        console.error('❌ [ERREUR CATCH LEAD]', error.message);
        res.status(500).json({ status: 'error', message: 'Erreur Serveur', details: error.message });
    }
};
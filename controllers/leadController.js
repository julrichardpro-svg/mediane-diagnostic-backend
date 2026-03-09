/*
MEDIANE AI DIAGNOSTIC
version: 1.0
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
        const { diagnostic_id, prenom, nom, entreprise, email, fonction } = req.body;

        if (!diagnostic_id) {
            console.warn("⚠️ Validation échouée : diagnostic_id manquant");
            return res.status(400).json({ status: 'error', message: 'diagnostic_id est obligatoire.' });
        }
        if (!email) {
            console.warn("⚠️ Validation échouée : email manquant");
            return res.status(400).json({ status: 'error', message: 'L\'email est obligatoire.' });
        }

        const pageTitle = `${truncate(nom, 50)} ${truncate(prenom, 50)}`.trim() || "Lead Sans Nom";
        
        // Mise à jour via diagnostic_id (ID natif Notion)
        await notion.pages.update({
            page_id: diagnostic_id,
            properties: {
                "Nom": {
                    title: [{ text: { content: pageTitle } }]
                },
                "Prénom": {
                    rich_text: [{ text: { content: truncate(prenom) } }]
                },
                "Nom famille": {
                    rich_text: [{ text: { content: truncate(nom) } }]
                },
                "Entreprise": {
                    rich_text: [{ text: { content: truncate(entreprise) } }]
                },
                "Fonction": {
                    rich_text: [{ text: { content: truncate(fonction) } }]
                },
                "Email": {
                    email: email
                },
                "Statut": {
                    select: { name: "Lead qualifié" }
                }
            }
        });

        console.log(`✅ [LEAD MIS À JOUR] Page: ${diagnostic_id} | ${email}`);

        res.status(200).json({
            status: 'success',
            message: 'Lead enregistré et qualifié avec succès.'
        });

    } catch (error) {
        console.error('❌ [ERREUR NOTION LEAD]', error.body || error.message);
        
        if (error.code === 'object_not_found') {
            return res.status(404).json({ status: 'error', message: 'Diagnostic introuvable.' });
        }

        res.status(500).json({ 
            status: 'error', 
            message: 'Erreur lors de la mise à jour du lead.',
            details: error.message 
        });
    }
};
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

interface LettreMissionData {
  // Informations cabinet
  nom_cabinet: string;
  adresse_cabinet: string;
  ville_cabinet: string;
  
  // Informations client/représentant
  representant_civilite: string;
  representant_nom: string;
  nom_entreprise: string;
  adresse_entreprise: string;
  code_postal: string;
  ville_entreprise: string;
  
  // Détails entreprise
  forme_juridique: string;
  objet_social: string;
  adresse_siege: string;
  date_cloture: string;
  date_debut_mission: string;
  
  // Honoraires (partie modifiable)
  honoraires_annuel: string;
  honoraires_mensuel: string;
  
  // Date
  date_jour: string;
}

/**
 * Génère une lettre de mission à partir du template avec placeholders
 */
export function generateLettreMissionFromTemplate(data: LettreMissionData): Buffer {
  // Chemin vers le template
  const templatePath = path.join(process.cwd(), 'templates', 'lettre-mission-placeholders.docx');
  
  // Vérifier que le template existe
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template introuvable : ${templatePath}`);
  }
  
  // Lire le template
  const content = fs.readFileSync(templatePath, 'binary');
  
  // Créer une instance PizZip
  const zip = new PizZip(content);
  
  // Créer une instance Docxtemplater
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });
  
  // Remplir les placeholders avec les données
  doc.render(data);
  
  // Générer le document
  const buffer = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
  
  return buffer;
}

/**
 * Formater une date en français
 */
export function formatDateFrench(date: Date): string {
  const mois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const jour = date.getDate();
  const moisNom = mois[date.getMonth()];
  const annee = date.getFullYear();
  
  return `${jour} ${moisNom} ${annee}`;
}

/**
 * Préparer les données pour la génération
 */
export function prepareLettreMissionData(client: any, cabinet?: any): LettreMissionData {
  // Extraire la ville depuis l'adresse du cabinet
  const extractVille = (adresse: string | null): string => {
    if (!adresse) return 'Paris';
    const parts = adresse.split(',');
    return parts[parts.length - 1]?.trim() || 'Paris';
  };
  
  // Valeurs par défaut pour le cabinet
  const cabinetData = cabinet || {
    nom: 'ACPM Expertise-Comptable',
    adresse: '1 Rue de la Paix, 75002 Paris',
    telephone: '01 23 45 67 89',
    email: 'contact@acpm-expertise.com',
  };
  
  const villeCabinet = extractVille(cabinetData.adresse);
  
  // Date du jour
  const dateDuJour = formatDateFrench(new Date());
  
  // Préparer les données
  const data: LettreMissionData = {
    // Cabinet
    nom_cabinet: cabinetData.nom || 'ACPM Expertise-Comptable',
    adresse_cabinet: cabinetData.adresse || '1 Rue de la Paix, 75002 Paris',
    ville_cabinet: villeCabinet,
    
    // Client/Représentant
    representant_civilite: client.representant_civilite || 'M.',
    representant_nom: `${client.representant_prenom || ''} ${client.representant_nom || ''}`.trim() || 'Le Représentant',
    nom_entreprise: client.nom_entreprise || 'Entreprise',
    adresse_entreprise: client.adresse || '',
    code_postal: client.code_postal || '',
    ville_entreprise: client.ville || '',
    
    // Entreprise
    forme_juridique: client.forme_juridique || 'SASU',
    objet_social: client.objet_social || 'activité commerciale',
    adresse_siege: client.adresse_siege || client.adresse || '',
    date_cloture: client.date_cloture ? new Date(client.date_cloture).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '31 Décembre',
    date_debut_mission: client.date_debut_activite ? new Date(client.date_debut_activite).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
    
    // Honoraires (données depuis la table clients)
    honoraires_annuel: client.mission_honoraires || '3 600 € HT',
    honoraires_mensuel: client.mission_honoraires ? `${Math.round(parseFloat(client.mission_honoraires) / 12)} € HT` : '300 € HT',
    
    // Date
    date_jour: dateDuJour,
  };
  
  return data;
}

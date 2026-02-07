#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

// Chemin vers le template
const templatePath = path.join(__dirname, '../templates/lettre-mission-base.docx');

// Lire le template
const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);

// Extraire le XML
const xml = zip.file('word/document.xml').asText();

// Fonction pour extraire UNIQUEMENT le texte des balises <w:t>
function extractTextOnly(xmlContent) {
  // Supprimer d'abord toutes les balises XML SAUF <w:t>
  let cleanXml = xmlContent;
  
  // Extraire tous les contenus <w:t>...</w:t>
  const regex = /<w:t[^>]*>(.*?)<\/w:t>/gs;
  const matches = [];
  let match;
  
  while ((match = regex.exec(xmlContent)) !== null) {
    matches.push(match[1]);
  }
  
  return matches.join('');
}

const fullText = extractTextOnly(xml);

console.log('📄 TEXTE COMPLET DU TEMPLATE (NETTOYÉ)\n');
console.log('='.repeat(80));
console.log(fullText);
console.log('='.repeat(80));
console.log(`\n📊 Longueur totale : ${fullText.length} caractères\n`);

// Sauvegarder dans un fichier
const outputPath = path.join(__dirname, '../tmp/template-text-clean.txt');
fs.writeFileSync(outputPath, fullText, 'utf-8');
console.log(`✅ Texte sauvegardé dans : ${outputPath}\n`);

// Identifier les champs à remplacer
console.log('\n🔍 CHAMPS À TRANSFORMER EN PLACEHOLDERS :\n');
console.log('─'.repeat(80));

const fieldsToReplace = [
  { current: 'ENTREPRISE', placeholder: '{{nom_cabinet}}', section: 'En-tête' },
  { current: 'M. (Nom)', placeholder: '{{representant_civilite}} {{representant_nom}}', section: 'En-tête' },
  { current: 'Adresse :', placeholder: '{{adresse_cabinet}}', section: 'En-tête' },
  { current: '75 008 PARIS', placeholder: '{{ville_cabinet}}', section: 'En-tête' },
  { current: 'Méré, Le 12 Janvier 2026', placeholder: '{{ville_cabinet}}, Le {{date_jour}}', section: 'Date' },
  { current: 'SASU', placeholder: '{{forme_juridique}}', section: 'Description entreprise' },
  { current: 'services de protection rapprochée pour la protection physique des personnes', placeholder: '{{objet_social}}', section: 'Description entreprise' },
  { current: 'ADRESSE', placeholder: '{{adresse_siege}}', section: 'Siège social' },
  { current: '31 Décembre', placeholder: '{{date_cloture}}', section: 'Exercice social' },
  { current: '1er Janvier 2026', placeholder: '{{date_debut_mission}}', section: 'Date début mission' },
  { current: '3 600 € HT', placeholder: '{{honoraires_annuel}}', section: 'Honoraires' },
  { current: '300 € HT', placeholder: '{{honoraires_mensuel}}', section: 'Honoraires' },
];

fieldsToReplace.forEach(({ current, placeholder, section }) => {
  console.log(`\n${section}:`);
  console.log(`  "${current}" → ${placeholder}`);
});

console.log('\n' + '─'.repeat(80));
console.log('\n💡 PROCHAINE ÉTAPE : Créer un script pour insérer automatiquement ces placeholders\n');

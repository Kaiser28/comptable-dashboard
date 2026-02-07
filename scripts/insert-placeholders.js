#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

// Chemin vers le template de base
const templateBasePath = path.join(__dirname, '../templates/lettre-mission-base.docx');
const outputPath = path.join(__dirname, '../templates/lettre-mission-placeholders.docx');

// Lire le template
const content = fs.readFileSync(templateBasePath, 'binary');
const zip = new PizZip(content);

// Extraire le XML du document
let documentXml = zip.file('word/document.xml').asText();

// Définir les remplacements à faire
const replacements = [
  // En-tête cabinet
  { find: /ENTREPRISE/g, replace: '{{nom_cabinet}}' },
  { find: /M\. \(Nom\)/g, replace: '{{representant_civilite}} {{representant_nom}}' },
  { find: /Adresse :\s+/g, replace: '{{adresse_cabinet}}' },
  { find: /75 008 PARIS/g, replace: '{{ville_cabinet}}' },
  
  // Date
  { find: /Méré, Le 12 Janvier 2026/g, replace: '{{ville_cabinet}}, Le {{date_jour}}' },
  
  // Description entreprise
  { find: /SASU/g, replace: '{{forme_juridique}}' },
  { find: /services de protection rapprochée pour la protection physique des personnes/g, replace: '{{objet_social}}' },
  { find: /ADRESSE/g, replace: '{{adresse_siege}}' },
  { find: /31 Décembre/g, replace: '{{date_cloture}}' },
  
  // Date début mission
  { find: /1er Janvier 2026/g, replace: '{{date_debut_mission}}' },
  
  // Honoraires (partie modifiable)
  { find: /3 600 € HT/g, replace: '{{honoraires_annuel}}' },
  { find: /300 € HT/g, replace: '{{honoraires_mensuel}}' },
];

console.log('🔄 Remplacement des valeurs par des placeholders...\n');

// Appliquer tous les remplacements
replacements.forEach(({ find, replace }) => {
  const countBefore = (documentXml.match(find) || []).length;
  documentXml = documentXml.replace(find, replace);
  const countAfter = (documentXml.match(new RegExp(replace.replace(/[{}]/g, '\\$&'), 'g')) || []).length;
  
  if (countBefore > 0) {
    console.log(`✅ ${countBefore} occurrence(s) remplacée(s) : "${find.source}" → "${replace}"`);
  }
});

// Mettre à jour le fichier dans le zip
zip.file('word/document.xml', documentXml);

// Générer le nouveau fichier
const newContent = zip.generate({ type: 'nodebuffer' });

// Sauvegarder
fs.writeFileSync(outputPath, newContent);

console.log(`\n✅ Template avec placeholders créé : ${outputPath}\n`);
console.log('📋 Placeholders disponibles :');
console.log('  - {{nom_cabinet}}');
console.log('  - {{representant_civilite}} {{representant_nom}}');
console.log('  - {{adresse_cabinet}}');
console.log('  - {{ville_cabinet}}');
console.log('  - {{date_jour}}');
console.log('  - {{forme_juridique}}');
console.log('  - {{objet_social}}');
console.log('  - {{adresse_siege}}');
console.log('  - {{date_cloture}}');
console.log('  - {{date_debut_mission}}');
console.log('  - {{honoraires_annuel}}');
console.log('  - {{honoraires_mensuel}}');
console.log();

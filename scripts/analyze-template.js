#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

// Chemin vers le template
const templatePath = path.join(__dirname, '../templates/lettre-mission-base.docx');

// Lire le template
const content = fs.readFileSync(templatePath, 'binary');

// Créer une instance PizZip
const zip = new PizZip(content);

// Créer une instance Docxtemplater
let doc;
try {
  doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });
} catch (error) {
  console.error('❌ Erreur lors de la création du document:', error);
  process.exit(1);
}

// Extraire le texte XML du document
const xmlContent = zip.file('word/document.xml').asText();

console.log('📄 Analyse du template lettre-mission-base.docx\n');
console.log('='.repeat(60));
console.log('\n📋 CONTENU XML (premiers 2000 caractères) :\n');
console.log(xmlContent.substring(0, 2000));
console.log('\n...\n');
console.log('='.repeat(60));

// Rechercher des patterns communs qui pourraient devenir des placeholders
console.log('\n🔍 PATTERNS DÉTECTÉS (à transformer en placeholders) :\n');

const patterns = [
  { regex: /\b[A-Z]{2,}\b/g, type: 'CONSTANTES MAJUSCULES' },
  { regex: /\b\d{2}\/\d{2}\/\d{4}\b/g, type: 'DATES (JJ/MM/AAAA)' },
  { regex: /\b\d{14}\b/g, type: 'SIRET' },
  { regex: /\b[A-Z\s]{3,}\b/g, type: 'NOMS EN MAJUSCULES' },
  { regex: /\d+\s*€/g, type: 'MONTANTS EN EUROS' },
];

patterns.forEach(({ regex, type }) => {
  const matches = [...new Set(xmlContent.match(regex) || [])];
  if (matches.length > 0 && matches.length < 20) {
    console.log(`\n${type}:`);
    matches.slice(0, 10).forEach(match => console.log(`  - ${match}`));
  }
});

console.log('\n' + '='.repeat(60));
console.log('\n✅ Analyse terminée !');
console.log('\n💡 PROCHAINES ÉTAPES :');
console.log('   1. Ouvrir le fichier .docx dans Word/LibreOffice');
console.log('   2. Remplacer les valeurs statiques par des placeholders {{variable}}');
console.log('   3. Sauvegarder et tester avec le script de génération');

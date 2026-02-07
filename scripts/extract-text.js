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

// Fonction pour extraire le texte des balises <w:t>
function extractText(xmlContent) {
  const regex = /<w:t[^>]*>(.*?)<\/w:t>/g;
  const texts = [];
  let match;
  
  while ((match = regex.exec(xmlContent)) !== null) {
    texts.push(match[1]);
  }
  
  return texts.join('');
}

const fullText = extractText(xml);

console.log('📄 TEXTE COMPLET DU TEMPLATE\n');
console.log('='.repeat(80));
console.log(fullText);
console.log('='.repeat(80));
console.log(`\n📊 Longueur totale : ${fullText.length} caractères\n`);

// Sauvegarder dans un fichier
const outputPath = path.join(__dirname, '../tmp/template-text-extracted.txt');
fs.writeFileSync(outputPath, fullText, 'utf-8');
console.log(`✅ Texte sauvegardé dans : ${outputPath}\n`);

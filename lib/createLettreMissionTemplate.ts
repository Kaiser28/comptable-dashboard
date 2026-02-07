import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle } from 'docx';
import fs from 'fs';
import path from 'path';

/**
 * Crée un template de lettre de mission avec des placeholders {{variable}}
 * Ce template est ensuite utilisé par docxtemplater pour la génération
 */
export async function createLettreMissionTemplate() {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1134, // ~2cm
            right: 1134,
            bottom: 1134,
            left: 1134,
          },
        },
      },
      children: [
        // En-tête : Cabinet
        new Paragraph({
          text: '{{nom_cabinet}}',
          alignment: AlignmentType.LEFT,
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: '{{adresse_cabinet}}',
          alignment: AlignmentType.LEFT,
        }),
        new Paragraph({
          text: '{{ville_cabinet}}',
          alignment: AlignmentType.LEFT,
          spacing: { after: 400 },
        }),

        // Destinataire
        new Paragraph({
          text: '{{representant_civilite}} {{representant_nom}}',
          alignment: AlignmentType.LEFT,
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: '{{nom_entreprise}}',
          alignment: AlignmentType.LEFT,
        }),
        new Paragraph({
          text: '{{adresse_entreprise}}',
          alignment: AlignmentType.LEFT,
        }),
        new Paragraph({
          text: '{{code_postal}} {{ville_entreprise}}',
          alignment: AlignmentType.LEFT,
          spacing: { after: 400 },
        }),

        // Date et lieu
        new Paragraph({
          text: '{{ville_cabinet}}, Le {{date_jour}}',
          alignment: AlignmentType.RIGHT,
          spacing: { after: 400 },
        }),

        // Titre
        new Paragraph({
          text: 'LETTRE DE MISSION',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // Corps de la lettre - Introduction
        new Paragraph({
          children: [
            new TextRun({
              text: 'Monsieur,',
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Nous vous remercions de la confiance que vous nous avez témoignée lors de notre dernier entretien en envisageant de nous confier, en qualité d\'expert-comptable, une mission déterminée sur la base de procédures convenues.',
            }),
          ],
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'La présente lettre est établie afin de se conformer aux dispositions du Code de déontologie de notre profession. Elle a pour objet de vous confirmer les termes et les objectifs de notre mission tels que nous les avons fixés lors de notre dernier entretien ainsi que la nature et les limites de celle-ci.',
            }),
          ],
          spacing: { after: 400 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        // Section 1 : Votre entreprise
        new Paragraph({
          text: '1) Votre entreprise',
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Vous exercez, sous la forme d\'une {{forme_juridique}} dont vous êtes le président, une activité de {{objet_social}}.',
            }),
          ],
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Vous exercez votre activité à partir du siège social situé {{adresse_siege}}.',
            }),
          ],
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'L\'exercice social clôture le {{date_cloture}} de chaque année. La société est soumise à l\'impôt sur les sociétés et assujettie à la TVA au régime réel normal.',
            }),
          ],
          spacing: { after: 400 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        // Section 2 : Notre mission (PARTIE COMPTABLE - NON MODIFIABLE)
        new Paragraph({
          text: '2) Notre mission',
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Vous envisagez de nous confier une mission d\'établissement des comptes annuels et des déclarations fiscales et sociales afférentes.',
            }),
          ],
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Notre mission ne comporte pas de contrôle de la matérialité des opérations ; sauf demande expresse, les existants physiques ne sont pas vérifiés matériellement.',
            }),
          ],
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Il est bien entendu que la mission pourra, sur votre demande, être complétée par d\'autres interventions en matière fiscale, sociale, juridique, financière ou de gestion.',
            }),
          ],
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Nos relations seront réglées sur le plan juridique tant par les termes de cette lettre que par les conditions générales d\'intervention ci-jointes établies par notre profession.',
            }),
          ],
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Notre mission prendra effet à compter du {{date_debut_mission}}.',
            }),
          ],
          spacing: { after: 400 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        // Section 3 : Honoraires (PARTIE SOCIALE - MODIFIABLE)
        new Paragraph({
          text: '3) Honoraires',
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '{{mission_description}}',
            }),
          ],
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        // Tableau honoraires (dynamique)
        new Paragraph({
          children: [
            new TextRun({
              text: '{{honoraires_tableau}}',
            }),
          ],
          spacing: { after: 400 },
        }),

        // Conditions de règlement
        new Paragraph({
          children: [
            new TextRun({
              text: '{{mission_periodicite}}',
            }),
          ],
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        // Durée et reconduction
        new Paragraph({
          children: [
            new TextRun({
              text: 'La présente mission est conclue pour une durée d\'un an. Elle sera reconduite tacitement chaque année pour une durée équivalente, sauf dénonciation par l\'une ou l\'autre des parties.',
            }),
          ],
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Le client dispose de la faculté de ne pas renouveler la mission, à condition d\'en informer le cabinet par lettre recommandée avec accusé de réception, au plus tard trente (30) jours avant la reconduction de la mission.',
            }),
          ],
          spacing: { after: 400 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        // Responsabilité
        new Paragraph({
          children: [
            new TextRun({
              text: 'Les procédures et les travaux que nous mettrons en œuvre ne constitueront ni un audit ni un examen limité de comptes et, en conséquence, aucune expression d\'assurance ne sera donnée dans notre rapport.',
            }),
          ],
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Nous comptons sur votre entière coopération afin de mettre à notre disposition tous les documents, livres comptables et autres informations nécessaires qui nous permettront de mener à bien notre mission.',
            }),
          ],
          spacing: { after: 400 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        // Signature
        new Paragraph({
          text: 'Nous vous prions d\'agréer, Monsieur, l\'expression de nos salutations distinguées.',
          spacing: { after: 600 },
          alignment: AlignmentType.JUSTIFIED,
        }),

        // Bloc signatures
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ text: 'Le Cabinet', bold: true }),
                    new Paragraph({ text: '{{nom_cabinet}}', spacing: { after: 800 } }),
                    new Paragraph({ text: 'Signature et cachet :' }),
                  ],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ text: 'Le Client', bold: true }),
                    new Paragraph({ text: '{{representant_civilite}} {{representant_nom}}', spacing: { after: 800 } }),
                    new Paragraph({ text: 'Signature et mention "Bon pour accord" :' }),
                  ],
                }),
              ],
            }),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
      ],
    }],
  });

  // Sauvegarder le template
  const buffer = await Packer.toBuffer(doc);
  const templatePath = path.join(process.cwd(), 'templates', 'lettre-mission-template.docx');
  
  // Créer le dossier si nécessaire
  const dir = path.dirname(templatePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(templatePath, buffer);
  
  console.log(`✅ Template créé : ${templatePath}`);
  return templatePath;
}

// Exécuter si lancé directement
if (require.main === module) {
  createLettreMissionTemplate()
    .then(() => console.log('✅ Template créé avec succès !'))
    .catch(err => console.error('❌ Erreur:', err));
}

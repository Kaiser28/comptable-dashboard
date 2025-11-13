import { Document, Packer, Paragraph, TextRun, AlignmentType, PageNumber, Footer, NumberFormat, Header, BorderStyle } from "docx";
import type { ClientData, CabinetData } from "./types/database";

/**
 * Formate une date au format français long (ex: "15 janvier 2024")
 */
function formatDate(date: string | null | undefined): string {
  if (!date) {
    return new Intl.DateTimeFormat('fr-FR', { 
      dateStyle: 'long',
      timeZone: 'Europe/Paris'
    }).format(new Date());
  }
  const d = new Date(date);
  return new Intl.DateTimeFormat('fr-FR', { 
    dateStyle: 'long',
    timeZone: 'Europe/Paris'
  }).format(d);
}

/**
 * Extrait la ville depuis une adresse (string ou objet)
 */
function extractVille(adresse: string | { ville?: string } | null | undefined): string {
  if (!adresse) return "";
  if (typeof adresse === "string") {
    // Essayer d'extraire la ville depuis une adresse formatée
    const parts = adresse.split(',').map(s => s.trim());
    return parts[parts.length - 1] || "";
  }
  // Si c'est un objet JSON
  return adresse.ville || "";
}

/**
 * Génère un courrier de reprise de dossier conforme à l'article 163 du décret du 30 mars 2012
 * 
 * @param client - Données du client
 * @param cabinet - Données du cabinet repreneur
 * @returns Buffer du document Word généré
 * @throws Error si les données requises sont manquantes
 */
export async function generateCourrierReprise(
  client: ClientData,
  cabinet: CabinetData
): Promise<Buffer> {
  // Vérifications des données requises
  if (client.type_dossier !== 'reprise') {
    throw new Error("Ce document ne peut être généré que pour un dossier de type 'reprise'");
  }

  if (!client.cabinet_cedant_nom) {
    throw new Error("Le nom du cabinet cédant est requis pour générer le courrier de reprise");
  }

  if (!client.nom_entreprise) {
    throw new Error("Le nom de l'entreprise est requis");
  }

  if (!client.siret) {
    throw new Error("Le numéro SIRET est requis");
  }

  // Variables dynamiques
  const nomCabinet = cabinet.nom;
  const adresseCabinet = cabinet.adresse || "";
  const telephoneCabinet = cabinet.telephone || "";
  const emailCabinet = cabinet.email || "";
  const nomCabinetCedant = client.cabinet_cedant_nom;
  const adresseCabinetCedant = client.cabinet_cedant_adresse;
  const villeCabinetCedant = extractVille(adresseCabinetCedant) || "Ville";
  const dateReprise = formatDate(client.date_reprise);
  const nomEntreprise = client.nom_entreprise;
  const siret = client.siret;
  const nomSignataire = (cabinet as any).nom_signataire || "Expert-comptable";

  // Création du document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            pageNumbers: {
              start: 1,
              formatType: NumberFormat.DECIMAL,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `COURRIER DE REPRISE - ${nomEntreprise}`,
                    size: 20,
                    color: "666666",
                  }),
                ],
                alignment: AlignmentType.CENTER,
                border: {
                  bottom: {
                    color: "CCCCCC",
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 6,
                  },
                },
                spacing: { after: 100 },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun("Page "),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                  }),
                  new TextRun(" sur "),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                  }),
                ],
                alignment: AlignmentType.RIGHT,
                border: {
                  top: {
                    color: "CCCCCC",
                    space: 1,
                    style: BorderStyle.SINGLE,
                    size: 6,
                  },
                },
                spacing: { before: 100 },
              }),
            ],
          }),
        },
        children: [
          // En-tête cabinet (aligné à gauche)
          new Paragraph({
            children: [
              new TextRun({
                text: nomCabinet,
                bold: true,
                size: 11 * 2, // 11pt en half-points
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),
          ...(adresseCabinet ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: adresseCabinet,
                  size: 11 * 2,
                  font: "Arial",
                }),
              ],
              spacing: { after: 120 },
            }),
          ] : []),
          ...(telephoneCabinet ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Tél : ${telephoneCabinet}`,
                  size: 11 * 2,
                  font: "Arial",
                }),
              ],
              spacing: { after: 120 },
            }),
          ] : []),
          ...(emailCabinet ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Email : ${emailCabinet}`,
                  size: 11 * 2,
                  font: "Arial",
                }),
              ],
              spacing: { after: 240 },
            }),
          ] : []),

          // Destinataire
          new Paragraph({
            children: [
              new TextRun({
                text: `A ${villeCabinetCedant},`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { before: 240, after: 240 },
          }),

          // Date
          new Paragraph({
            children: [
              new TextRun({
                text: `Le ${dateReprise}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 360 },
          }),

          // Titre "REPRISE DE DOSSIER" (centré, bold, 14pt)
          new Paragraph({
            children: [
              new TextRun({
                text: "REPRISE DE DOSSIER",
                bold: true,
                size: 14 * 2, // 14pt en half-points
                font: "Arial",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 360 },
          }),

          // Corps du courrier
          new Paragraph({
            children: [
              new TextRun({
                text: "Madame, Monsieur,",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 240 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Nous sommes sollicités par la société ${nomEntreprise}, immatriculée au RCS sous le numéro ${siret}, pour assurer une mission d'établissement des comptes annuels à compter du ${dateReprise}.`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 240 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Conformément à l'article 163 du décret du 30 mars 2012, nous vous prions de bien vouloir nous faire savoir si rien ne s'oppose à notre entrée en fonction sur ce dossier, dans un délai compatible avec le bon exercice de notre mission.",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 240 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "En l'absence de réponse sous 30 jours, nous considérerons qu'aucune opposition n'est formulée à notre prise de fonction.",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 240 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Nous vous remercions par avance de votre diligence et vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations confraternelles.",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { before: 240, after: 480 },
          }),

          // Espace pour signature
          new Paragraph({
            children: [
              new TextRun({
                text: "[Signature]",
                size: 11 * 2,
                font: "Arial",
                italics: true,
              }),
            ],
            spacing: { before: 480, after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: nomSignataire,
                size: 11 * 2,
                font: "Arial",
                italics: true,
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Expert-comptable diplômé",
                size: 11 * 2,
                font: "Arial",
                italics: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  // Génération du buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}


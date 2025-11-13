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
 * Génère une lettre de mission comptable professionnelle
 * 
 * @param client - Données du client
 * @param cabinet - Données du cabinet
 * @returns Buffer du document Word généré
 * @throws Error si les données critiques sont manquantes
 */
export async function generateLettreMission(
  client: ClientData,
  cabinet: CabinetData
): Promise<Buffer> {
  // Vérifications des données critiques
  if (!client.nom_entreprise) {
    throw new Error("Le nom de l'entreprise est requis");
  }

  if (!client.forme_juridique) {
    throw new Error("La forme juridique est requise");
  }

  if (!client.siret) {
    throw new Error("Le numéro SIRET est requis");
  }

  if (!client.objet_social) {
    throw new Error("L'objet social est requis");
  }

  // Variables dynamiques
  const nomCabinet = cabinet.nom;
  const adresseCabinet = cabinet.adresse || "";
  const telephoneCabinet = cabinet.telephone || "";
  const emailCabinet = cabinet.email || "";
  const villeCabinet = extractVille(cabinet.adresse) || "Ville";
  const dateDuJour = formatDate(undefined);
  
  const nomEntreprise = client.nom_entreprise;
  const formeJuridique = client.forme_juridique;
  const siret = client.siret;
  const objetSocial = client.objet_social;
  const nomSignataire = (cabinet as any).nom_signataire || "Expert-comptable";
  
  // Données de mission avec valeurs par défaut
  const missionObjectif = client.mission_objectif || 
    "Assurer la tenue de votre comptabilité et l'établissement de vos comptes annuels conformément à la réglementation en vigueur.";
  const missionHonoraires = client.mission_honoraires || "à convenir";
  const missionPeriodicite = client.mission_periodicite || "mensuelle";

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
                    text: `LETTRE DE MISSION - ${nomEntreprise}`,
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
                size: 11 * 2,
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
          ...(emailCabinet || telephoneCabinet ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: [emailCabinet, telephoneCabinet].filter(Boolean).join(" / "),
                  size: 11 * 2,
                  font: "Arial",
                }),
              ],
              spacing: { after: 240 },
            }),
          ] : []),

          // Date et lieu
          new Paragraph({
            children: [
              new TextRun({
                text: `${villeCabinet}, le ${dateDuJour}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { before: 240, after: 360 },
          }),

          // Salutation
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

          // Introduction
          new Paragraph({
            children: [
              new TextRun({
                text: "Nous vous remercions de la confiance que vous nous avez témoignée lors de notre dernier entretien en envisageant de nous confier, en qualité d'expert-comptable, une mission déterminée sur la base de procédures convenues.",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 240 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "La présente lettre est établie afin de se conformer aux dispositions du Code de déontologie de notre profession. Elle a pour objet de vous confirmer les termes et les objectifs de notre mission tels que nous les avons fixés lors de notre dernier entretien ainsi que la nature et les limites de celle-ci.",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 360 },
          }),

          // Section 1 : VOTRE ENTREPRISE
          new Paragraph({
            children: [
              new TextRun({
                text: "1. VOTRE ENTREPRISE",
                bold: true,
                size: 12 * 2,
                font: "Arial",
              }),
            ],
            spacing: { before: 240, after: 240 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Vous exercez, sous la forme d'une ${formeJuridique} sous le numéro SIRET ${siret}, les activités suivantes :`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: objetSocial,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 360 },
          }),

          // Section 2 : OBJECTIFS DE LA MISSION
          new Paragraph({
            children: [
              new TextRun({
                text: "2. OBJECTIFS DE LA MISSION",
                bold: true,
                size: 12 * 2,
                font: "Arial",
              }),
            ],
            spacing: { before: 240, after: 240 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: missionObjectif,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 360 },
          }),

          // Section 3 : NATURE ET ÉTENDUE DE NOTRE MISSION
          new Paragraph({
            children: [
              new TextRun({
                text: "3. NATURE ET ÉTENDUE DE NOTRE MISSION",
                bold: true,
                size: 12 * 2,
                font: "Arial",
              }),
            ],
            spacing: { before: 240, after: 240 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Notre mission comprendra :",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "- La tenue de votre comptabilité conformément au Plan Comptable Général",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "- L'établissement des déclarations fiscales et sociales obligatoires",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "- L'établissement des comptes annuels",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "- Le conseil en matière comptable, fiscale et sociale",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 240 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Périodicité des interventions : ${missionPeriodicite}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 360 },
          }),

          // Section 4 : HONORAIRES
          new Paragraph({
            children: [
              new TextRun({
                text: "4. HONORAIRES",
                bold: true,
                size: 12 * 2,
                font: "Arial",
              }),
            ],
            spacing: { before: 240, after: 240 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Nos honoraires pour cette mission s'élèvent à ${missionHonoraires}.`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Ces honoraires sont forfaitaires et payables ${missionPeriodicite === "mensuelle" ? "mensuellement" : missionPeriodicite === "trimestrielle" ? "trimestriellement" : missionPeriodicite === "annuelle" ? "annuellement" : `selon la périodicité ${missionPeriodicite}`}.`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 360 },
          }),

          // Section 5 : OBLIGATIONS RÉCIPROQUES
          new Paragraph({
            children: [
              new TextRun({
                text: "5. OBLIGATIONS RÉCIPROQUES",
                bold: true,
                size: 12 * 2,
                font: "Arial",
              }),
            ],
            spacing: { before: 240, after: 240 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Nous nous engageons à :",
                size: 11 * 2,
                font: "Arial",
                bold: true,
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "- Respecter le secret professionnel",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "- Exercer notre mission avec diligence et compétence",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "- Vous informer de toute difficulté rencontrée",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 240 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Vous vous engagez à :",
                size: 11 * 2,
                font: "Arial",
                bold: true,
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "- Nous communiquer tous les documents nécessaires",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "- Nous informer de tout événement affectant votre activité",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "- Régler nos honoraires aux échéances convenues",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 360 },
          }),

          // Formule de politesse
          new Paragraph({
            children: [
              new TextRun({
                text: "Nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { before: 240, after: 480 },
          }),

          // Espace pour signature cabinet
          new Paragraph({
            children: [
              new TextRun({
                text: "[Signature]",
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
            spacing: { after: 480 },
          }),

          // Bon pour accord
          new Paragraph({
            children: [
              new TextRun({
                text: "BON POUR ACCORD :",
                bold: true,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { before: 240, after: 240 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Fait à ${villeCabinet}, le _______________`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 240 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Signature du client :",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),
        ],
      },
    ],
  });

  // Génération du buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}


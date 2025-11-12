import { Document, Packer, Paragraph, TextRun, AlignmentType, PageNumber, Footer, NumberFormat, Header, BorderStyle } from "docx";
import type { ClientData, AssocieData } from "./types/database";

// Réutilisation des helpers depuis generateStatuts.ts
function formatMontant(montant: number): string {
  return new Intl.NumberFormat("fr-FR").format(montant);
}

function formatDate(date: string | undefined): string {
  if (!date) return new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatAdresse(adresse: any): string {
  if (!adresse) return "Adresse non renseignée";
  if (typeof adresse === "string") return adresse;
  const parts = [adresse.numero_voie, adresse.type_voie, adresse.nom_voie, adresse.code_postal, adresse.ville].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Adresse non renseignée";
}

function getFormeJuridique(nbAssocies: number) {
  return nbAssocies === 1
    ? { complete: "Société par Actions Simplifiée Unipersonnelle", sigle: "SASU" }
    : { complete: "Société par Actions Simplifiée", sigle: "SAS" };
}

function getGenre(civilite: string): 'M' | 'F' {
  return civilite.toLowerCase().includes('mme') || civilite.toLowerCase().includes('madame') ? 'F' : 'M';
}

function accorderNe(civilite: string): string {
  return getGenre(civilite) === 'F' ? 'née' : 'né';
}

function extraireVille(adresse: string): string {
  // Extraire la ville depuis l'adresse (dernier élément après le code postal)
  const parts = adresse.split(',').map(p => p.trim());
  if (parts.length > 0) {
    const dernier = parts[parts.length - 1];
    // Si c'est un code postal suivi d'une ville
    const match = dernier.match(/\d{5}\s+(.+)/);
    if (match) return match[1];
    return dernier;
  }
  return "Paris"; // Valeur par défaut
}

export async function generateDNC(client: ClientData, president: AssocieData): Promise<Buffer> {
  const formeJuridique = getFormeJuridique(1); // Pour la DNC, on utilise toujours la forme complète
  const adresseSiege = formatAdresse(client.adresse_siege);
  const villeSiege = extraireVille(adresseSiege);
  const dateActuelle = formatDate(undefined);
  const genre = getGenre(president.civilite);
  const soussigne = genre === 'F' ? 'soussignée' : 'soussigné';
  const filsFille = genre === 'F' ? 'Fille' : 'Fils';
  const frappe = genre === 'F' ? 'frappée' : 'frappé';
  const informe = genre === 'F' ? 'informée' : 'informé';

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
          titlePage: true,
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `DÉCLARATION DE NON-CONDAMNATION - ${client.nom_entreprise}`,
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
          // TITRE
          new Paragraph({
            children: [
              new TextRun({
                text: "DÉCLARATION DE NON-CONDAMNATION",
                bold: true,
                allCaps: true,
                size: 16 * 2,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "ET DE FILIATION",
                bold: true,
                allCaps: true,
                size: 16 * 2,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // IDENTITÉ DU DÉCLARANT
          new Paragraph({
            children: [
              new TextRun({
                text: "IDENTITÉ DU DÉCLARANT",
                bold: true,
                size: 13 * 2,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Je ${soussigne} :`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Nom : ${president.nom}`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Prénom(s) : ${president.prenom}`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `${accorderNe(president.civilite).charAt(0).toUpperCase() + accorderNe(president.civilite).slice(1)} le : ${formatDate(president.date_naissance)} à ${president.lieu_naissance || 'lieu non renseigné'}`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Nationalité : ${president.nationalite || "Française"}`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Demeurant : ${formatAdresse(president.adresse)}`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 300 },
          }),

          // FILIATION
          new Paragraph({
            children: [
              new TextRun({
                text: "FILIATION",
                bold: true,
                size: 13 * 2,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `${filsFille} de :`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `M. ${"_".repeat(60)} (Nom et prénom du père)`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Mme ${"_".repeat(60)} (Nom de jeune fille et prénom de la mère)`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 300 },
          }),

          // QUALITÉ
          new Paragraph({
            children: [
              new TextRun({
                text: "QUALITÉ",
                bold: true,
                size: 13 * 2,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Agissant en qualité de :",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Président de la société ${client.nom_entreprise}`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: formeJuridique.complete,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Au capital de ${formatMontant(client.capital_social)} euros`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Siège social : ${adresseSiege}`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `En cours d'immatriculation au RCS de ${villeSiege}`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 300 },
          }),

          // DÉCLARATIONS SUR L'HONNEUR
          new Paragraph({
            children: [
              new TextRun({
                text: "DÉCLARATIONS SUR L'HONNEUR",
                bold: true,
                size: 13 * 2,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          // Section 1
          new Paragraph({
            children: [
              new TextRun({
                text: "Déclare sur l'honneur :",
                bold: true,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "N'avoir fait l'objet d'aucune condamnation pénale inscrite au bulletin n°2 du casier judiciaire pour :",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Crime ou délit de droit commun",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 30 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Banqueroute, liquidation judiciaire ou procédure de sauvegarde",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 30 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Recel ou recel de choses obtenues par crime ou délit",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 30 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Corruption active ou passive, trafic d'influence",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 30 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Abus de biens sociaux ou de confiance",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 30 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Escroquerie",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 30 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Abus de confiance",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 30 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Fraude fiscale",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 30 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• Délit puni d'une peine d'emprisonnement sans sursis",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          // Section 2
          new Paragraph({
            children: [
              new TextRun({
                text: "N'avoir jamais fait l'objet :",
                bold: true,
                size: 11 * 2,
              }),
            ],
            spacing: { before: 100, after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• D'une interdiction de gérer, d'administrer ou de diriger une personne morale",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 30 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• D'une interdiction d'exercer une fonction publique ou d'exercer l'activité professionnelle à l'occasion de laquelle l'infraction a été commise",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 30 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• D'une faillite personnelle",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 30 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• D'une sanction civile ou administrative prononcée par une juridiction ou une autorité administrative",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          // Section 3
          new Paragraph({
            children: [
              new TextRun({
                text: `Ne pas être ${frappe}(e) :`,
                bold: true,
                size: 11 * 2,
              }),
            ],
            spacing: { before: 100, after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• D'une incompatibilité avec l'exercice d'une fonction publique",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 30 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• D'une incapacité légale",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 30 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "• D'une interdiction d'exercer une activité commerciale",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          // Section 4
          new Paragraph({
            children: [
              new TextRun({
                text: "Attester que les informations fournies dans le présent document sont exactes et complètes.",
                size: 11 * 2,
              }),
            ],
            spacing: { before: 100, after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "M'engage à informer le greffe du tribunal de commerce de tout changement concernant ces déclarations.",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          // Section 5 - Responsabilité pénale
          new Paragraph({
            children: [
              new TextRun({
                text: "RESPONSABILITÉ PÉNALE",
                bold: true,
                size: 13 * 2,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Reconnais avoir été ${informe}(e) que toute fausse déclaration est passible de sanctions pénales prévues par l'article 441-1 du Code pénal, à savoir trois ans d'emprisonnement et 45 000 euros d'amende.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 300 },
          }),

          // DATE ET SIGNATURE
          new Paragraph({
            children: [
              new TextRun({
                text: "DATE ET SIGNATURE",
                bold: true,
                size: 13 * 2,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Fait à ${villeSiege}, le ${dateActuelle}`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "En trois exemplaires originaux",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({ text: "" }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Signature précédée de la mention manuscrite",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "« Lu et approuvé, certifie sincère et véritable »",
                size: 11 * 2,
                italics: true,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),

          new Paragraph({
            children: [
              new TextRun({
                text: `${president.prenom} ${president.nom}`,
                bold: true,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "_________________________",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 0 },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}


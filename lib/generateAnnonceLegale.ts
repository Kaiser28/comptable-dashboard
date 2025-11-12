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

export async function generateAnnonceLegale(client: ClientData, associes: AssocieData[]): Promise<Buffer> {
  if (!associes || associes.length === 0) throw new Error("Aucun associé trouvé");

  // Dédupliquer les associés
  const associesUniques = associes.filter((associe, index, self) => 
    index === self.findIndex(a => a.nom === associe.nom && a.prenom === associe.prenom)
  );

  const formeJuridique = getFormeJuridique(associesUniques.length);
  const adresseSiege = formatAdresse(client.adresse_siege);
  const villeSiege = extraireVille(adresseSiege);
  const dateSignature = formatDate(undefined);
  
  // Trouver le président
  const president = associesUniques.find(a => a.president) || associesUniques[0];
  const adressePresident = formatAdresse(president.adresse);

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
                    text: `ANNONCE LÉGALE - ${client.nom_entreprise}`,
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
                spacing: {
                  after: 100,
                },
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
                  new TextRun({ children: [PageNumber.CURRENT] }),
                  new TextRun(" sur "),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
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
                spacing: {
                  before: 100,
                },
              }),
            ],
          }),
        },
        children: [
          // Titre principal
          new Paragraph({
            children: [
              new TextRun({
                text: "ANNONCE LÉGALE - CONSTITUTION",
                bold: true,
                size: 16 * 2, // 16pt
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: {
              before: 200,
              after: 300,
            },
          }),

          // Sous-titre : Nom de la société
          new Paragraph({
            children: [
              new TextRun({
                text: client.nom_entreprise,
                bold: true,
                size: 14 * 2, // 14pt
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 400,
            },
          }),

          // Section 1 : Forme juridique
          new Paragraph({
            children: [
              new TextRun({
                text: "Forme juridique : ",
                bold: true,
                size: 11 * 2,
              }),
              new TextRun({
                text: formeJuridique.complete,
                size: 11 * 2,
              }),
            ],
            spacing: {
              before: 200,
              after: 150,
            },
          }),

          // Section 2 : Dénomination sociale
          new Paragraph({
            children: [
              new TextRun({
                text: "Dénomination sociale : ",
                bold: true,
                size: 11 * 2,
              }),
              new TextRun({
                text: client.nom_entreprise,
                size: 11 * 2,
              }),
            ],
            spacing: {
              after: 150,
            },
          }),

          // Section 3 : Capital social
          new Paragraph({
            children: [
              new TextRun({
                text: "Capital social : ",
                bold: true,
                size: 11 * 2,
              }),
              new TextRun({
                text: `${formatMontant(client.capital_social)} euros`,
                size: 11 * 2,
              }),
            ],
            spacing: {
              after: 150,
            },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `dont ${formatMontant(client.montant_libere)} euros libérés`,
                size: 11 * 2,
              }),
            ],
            spacing: {
              after: 150,
            },
          }),

          // Section 4 : Siège social
          new Paragraph({
            children: [
              new TextRun({
                text: "Siège social : ",
                bold: true,
                size: 11 * 2,
              }),
              new TextRun({
                text: adresseSiege,
                size: 11 * 2,
              }),
            ],
            spacing: {
              after: 150,
            },
          }),

          // Section 5 : Objet social
          new Paragraph({
            children: [
              new TextRun({
                text: "Objet social : ",
                bold: true,
                size: 11 * 2,
              }),
            ],
            spacing: {
              after: 100,
            },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: client.objet_social || "Objet social non renseigné",
                size: 11 * 2,
              }),
            ],
            spacing: {
              after: 150,
            },
          }),

          // Section 6 : Durée
          new Paragraph({
            children: [
              new TextRun({
                text: "Durée : ",
                bold: true,
                size: 11 * 2,
              }),
              new TextRun({
                text: `${client.duree_societe} ans`,
                size: 11 * 2,
              }),
            ],
            spacing: {
              after: 150,
            },
          }),

          // Section 7 : Organes de direction
          new Paragraph({
            children: [
              new TextRun({
                text: "Organes de direction :",
                bold: true,
                size: 11 * 2,
              }),
            ],
            spacing: {
              after: 100,
            },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Président : ${president.civilite} ${president.prenom} ${president.nom}`,
                size: 11 * 2,
              }),
            ],
            spacing: {
              after: 100,
            },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Demeurant : ${adressePresident}`,
                size: 11 * 2,
              }),
            ],
            spacing: {
              after: 150,
            },
          }),

          // Section 8 : Immatriculation
          new Paragraph({
            children: [
              new TextRun({
                text: `La société sera immatriculée au RCS de ${villeSiege}.`,
                size: 11 * 2,
              }),
            ],
            spacing: {
              after: 300,
            },
          }),

          // Section 9 : Date et signature
          new Paragraph({
            children: [
              new TextRun({
                text: dateSignature,
                size: 11 * 2,
              }),
            ],
            spacing: {
              before: 200,
              after: 200,
            },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Pour avis,",
                size: 11 * 2,
              }),
            ],
            spacing: {
              after: 100,
            },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Le Président",
                bold: true,
                size: 11 * 2,
              }),
            ],
            spacing: {
              after: 200,
            },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `${president.civilite} ${president.prenom} ${president.nom}`,
                size: 11 * 2,
              }),
            ],
            spacing: {
              after: 200,
            },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}


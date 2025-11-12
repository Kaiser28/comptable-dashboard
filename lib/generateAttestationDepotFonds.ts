import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, PageNumber, Footer, NumberFormat, Header, BorderStyle } from "docx";
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

export async function generateAttestationDepotFonds(client: ClientData, associes: AssocieData[]): Promise<Buffer> {
  if (!associes || associes.length === 0) throw new Error("Aucun associé trouvé");

  // Dédupliquer les associés
  const associesUniques = associes.filter((associe, index, self) => 
    index === self.findIndex(a => a.nom === associe.nom && a.prenom === associe.prenom)
  );

  const formeJuridique = getFormeJuridique(associesUniques.length);
  const adresseSiege = formatAdresse(client.adresse_siege);
  const dateSignature = formatDate(undefined);
  
  // Filtrer les associés avec apport > 0
  const associesAvecApport = associesUniques.filter(a => (a.montant_apport || 0) > 0);
  
  // Trouver le président pour la fonction
  const president = associesUniques.find(a => a.president) || associesUniques[0];

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
                    text: `ATTESTATION DE DÉPÔT DES FONDS - ${client.nom_entreprise}`,
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
                text: "ATTESTATION DE DÉPÔT DES FONDS",
                bold: true,
                size: 16 * 2, // 16pt
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: {
              before: 200,
              after: 400,
            },
          }),

          // En-tête banque
          new Paragraph({
            children: [
              new TextRun({
                text: "BANQUE : ",
                bold: true,
                size: 12 * 2,
              }),
              new TextRun({
                text: client.banque_depot_capital || "__________ (à compléter)",
                size: 12 * 2,
              }),
            ],
            spacing: {
              before: 200,
              after: 100,
            },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Adresse : ",
                bold: true,
                size: 12 * 2,
              }),
              new TextRun({
                text: "__________ (à compléter)",
                size: 12 * 2,
              }),
            ],
            spacing: {
              after: 300,
            },
          }),

          // Corps de l'attestation
          new Paragraph({
            children: [
              new TextRun({
                text: "Je soussigné, ",
                size: 12 * 2,
              }),
              new TextRun({
                text: "__________ (Nom Prénom)",
                size: 12 * 2,
              }),
              new TextRun({
                text: ", agissant en qualité de ",
                size: 12 * 2,
              }),
              new TextRun({
                text: "__________ (Fonction)",
                size: 12 * 2,
              }),
              new TextRun({
                text: ` de la banque ${client.banque_depot_capital || "__________"}`,
                size: 12 * 2,
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
                text: `Atteste avoir reçu la somme de ${formatMontant(client.montant_libere)} euros`,
                size: 12 * 2,
              }),
            ],
            spacing: {
              after: 200,
            },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Correspondant au montant libéré du capital social de la société en formation :",
                size: 12 * 2,
              }),
            ],
            spacing: {
              after: 200,
            },
          }),

          // Dénomination
          new Paragraph({
            children: [
              new TextRun({
                text: "Dénomination sociale : ",
                bold: true,
                size: 12 * 2,
              }),
              new TextRun({
                text: client.nom_entreprise,
                size: 12 * 2,
              }),
            ],
            spacing: {
              before: 200,
              after: 150,
            },
          }),

          // Forme juridique
          new Paragraph({
            children: [
              new TextRun({
                text: "Forme juridique : ",
                bold: true,
                size: 12 * 2,
              }),
              new TextRun({
                text: formeJuridique.complete,
                size: 12 * 2,
              }),
            ],
            spacing: {
              after: 150,
            },
          }),

          // Capital social
          new Paragraph({
            children: [
              new TextRun({
                text: "Capital social : ",
                bold: true,
                size: 12 * 2,
              }),
              new TextRun({
                text: `${formatMontant(client.capital_social)} euros`,
                size: 12 * 2,
              }),
            ],
            spacing: {
              after: 150,
            },
          }),

          // Montant libéré
          new Paragraph({
            children: [
              new TextRun({
                text: "Montant libéré : ",
                bold: true,
                size: 12 * 2,
              }),
              new TextRun({
                text: `${formatMontant(client.montant_libere)} euros`,
                size: 12 * 2,
              }),
            ],
            spacing: {
              after: 150,
            },
          }),

          // Siège social
          new Paragraph({
            children: [
              new TextRun({
                text: "Siège social : ",
                bold: true,
                size: 12 * 2,
              }),
              new TextRun({
                text: adresseSiege,
                size: 12 * 2,
              }),
            ],
            spacing: {
              after: 300,
            },
          }),

          // Tableau des apports
          associesAvecApport.length > 0 ? new Paragraph({
            children: [
              new TextRun({
                text: "Répartition des apports :",
                bold: true,
                size: 12 * 2,
              }),
            ],
            spacing: {
              before: 200,
              after: 150,
            },
          }) : new Paragraph({ text: "" }),

          // Tableau des apports par associé
          associesAvecApport.length > 0 ? new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              // En-tête du tableau
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Nom",
                            bold: true,
                            size: 12 * 2,
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Prénom",
                            bold: true,
                            size: 12 * 2,
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Montant apporté",
                            bold: true,
                            size: 12 * 2,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              // Lignes des associés
              ...associesAvecApport.map(associe => 
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: associe.nom,
                              size: 12 * 2,
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: associe.prenom,
                              size: 12 * 2,
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `${formatMontant(associe.montant_apport || 0)} euros`,
                              size: 12 * 2,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                })
              ),
            ],
          }) : new Paragraph({ text: "" }),

          // Espace avant le pied de page
          new Paragraph({
            text: "",
            spacing: {
              before: 400,
            },
          }),

          // Pied de page
          new Paragraph({
            children: [
              new TextRun({
                text: "Fait à ",
                size: 12 * 2,
              }),
              new TextRun({
                text: "__________ (ville)",
                size: 12 * 2,
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
                text: "Le ",
                size: 12 * 2,
              }),
              new TextRun({
                text: dateSignature,
                size: 12 * 2,
              }),
            ],
            spacing: {
              after: 300,
            },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Signature et cachet de la banque",
                bold: true,
                size: 12 * 2,
              }),
            ],
            spacing: {
              after: 200,
            },
          }),

          // Espaces pour signature
          new Paragraph({
            text: "",
            spacing: {
              after: 100,
            },
          }),

          new Paragraph({
            text: "",
            spacing: {
              after: 100,
            },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "_________________________",
                size: 12 * 2,
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


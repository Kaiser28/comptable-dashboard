import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, PageNumber, Footer, NumberFormat, Header, BorderStyle, TableOfContents } from "docx";
import type { ClientData, AssocieData } from "./types/database";

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

function calculerPremierExerciceFin(dateDebutActivite: string | undefined, dateCloture: string | undefined): string {
  if (!dateCloture) dateCloture = "31/12";
  const debut = dateDebutActivite ? new Date(dateDebutActivite) : new Date();
  const [jour, mois] = dateCloture.split("/");
  let annee = debut.getFullYear();
  const cloture = new Date(annee, parseInt(mois) - 1, parseInt(jour));
  if (cloture < debut) annee++;
  return formatDate(new Date(annee, parseInt(mois) - 1, parseInt(jour)).toISOString());
}

function getGenre(civilite: string): 'M' | 'F' {
  return civilite.toLowerCase().includes('mme') || civilite.toLowerCase().includes('madame') ? 'F' : 'M';
}

function accorderNe(civilite: string): string {
  return getGenre(civilite) === 'F' ? 'née' : 'né';
}

function getPronoms(associes: AssocieData[]) {
  if (associes.length === 1) {
    const genre = getGenre(associes[0].civilite);
    return {
      soussigne: genre === 'F' ? 'La soussignée' : 'Le soussigné',
      pronom: genre === 'F' ? 'elle' : 'il',
      possessif: genre === 'F' ? 'sa' : 'son'
    };
  } else {
    return {
      soussigne: 'Les soussignés',
      pronom: 'ils',
      possessif: 'leur'
    };
  }
}

export async function generateStatuts(client: ClientData, associes: AssocieData[]): Promise<Buffer> {
  if (!associes || associes.length === 0) throw new Error("Aucun associé trouvé");

  // Dédupliquer les associés basé sur nom + prénom pour éviter les doublons
  const associesUniques = associes.filter((associe, index, self) => 
    index === self.findIndex(a => a.nom === associe.nom && a.prenom === associe.prenom)
  );

  const associe = associesUniques[0];
  const formeJuridique = getFormeJuridique(associesUniques.length);
  const pronoms = getPronoms(associesUniques);
  const adresseSiege = formatAdresse(client.adresse_siege);
  const adresseAssocie = formatAdresse(associe.adresse);
  const valeurNominale = client.capital_social / client.nb_actions;
  const dateSignature = formatDate(undefined);
  const premierExerciceFin = calculerPremierExerciceFin(client.date_debut_activite, client.date_cloture);

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
                    text: `STATUTS - ${client.nom_entreprise}`,
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
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),

          new Paragraph({
            children: [
              new TextRun({
                text: "STATUTS",
                bold: true,
                allCaps: true,
                size: 20 * 2,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: formeJuridique.complete.toUpperCase(),
                bold: true,
                size: 14 * 2,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),

          new Paragraph({
            children: [new TextRun({ text: `Dénomination sociale : ${client.nom_entreprise}`, size: 11 * 2 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Capital social : ${formatMontant(client.capital_social)} euros`,
                size: 11 * 2,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Siège social : ${adresseSiege}`, size: 11 * 2 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),

          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),

          new Paragraph({
            children: [new TextRun({ text: `Constitué le ${dateSignature}`, size: 11 * 2 })],
            alignment: AlignmentType.CENTER,
          }),

          new Paragraph({ text: "", pageBreakBefore: true, spacing: { before: 0, after: 0 } }),

          // Titre de la table des matières
          new Paragraph({
            children: [
              new TextRun({
                text: "SOMMAIRE",
                bold: true,
                allCaps: true,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          }),

          // Table des matières
          new TableOfContents("Sommaire", {
            hyperlink: true,
            headingStyleRange: "1-3",
          }),

          // Saut de page après la table
          new Paragraph({ text: "" }),

          new Paragraph({
            text: "STATUTS",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            pageBreakBefore: true,
          }),
          new Paragraph({
            text: formeJuridique.complete,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),

          // Section "Les soussignés"
          new Paragraph({
            children: [
              new TextRun({
                text: `${pronoms.soussigne} :`,
                bold: true,
                size: 14 * 2, // docx uses half-points, so 14pt = 28 half-points
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          // Blocs pour chaque associé
          ...associesUniques.flatMap((associe, index) => {
            const adresseAssocieFormatee = formatAdresse(associe.adresse);
            const nationalite = (associe as any).nationalite || "française";
            
            return [
              // Ligne 1: Nom complet
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${associe.civilite} ${associe.prenom} ${associe.nom}`,
                    bold: true,
                    size: 12 * 2,
                  }),
                ],
                spacing: { after: 50 },
              }),
              
              // Ligne 2: Date et lieu de naissance
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${accorderNe(associe.civilite)} le ${associe.date_naissance || "date non renseignée"} à ${associe.lieu_naissance || "lieu non renseigné"}`,
                    italics: true,
                    size: 11 * 2,
                  }),
                ],
              }),
              
              // Ligne 3: Adresse
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Demeurant : ${adresseAssocieFormatee}`,
                    size: 11 * 2,
                  }),
                ],
              }),
              
              // Ligne 4: Nationalité
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Nationalité ${nationalite}`,
                    size: 11 * 2,
                  }),
                ],
                spacing: { after: 150 },
              }),
            ];
          }),

          // Espace vertical
          new Paragraph({ text: "" }),

          // Texte de clôture
          new Paragraph({
            children: [
              new TextRun({
                text: associesUniques.length === 1 
                  ? `A établi ainsi qu'il suit les statuts d'une ${formeJuridique.complete.toLowerCase()} qu'il déclare constituer.`
                  : `Ont établi ainsi qu'il suit les statuts d'une ${formeJuridique.complete.toLowerCase()} qu'ils déclarent constituer entre eux.`,
                size: 12 * 2,
              }),
            ],
            spacing: { before: 100, after: 200 },
          }),

          new Paragraph({ text: "" }),

          // TITRE I
          new Paragraph({
            children: [
              new TextRun({
                text: "TITRE I : FORME - DÉNOMINATION - SIÈGE - OBJET - DURÉE",
                bold: true,
                allCaps: true,
                size: 16 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 1 - Forme",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Il est formé entre ${pronoms.soussigne.toLowerCase()} et ceux qui deviendront ultérieurement associés une ${formeJuridique.complete} (${formeJuridique.sigle}), régie par les dispositions législatives et réglementaires en vigueur ainsi que par les présents statuts.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 2 - Dénomination",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `La société a pour dénomination sociale : ${client.nom_entreprise}.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Dans tous les actes et documents émanant de la société et destinés aux tiers, la dénomination sociale doit être précédée ou suivie immédiatement des mots "${formeJuridique.complete}" ou du sigle "${formeJuridique.sigle}" ainsi que de l'indication du montant du capital social.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 3 - Siège social",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Le siège social est fixé : ${adresseSiege}.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Il peut être transféré en tout autre endroit par décision du président, sous réserve de ratification par la collectivité des associés dans les conditions prévues par la loi et les présents statuts.",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 4 - Objet",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "La société a pour objet :",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: client.objet_social || "Objet social non renseigné",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Et plus généralement, toutes opérations industrielles, commerciales, financières, mobilières ou immobilières pouvant se rattacher directement ou indirectement à l'objet social ou susceptibles d'en faciliter la réalisation, le développement ou la continuité.",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 5 - Durée",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `La durée de la société est fixée à ${client.duree_societe} années à compter de son immatriculation au Registre du Commerce et des Sociétés, sauf prorogation ou dissolution anticipée décidée conformément aux statuts.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          // TITRE II
          new Paragraph({
            children: [
              new TextRun({
                text: "TITRE II : APPORTS - CAPITAL SOCIAL",
                bold: true,
                allCaps: true,
                size: 16 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 6 - Apports",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Les associés font apport à la société d'une somme totale de ${formatMontant(client.capital_social)} euros en numéraire.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 7 - Capital social",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          
          // Paragraphe intro
          new Paragraph({
            children: [
              new TextRun({
                text: `Le capital social est fixé à la somme de ${formatMontant(client.capital_social)} euros.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          // Tableau récapitulatif du capital
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              // LIGNE 1 : En-tête
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Associé",
                            bold: true,
                          }),
                        ],
                      }),
                    ],
                    shading: { fill: "D3D3D3" },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Nombre d'actions",
                            bold: true,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: { fill: "D3D3D3" },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Valeur nominale",
                            bold: true,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: { fill: "D3D3D3" },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Montant souscrit",
                            bold: true,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: { fill: "D3D3D3" },
                  }),
                ],
              }),
              // LIGNES : Données associés
              ...associesUniques.map((associe, index) => {
                // Répartition équitable si plusieurs associés
                const nbActionsParAssocie = Math.floor(client.nb_actions / associesUniques.length);
                // Le dernier associé récupère le reste des actions pour que le total soit exact
                const actionsFinales = index === associesUniques.length - 1 
                  ? client.nb_actions - (nbActionsParAssocie * (associesUniques.length - 1))
                  : nbActionsParAssocie;
                const montantParAssocie = client.capital_social / associesUniques.length;
                
                return new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: `${associe.civilite} ${associe.prenom} ${associe.nom}`,
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: `${actionsFinales}`,
                          alignment: AlignmentType.CENTER,
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: `${formatMontant(valeurNominale)} €`,
                          alignment: AlignmentType.CENTER,
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: `${formatMontant(montantParAssocie)} €`,
                          alignment: AlignmentType.CENTER,
                        }),
                      ],
                    }),
                  ],
                });
              }),
              // LIGNE : Total
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "TOTAL",
                            bold: true,
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
                            text: `${client.nb_actions}`,
                            bold: true,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: "",
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `${formatMontant(client.capital_social)} €`,
                            bold: true,
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Paragraphe après le tableau
          new Paragraph({
            children: [
              new TextRun({
                text: `Le capital est divisé en ${client.nb_actions} actions de ${formatMontant(valeurNominale)} euros de valeur nominale chacune, intégralement souscrites et libérées à hauteur de ${formatMontant(client.montant_libere)} euros.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 8 - Modification du capital",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Le capital social peut être augmenté, réduit ou amorti dans les conditions prévues par la loi et les présents statuts.",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 9 - Forme des actions",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Les actions sont nominatives et donnent lieu à une inscription en compte conformément à la réglementation en vigueur. Les attestations d'inscription valent titres au regard des tiers.",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 10 - Transmission des actions",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Les actions sont librement cessibles entre associés. Toute cession à un tiers non associé est soumise à l'agrément préalable de la collectivité des associés dans les conditions de majorité prévues par les présents statuts.",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          // TITRE III
          new Paragraph({
            children: [
              new TextRun({
                text: "TITRE III : DIRECTION",
                bold: true,
                allCaps: true,
                size: 16 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 11 - Présidence",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "La société est représentée et dirigée par un président.",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Le premier président est : ${associe.civilite} ${associe.prenom} ${associe.nom}, nommé pour une durée illimitée. Il peut être révoqué dans les conditions prévues par la loi et les présents statuts.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 12 - Pouvoirs du président",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Le président est investi des pouvoirs les plus étendus pour agir en toute circonstance au nom de la société, dans la limite de l'objet social et sous réserve des pouvoirs expressément attribués par la loi ou les statuts à la collectivité des associés.",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 13 - Rémunération",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "La collectivité des associés fixe et, le cas échéant, modifie la rémunération du président. Celle-ci peut comprendre une partie fixe et/ou une partie variable.",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          // TITRE IV
          new Paragraph({
            children: [
              new TextRun({
                text: "TITRE IV : DÉCISIONS COLLECTIVES",
                bold: true,
                allCaps: true,
                size: 16 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 14 - Assemblées générales",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Les associés sont réunis en assemblée générale aussi souvent que l'intérêt de la société l'exige et au moins une fois par an pour l'approbation des comptes de l'exercice.",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 15 - Convocation",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Les assemblées sont convoquées par le président par lettre simple, courrier électronique ou tout autre moyen écrit, au moins sept jours avant la date de réunion, sauf délai différent prévu par la loi.",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 16 - Quorum et majorité",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Chaque action donne droit à une voix. Sauf dispositions légales contraires, les décisions sont prises à la majorité simple des voix exprimées par les associés présents ou représentés.",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          // TITRE V
          new Paragraph({
            children: [
              new TextRun({
                text: "TITRE V : EXERCICE SOCIAL - COMPTES",
                bold: true,
                allCaps: true,
                size: 16 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 17 - Exercice social",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "L'exercice social commence le 1er janvier et se termine le 31 décembre de chaque année.",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Par exception, le premier exercice social se terminera le ${premierExerciceFin}.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 18 - Comptes annuels",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "À la clôture de chaque exercice, le président établit l'inventaire, les comptes annuels et le rapport de gestion. Les comptes sont soumis à l'approbation de la collectivité des associés.",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 19 - Affectation du résultat",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Le bénéfice distribuable est réparti entre les associés proportionnellement au nombre d'actions détenues, sauf décision contraire de l'assemblée générale prise dans les limites fixées par la loi.",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          // TITRE VI
          new Paragraph({
            children: [
              new TextRun({
                text: "TITRE VI : DISSOLUTION - LIQUIDATION",
                bold: true,
                allCaps: true,
                size: 16 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 20 - Dissolution",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "La société prend fin par l'arrivée du terme, par décision de la collectivité des associés réunis en assemblée générale extraordinaire ou pour toute autre cause prévue par la loi.",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Article 21 - Liquidation",
                bold: true,
                size: 13 * 2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "En cas de dissolution, la collectivité des associés désigne un ou plusieurs liquidateurs dont elle détermine les pouvoirs. Les liquidateurs disposent des pouvoirs les plus étendus pour réaliser l'actif, acquitter le passif et répartir le solde conformément à la loi.",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          // Page de signatures
          new Paragraph({ text: "", pageBreakBefore: true }),

          // Titre
          new Paragraph({
            children: [
              new TextRun({
                text: "SIGNATURES",
                bold: true,
                size: 16 * 2,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          }),

          // Mention légale
          new Paragraph({
            children: [
              new TextRun({
                text: `${pronoms.soussigne} déclarent avoir pris connaissance des présents statuts, en accepter toutes les dispositions et s'engager à les respecter.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Mention « Lu et approuvé, bon pour acceptation des statuts »",
                bold: true,
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Blocs de signatures pour chaque associé
          ...associesUniques.flatMap((associe) => [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${associe.civilite} ${associe.prenom} ${associe.nom}`,
                  bold: true,
                }),
              ],
              spacing: { before: 200, after: 50 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Fait à ${adresseSiege}`,
                  size: 11 * 2,
                }),
              ],
              spacing: { after: 50 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Le ${dateSignature}`,
                  size: 11 * 2,
                }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Signature (précédée de la mention « Lu et approuvé ») :",
                  size: 11 * 2,
                }),
              ],
              spacing: { after: 50 },
            }),

            // Espace pour signature
            new Paragraph({ text: "" }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "" }),

            new Paragraph({
              text: "_".repeat(50),
              spacing: { after: 200 },
            }),
          ]),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
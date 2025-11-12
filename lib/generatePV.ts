import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, PageNumber, Footer, NumberFormat, Header, BorderStyle } from "docx";
import type { ClientData, AssocieData } from "./generateStatuts";

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

export async function generatePV(client: ClientData, associes: AssocieData[]): Promise<Buffer> {
  if (!associes || associes.length === 0) throw new Error("Aucun associé trouvé");

  // Dédupliquer les associés
  const associesUniques = associes.filter((associe, index, self) => 
    index === self.findIndex(a => a.nom === associe.nom && a.prenom === associe.prenom)
  );

  const formeJuridique = getFormeJuridique(associesUniques.length);
  const pronoms = getPronoms(associesUniques);
  const adresseSiege = formatAdresse(client.adresse_siege);
  const villeSiege = extraireVille(adresseSiege);
  const dateSignature = formatDate(client.date_creation);
  const dateAssemblee = formatDate(client.date_creation);
  const premierAssocie = associesUniques[0];

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
                    text: `PROCÈS-VERBAL - ${client.nom_entreprise}`,
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
          // PAGE DE GARDE
          new Paragraph({
            children: [
              new TextRun({
                text: "PROCÈS-VERBAL",
                bold: true,
                allCaps: true,
                size: 20 * 2,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: associesUniques.length === 1 
                  ? "DÉCISIONS DE L'ASSOCIÉ UNIQUE" 
                  : "DE L'ASSEMBLÉE GÉNÉRALE CONSTITUTIVE",
                bold: true,
                size: 14 * 2,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),

          new Paragraph({
            children: [
              new TextRun({
                text: client.nom_entreprise,
                bold: true,
                size: 16 * 2,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: formeJuridique.complete,
                size: 11 * 2,
              }),
            ],
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
            children: [
              new TextRun({
                text: `Siège social : ${adresseSiege}`,
                size: 11 * 2,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          new Paragraph({ text: "", pageBreakBefore: true }),

          // INFORMATIONS DE L'ASSEMBLÉE
          new Paragraph({
            children: [
              new TextRun({
                text: "INFORMATIONS DE L'ASSEMBLÉE",
                bold: true,
                size: 16 * 2,
              }),
            ],
            spacing: { before: 200, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Date : ${dateAssemblee}`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Heure : 14h00",
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Lieu : ${adresseSiege}`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 300 },
          }),

          // PRÉSENCE / REPRÉSENTATION
          new Paragraph({
            children: [
              new TextRun({
                text: associesUniques.length === 1 ? "L'associé unique :" : "Sont présents :",
                bold: true,
                size: 13 * 2,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          ...associesUniques.flatMap((associe, index) => [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${associe.civilite} ${associe.prenom} ${associe.nom}, ${accorderNe(associe.civilite)} le ${formatDate(associe.date_naissance)} à ${associe.lieu_naissance || 'lieu non renseigné'}, demeurant ${formatAdresse(associe.adresse)}`,
                  size: 11 * 2,
                }),
              ],
              spacing: { after: 50 },
            }),
          ]),

          new Paragraph({
            children: [
              new TextRun({
                text: `Représentant la totalité du capital social, soit ${client.nb_actions} actions.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 300 },
          }),

          // PRÉSIDENCE
          new Paragraph({
            children: [
              new TextRun({
                text: "PRÉSIDENCE",
                bold: true,
                size: 13 * 2,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `L'assemblée est présidée par ${premierAssocie.civilite} ${premierAssocie.prenom} ${premierAssocie.nom}.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 300 },
          }),

          // CONSTATATION DU QUORUM
          new Paragraph({
            children: [
              new TextRun({
                text: "CONSTATATION DU QUORUM",
                bold: true,
                size: 13 * 2,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: associesUniques.length === 1
                  ? "L'associé unique représente la totalité du capital social. Le quorum est donc atteint."
                  : `Tous les associés sont présents ou représentés. Ils représentent la totalité du capital social, soit ${client.nb_actions} actions. Le quorum est donc atteint.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 300 },
          }),

          // EXPOSÉ DU PRÉSIDENT
          new Paragraph({
            children: [
              new TextRun({
                text: "EXPOSÉ DU PRÉSIDENT",
                bold: true,
                size: 13 * 2,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Le président expose que ${pronoms.possessif} projet est de constituer une ${formeJuridique.complete} (${formeJuridique.sigle}) sous la dénomination sociale "${client.nom_entreprise}", ayant pour objet social : ${client.objet_social}.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Il informe l'assemblée que le capital social de ${formatMontant(client.capital_social)} euros, divisé en ${client.nb_actions} actions, a été intégralement souscrit. Les fonds correspondant à la libération partielle du capital, soit ${formatMontant(client.montant_libere)} euros, ont été déposés${associesUniques.length === 1 ? '' : ' par les associés'}${(client as any).banque_depot_capital ? ` auprès de ${(client as any).banque_depot_capital} sous le numéro de compte à compléter` : ' sur un compte bancaire ouvert au nom de la société en formation'}.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Le président précise que la libération du capital social a été effectuée conformément aux dispositions légales en vigueur, à hauteur de ${formatMontant(client.montant_libere)} euros, soit ${Math.round((client.montant_libere / client.capital_social) * 100)}% du capital social.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Il présente ensuite les statuts de la société qui ont été établis conformément aux dispositions légales applicables aux ${formeJuridique.sigle} et soumet ces statuts à l'approbation de l'assemblée.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 300 },
          }),

          // RÉSOLUTIONS
          new Paragraph({
            children: [
              new TextRun({
                text: "RÉSOLUTIONS",
                bold: true,
                size: 16 * 2,
              }),
            ],
            spacing: { before: 200, after: 200 },
          }),

          // PREMIÈRE RÉSOLUTION
          new Paragraph({
            children: [
              new TextRun({
                text: "PREMIÈRE RÉSOLUTION - Approbation des statuts",
                bold: true,
                size: 13 * 2,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `L'assemblée approuve les statuts de la ${formeJuridique.complete} "${client.nom_entreprise}" qui lui sont présentés et qui ont été déposés au dossier de constitution.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Cette résolution est adoptée à l'unanimité.",
                size: 11 * 2,
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          }),

          // DEUXIÈME RÉSOLUTION
          new Paragraph({
            children: [
              new TextRun({
                text: "DEUXIÈME RÉSOLUTION - Constatation de la constitution définitive",
                bold: true,
                size: 13 * 2,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `L'assemblée constate que toutes les formalités de constitution de la ${formeJuridique.complete} "${client.nom_entreprise}" ont été accomplies et que la société est définitivement constituée.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Cette résolution est adoptée à l'unanimité.",
                size: 11 * 2,
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          }),

          // TROISIÈME RÉSOLUTION
          new Paragraph({
            children: [
              new TextRun({
                text: "TROISIÈME RÉSOLUTION - Nomination du Président",
                bold: true,
                size: 13 * 2,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `L'assemblée nomme ${premierAssocie.civilite} ${premierAssocie.prenom} ${premierAssocie.nom} en qualité de Président de la société, pour la durée prévue par les statuts.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Cette résolution est adoptée à l'unanimité.",
                size: 11 * 2,
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          }),

          // QUATRIÈME RÉSOLUTION
          new Paragraph({
            children: [
              new TextRun({
                text: "QUATRIÈME RÉSOLUTION - Pouvoirs pour formalités",
                bold: true,
                size: 13 * 2,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `L'assemblée donne pouvoir au Président, ${premierAssocie.civilite} ${premierAssocie.prenom} ${premierAssocie.nom}, pour accomplir toutes les formalités nécessaires à l'immatriculation de la société au Registre du Commerce et des Sociétés, notamment : la publication des avis légaux, le dépôt des actes et pièces au greffe du tribunal de commerce compétent, et toutes autres formalités nécessaires.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Cette résolution est adoptée à l'unanimité.",
                size: 11 * 2,
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          }),

          // CINQUIÈME RÉSOLUTION
          new Paragraph({
            children: [
              new TextRun({
                text: "CINQUIÈME RÉSOLUTION - Ouverture de comptes bancaires",
                bold: true,
                size: 13 * 2,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `L'assemblée autorise le Président à ouvrir tous comptes bancaires et postaux nécessaires au fonctionnement de la société et à effectuer toutes opérations bancaires y afférentes.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Cette résolution est adoptée à l'unanimité.",
                size: 11 * 2,
                italics: true,
              }),
            ],
            spacing: { after: 300 },
          }),

          // CLÔTURE
          new Paragraph({
            children: [
              new TextRun({
                text: "CLÔTURE",
                bold: true,
                size: 13 * 2,
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Aucune autre question n'étant à l'ordre du jour, l'assemblée est levée à 16h00.`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 300 },
          }),

          // SIGNATURES
          new Paragraph({
            children: [
              new TextRun({
                text: "SIGNATURES",
                bold: true,
                size: 16 * 2,
              }),
            ],
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Fait à ${villeSiege}, le ${dateSignature}`,
                size: 11 * 2,
              }),
            ],
            spacing: { after: 300 },
          }),

          ...associesUniques.flatMap((associe, index) => [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${associe.civilite} ${associe.prenom} ${associe.nom}`,
                  bold: true,
                  size: 11 * 2,
                }),
              ],
              spacing: { before: index === 0 ? 0 : 200, after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Lu et approuvé, bon pour acceptation",
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
                  text: "_________________________",
                  size: 11 * 2,
                }),
              ],
              spacing: { after: index === associesUniques.length - 1 ? 0 : 200 },
            }),
          ]),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}


import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { ActeJuridiqueData, ClientData, CabinetData } from "./types/database";

const formatDate = (date: string | null | undefined): string => {
  if (!date) {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
      timeZone: "Europe/Paris",
    }).format(new Date());
  }

  const d = new Date(date);
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeZone: "Europe/Paris",
  }).format(d);
};

const formatMontant = (montant: number | null | undefined): string => {
  if (montant === null || montant === undefined) {
    return "0,00 €";
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(montant);
};

const formatAdresse = (adresse: string | Record<string, string | number | undefined> | null): string => {
  if (!adresse) return "Non renseignée";
  if (typeof adresse === "string") return adresse;

  const parts = [
    adresse.numero_voie,
    adresse.type_voie,
    adresse.nom_voie || adresse.libelle_voie,
    adresse.code_postal,
    adresse.ville,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : "Non renseignée";
};

const extractVille = (adresse: string | { ville?: string } | null | undefined): string => {
  if (!adresse) return "";
  if (typeof adresse === "string") {
    const segments = adresse.split(",").map((segment) => segment.trim());
    return segments[segments.length - 1] || "";
  }

  return adresse.ville || "";
};

export async function generateReductionCapital(
  acte: ActeJuridiqueData & { client: ClientData },
  cabinet: CabinetData
): Promise<Buffer> {
  if (acte.type !== "reduction_capital") {
    throw new Error("Ce générateur est réservé aux réductions de capital.");
  }

  if (!acte.client) {
    throw new Error("Les données du client sont requises.");
  }

  if (
    acte.ancien_capital === null ||
    acte.ancien_capital === undefined ||
    acte.nouveau_capital_apres_reduction === null ||
    acte.nouveau_capital_apres_reduction === undefined
  ) {
    throw new Error("Les montants d'ancien et de nouveau capital sont requis.");
  }

  if (!acte.modalite_reduction) {
    throw new Error("La modalité de réduction est requise.");
  }

  const client = acte.client;
  const capitalActuel = acte.ancien_capital;
  const nouveauCapital = acte.nouveau_capital_apres_reduction;
  const montantReduction = acte.montant_reduction || capitalActuel - nouveauCapital;
  const modalite = acte.modalite_reduction;
  const motif = acte.motif_reduction || "";
  const reductionMotiveePertes = acte.reduction_motivee_pertes || false;
  const dateAge = acte.date_acte || new Date().toISOString().split("T")[0];
  // Le nombre d'actions vient du client (nb_actions) car il n'est pas stocké dans l'acte
  const nombreActions = client.nb_actions || 0;
  const quorumPresent = acte.quorum || 0;
  const votesPour = acte.votes_pour || 0;
  const votesContre = acte.votes_contre || 0;

  const villeSiege = extractVille(client.adresse_siege || client.adresse) || "Ville";
  const dateActeFormatee = formatDate(dateAge);
  const adresseSiege = formatAdresse(client.adresse_siege || client.adresse);

  // Récupération des données spécifiques par modalité
  const nombreActionsRachetees = acte.nombre_actions_rachetees || 0;
  const prixRachatParAction = acte.prix_rachat_par_action || 0;
  const ancienneValeurNominale = acte.ancienne_valeur_nominale || 0;
  const nouvelleValeurNominale = acte.nouvelle_valeur_nominale || 0;
  const coupAccordeonAugmentation = acte.coup_accordeon_augmentation_montant || 0;
  const coupAccordeonCapitalFinal = acte.coup_accordeon_nouveau_capital_final || 0;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            pageNumbers: {
              start: 1,
              formatType: "decimal",
            },
          },
        },
        children: [
          // En-tête
          new Paragraph({
            children: [
              new TextRun({
                text: client.nom_entreprise || "Société",
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `${client.forme_juridique || ""} au capital de ${formatMontant(capitalActuel)}`,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Siège social : ${adresseSiege}`,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: client.siret ? `SIRET : ${client.siret}` : "",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Titre principal
          new Paragraph({
            children: [
              new TextRun({
                text: "PROCÈS-VERBAL D'ASSEMBLÉE GÉNÉRALE EXTRAORDINAIRE",
                bold: true,
                size: 28,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Réduction de capital",
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Date et lieu
          new Paragraph({
            children: [
              new TextRun({
                text: `Date de l'assemblée : ${dateActeFormatee}`,
              }),
            ],
            spacing: { after: 200 },
          }),

          // CONVOCATION
          new Paragraph({
            children: [
              new TextRun({
                text: "CONVOCATION",
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `L'Assemblée Générale Extraordinaire de la société ${client.nom_entreprise || "la société"} s'est réunie le ${dateActeFormatee} au siège social, sur convocation régulière de la direction.`,
              }),
            ],
            spacing: { after: 200 },
          }),

          // PRÉSIDENCE
          new Paragraph({
            children: [
              new TextRun({
                text: "PRÉSIDENCE",
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `La séance est présidée par le Président de la société.`,
              }),
            ],
            spacing: { after: 200 },
          }),

          // QUORUM ET MAJORITÉ
          new Paragraph({
            children: [
              new TextRun({
                text: "QUORUM ET MAJORITÉ",
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Quorum présent : ${quorumPresent}%`,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Le quorum requis pour une Assemblée Générale Extraordinaire étant atteint, l'assemblée peut valablement délibérer.`,
              }),
            ],
            spacing: { after: 200 },
          }),

          // ORDRE DU JOUR
          new Paragraph({
            children: [
              new TextRun({
                text: "ORDRE DU JOUR",
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `1. Réduction du capital social de ${formatMontant(capitalActuel)} à ${formatMontant(nouveauCapital)}`,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "2. Modalités de la réduction",
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "3. Modification corrélative des statuts",
              }),
            ],
            spacing: { after: 200 },
          }),

          // EXPOSÉ DES MOTIFS
          new Paragraph({
            children: [
              new TextRun({
                text: "EXPOSÉ DES MOTIFS",
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Le Président expose aux associés les raisons de cette réduction de capital :",
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: motif || "Non spécifié",
              }),
            ],
            spacing: { after: 200 },
          }),

          // Droits des créanciers
          ...(reductionMotiveePertes
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Cette réduction étant motivée par des pertes, elle est dispensée du droit d'opposition des créanciers conformément à l'article L. 225-205 du Code de commerce.`,
                      italics: true,
                    }),
                  ],
                  spacing: { after: 200 },
                }),
              ]
            : [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Conformément à l'article L. 225-204 du Code de commerce, les créanciers de la société pourront former opposition à cette réduction dans un délai de vingt jours à compter du dépôt au greffe du procès-verbal de la présente assemblée. Une publication sera effectuée au BODACC.`,
                      italics: true,
                    }),
                  ],
                  spacing: { after: 200 },
                }),
              ]),

          // MODALITÉS DE LA RÉDUCTION
          new Paragraph({
            children: [
              new TextRun({
                text: "MODALITÉS DE LA RÉDUCTION",
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          ...getModaliteContent(
            modalite,
            nombreActions,
            nombreActionsRachetees,
            prixRachatParAction,
            ancienneValeurNominale,
            nouvelleValeurNominale,
            capitalActuel,
            coupAccordeonAugmentation,
            coupAccordeonCapitalFinal
          ),

          // DÉLIBÉRATION
          new Paragraph({
            children: [
              new TextRun({
                text: "DÉLIBÉRATION",
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Après avoir entendu l'exposé du Président et en avoir délibéré, l'assemblée adopte à la majorité requise la résolution suivante :`,
              }),
            ],
            spacing: { after: 200 },
          }),

          // RÉSOLUTION
          new Paragraph({
            children: [
              new TextRun({
                text: "RÉSOLUTION UNIQUE",
                bold: true,
                size: 22,
              }),
            ],
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 300, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `L'Assemblée Générale Extraordinaire décide de réduire le capital social d'un montant de ${formatMontant(montantReduction)}, le ramenant de ${formatMontant(capitalActuel)} à ${formatMontant(nouveauCapital)}.`,
              }),
            ],
            spacing: { after: 200 },
          }),

          ...getResolutionModaliteContent(
            modalite,
            nombreActionsRachetees,
            prixRachatParAction,
            ancienneValeurNominale,
            nouvelleValeurNominale,
            coupAccordeonAugmentation,
            coupAccordeonCapitalFinal
          ),

          // RÉSULTAT DU VOTE
          new Paragraph({
            children: [
              new TextRun({
                text: "RÉSULTAT DU VOTE",
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Votes pour : ${votesPour}`,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Votes contre : ${votesContre}`,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Majorité : ${votesPour + votesContre > 0 ? ((votesPour / (votesPour + votesContre)) * 100).toFixed(2) : "0,00"}%`,
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text:
                  votesPour >= (votesPour + votesContre) * (2 / 3)
                    ? "La résolution est ADOPTÉE à la majorité des deux tiers."
                    : "La résolution est REJETÉE (majorité des 2/3 non atteinte).",
                bold: true,
              }),
            ],
            spacing: { after: 400 },
          }),

          // MODIFICATION DES STATUTS
          new Paragraph({
            children: [
              new TextRun({
                text: "MODIFICATION DES STATUTS",
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "En conséquence de cette décision, l'article des statuts relatif au capital social est modifié comme suit :",
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `"Le capital social est fixé à ${formatMontant(nouveauCapital)}."`,
                italics: true,
              }),
            ],
            spacing: { after: 400 },
          }),

          // CLÔTURE
          new Paragraph({
            children: [
              new TextRun({
                text: "L'ordre du jour étant épuisé et personne ne demandant plus la parole, le Président lève la séance.",
              }),
            ],
            spacing: { before: 400, after: 200 },
          }),

          // SIGNATURES
          new Paragraph({
            children: [
              new TextRun({
                text: "Fait en [nombre] exemplaires originaux.",
              }),
            ],
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `À ${villeSiege}, le ${dateActeFormatee}`,
              }),
            ],
            spacing: { after: 400 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Le Président",
              }),
            ],
            spacing: { before: 400 },
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

// Fonction helper : Contenu spécifique par modalité
function getModaliteContent(
  modalite: string,
  nombreActions: number,
  nombreActionsRachetees: number,
  prixRachatParAction: number,
  ancienneValeurNominale: number,
  nouvelleValeurNominale: number,
  capitalActuel: number,
  coupAccordeonAugmentation: number,
  coupAccordeonCapitalFinal: number
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  if (modalite === "rachat_annulation") {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Modalité : Rachat et annulation d'actions",
            bold: true,
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `La société procédera au rachat de ${nombreActionsRachetees} actions au prix unitaire de ${formatMontant(prixRachatParAction)}, soit un montant total de ${formatMontant(nombreActionsRachetees * prixRachatParAction)}.`,
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Ces actions seront immédiatement annulées après rachat.",
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Nombre d'actions avant réduction : ${nombreActions}`,
          }),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Nombre d'actions rachetées et annulées : ${nombreActionsRachetees}`,
          }),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Nombre d'actions après réduction : ${nombreActions - nombreActionsRachetees}`,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  } else if (modalite === "reduction_valeur_nominale") {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Modalité : Réduction de la valeur nominale des actions",
            bold: true,
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `La valeur nominale de chaque action sera réduite de ${formatMontant(ancienneValeurNominale)} à ${formatMontant(nouvelleValeurNominale)}.`,
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Nombre d'actions (inchangé) : ${nombreActions}`,
          }),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Ancienne valeur nominale : ${formatMontant(ancienneValeurNominale)}`,
          }),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Nouvelle valeur nominale : ${formatMontant(nouvelleValeurNominale)}`,
          }),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Réduction par action : ${formatMontant(ancienneValeurNominale - nouvelleValeurNominale)}`,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  } else if (modalite === "coup_accordeon") {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Modalité : Coup d'accordéon",
            bold: true,
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Cette opération se déroulera en deux temps :",
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "1. Réduction du capital à 1€ par annulation des pertes",
          }),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `   Capital actuel : ${formatMontant(capitalActuel)}`,
          }),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "   Capital après réduction : 1,00 €",
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "2. Augmentation immédiate du capital par apport en numéraire",
          }),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `   Montant de l'augmentation : ${formatMontant(coupAccordeonAugmentation)}`,
          }),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `   Capital final : ${formatMontant(coupAccordeonCapitalFinal)}`,
          }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Cette opération permet à la société de repartir sur des bases financières saines en annulant les pertes accumulées et en recapitalisant immédiatement.",
            italics: true,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  return paragraphs;
}

// Fonction helper : Résolution spécifique par modalité
function getResolutionModaliteContent(
  modalite: string,
  nombreActionsRachetees: number,
  prixRachatParAction: number,
  ancienneValeurNominale: number,
  nouvelleValeurNominale: number,
  coupAccordeonAugmentation: number,
  coupAccordeonCapitalFinal: number
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  if (modalite === "rachat_annulation") {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Cette réduction sera réalisée par rachat et annulation de ${nombreActionsRachetees} actions au prix de ${formatMontant(prixRachatParAction)} chacune.`,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  } else if (modalite === "reduction_valeur_nominale") {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Cette réduction sera réalisée par diminution de la valeur nominale de chaque action, qui passera de ${formatMontant(ancienneValeurNominale)} à ${formatMontant(nouvelleValeurNominale)}.`,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  } else if (modalite === "coup_accordeon") {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Cette réduction sera réalisée par la technique du "coup d'accordéon" : réduction du capital à 1€ suivie immédiatement d'une augmentation de ${formatMontant(coupAccordeonAugmentation)}, portant le capital final à ${formatMontant(coupAccordeonCapitalFinal)}.`,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  return paragraphs;
}


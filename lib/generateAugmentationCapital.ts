import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
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
    return "0,00";
  }

  return new Intl.NumberFormat("fr-FR", {
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

type NouvelAssocie = {
  nom: string;
  prenom: string;
  adresse: string;
  apport: number;
  nombre_actions: number;
};

export async function generateAugmentationCapital(
  acte: ActeJuridiqueData & { client: ClientData },
  cabinet: CabinetData
): Promise<Buffer> {
  if (acte.type !== "augmentation_capital") {
    throw new Error("Ce générateur est réservé aux augmentations de capital.");
  }

  if (!acte.client) {
    throw new Error("Les données du client sont requises.");
  }

  if (
    acte.ancien_capital === null ||
    acte.ancien_capital === undefined ||
    acte.nouveau_capital === null ||
    acte.nouveau_capital === undefined
  ) {
    throw new Error("Les montants d'ancien et de nouveau capital sont requis.");
  }

  if (!acte.modalite) {
    throw new Error("La modalité de l'augmentation de capital est requise.");
  }

  if (!acte.nombre_nouvelles_actions || acte.nombre_nouvelles_actions <= 0) {
    throw new Error("Le nombre de nouvelles actions doit être supérieur à zéro.");
  }

  const client = acte.client;
  const ancienCapital = acte.ancien_capital;
  const nouveauCapital = acte.nouveau_capital;
  const montantAugmentation =
    acte.montant_augmentation ?? nouveauCapital - ancienCapital;

  if (montantAugmentation <= 0) {
    throw new Error("Le montant de l'augmentation doit être positif.");
  }

  const nouvellesActions = acte.nombre_nouvelles_actions;
  const actionsExistantes = client.nb_actions || 0;
  const totalActions = actionsExistantes + nouvellesActions;
  const valeurNominale = totalActions > 0 ? nouveauCapital / totalActions : 0;

  const villeCabinet = extractVille(cabinet.adresse) || "Ville";
  const villeRCS = extractVille(client.adresse) || "Ville";
  const dateActe = formatDate(acte.date_acte);

  const nouveauxAssocies: NouvelAssocie[] = Array.isArray(acte.nouveaux_associes)
    ? (acte.nouveaux_associes as NouvelAssocie[])
    : [];

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: "PROCÈS-VERBAL D'ASSEMBLÉE GÉNÉRALE EXTRAORDINAIRE",
          bold: true,
          size: 32,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "AUGMENTATION DE CAPITAL",
          bold: true,
          size: 28,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "SOCIÉTÉ",
          bold: true,
          size: 24,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Dénomination sociale : ${client.nom_entreprise || "Non renseignée"}`,
        }),
      ],
      spacing: { after: 100 },
    }),
  ];

  if (client.forme_juridique) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Forme juridique : ${client.forme_juridique}`,
          }),
        ],
        spacing: { after: 100 },
      })
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Capital social actuel : ${formatMontant(ancienCapital)} €`,
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Siège social : ${formatAdresse(client.adresse)}`,
        }),
      ],
      spacing: { after: 100 },
    })
  );

  if (client.siret) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `SIRET : ${client.siret}`,
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `RCS : ${villeRCS} ${client.siret}`,
          }),
        ],
        spacing: { after: 400 },
      })
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "DATE ET LIEU",
          bold: true,
          size: 24,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `L'an ${new Date().getFullYear()}, le ${dateActe}, les associés de la société ${
            client.nom_entreprise || ""
          } se sont réunis en Assemblée Générale Extraordinaire au siège social.`,
        }),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "PRÉSENCE - QUORUM",
          bold: true,
          size: 24,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Étaient présents ou représentés ${acte.quorum ?? "___"}% du capital social, permettant à l'Assemblée de délibérer valablement.`,
        }),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "ORDRE DU JOUR",
          bold: true,
          size: 24,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "- Augmentation du capital social" })],
    }),
    new Paragraph({
      children: [new TextRun({ text: "- Modification corrélative des statuts" })],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "PREMIÈRE RÉSOLUTION - AUGMENTATION DE CAPITAL",
          bold: true,
          size: 24,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `L'Assemblée Générale, après en avoir délibéré, décide d'augmenter le capital social de la société de ${formatMontant(
            ancienCapital
          )} € à ${formatMontant(nouveauCapital)} €, soit une augmentation de ${formatMontant(
            montantAugmentation
          )} €.`,
        }),
      ],
      spacing: { after: 200 },
    })
  );

  switch (acte.modalite) {
    case "numeraire":
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Cette augmentation sera réalisée par apport en numéraire de ${formatMontant(
                montantAugmentation
              )} €.`,
            }),
          ],
          spacing: { after: 200 },
        })
      );
      break;
    case "nature":
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Cette augmentation sera réalisée par apport en nature consistant en : ${
                acte.description_apport || "Description non renseignée"
              }.`,
            }),
          ],
          spacing: { after: 200 },
        })
      );
      break;
    case "reserves":
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Cette augmentation sera réalisée par incorporation de réserves, sans apport nouveau.",
            }),
          ],
          spacing: { after: 200 },
        })
      );
      break;
    default:
      break;
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "MODALITÉS",
          bold: true,
          size: 24,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `L'augmentation de capital sera réalisée par la création de ${nouvellesActions} actions nouvelles de ${formatMontant(
            valeurNominale
          )} € de valeur nominale.`,
        }),
      ],
      spacing: { after: 400 },
    })
  );

  if (nouveauxAssocies.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "NOUVEAUX ASSOCIÉS",
            bold: true,
            size: 24,
          }),
        ],
        spacing: { after: 200 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: ["Nom", "Prénom", "Apport (€)", "Nombre d'actions"].map(
              (label) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: label,
                          bold: true,
                        }),
                      ],
                    }),
                  ],
                  shading: { fill: "D9E2F3" },
                })
            ),
          }),
          ...nouveauxAssocies.map(
            (associe) =>
              new TableRow({
                children: [
                  associe.nom || "",
                  associe.prenom || "",
                  formatMontant(associe.apport || 0),
                  `${associe.nombre_actions || 0}`,
                ].map(
                  (value) =>
                    new TableCell({
                      children: [new Paragraph({ text: value })],
                    })
                ),
              })
          ),
        ],
      })
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "MODIFICATION DES STATUTS",
          bold: true,
          size: 24,
        }),
      ],
      spacing: { before: 200, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "En conséquence, l'article relatif au capital social est modifié comme suit :",
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `"Le capital social est fixé à ${formatMontant(
            nouveauCapital
          )} € divisé en ${totalActions} actions de ${formatMontant(valeurNominale)} € chacune."`,
          italics: true,
        }),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "VOTE",
          bold: true,
          size: 24,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `La résolution est adoptée à ${acte.votes_pour ?? "__"} voix POUR et ${
            acte.votes_contre ?? "__"
          } voix CONTRE.`,
        }),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "POUVOIR",
          bold: true,
          size: 24,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Tous pouvoirs sont donnés au Président pour accomplir toutes formalités légales et publier les présentes modifications.",
        }),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Fait à ${villeCabinet}, le ${dateActe}`,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "LE PRÉSIDENT",
          bold: true,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: cabinet.nom || "Le Président",
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: " " })],
      border: {
        top: {
          color: "000000",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

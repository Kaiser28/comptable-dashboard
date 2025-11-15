import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";

// Interface pour les données de l'AG Ordinaire
export interface AGOrdinaireData {
  // Société
  denomination: string;
  forme_juridique: string;
  capital_social: number;
  siege_social: string;
  rcs: string;

  // AG
  date_ag: string; // Format : "15 mars 2025"
  heure_ag: string; // Format : "14h00"
  lieu_ag: string; // Adresse ou "au siège social"
  exercice_clos: string; // "2024" ou "01/01/2024 au 31/12/2024"

  // Résultat
  resultat_exercice: number; // Peut être négatif
  affectation_resultat: "report_nouveau" | "reserves" | "dividendes" | "mixte";
  montant_dividendes?: number;
  montant_reserves?: number;
  montant_report?: number;

  // Participants
  president_nom: string;
  president_prenom: string;
  associes: Array<{
    nom: string;
    prenom: string;
    nb_actions: number;
    present: boolean; // true = présent, false = représenté
  }>;

  // Vote
  quitus_president: boolean;
  votes_pour_comptes: number;
  votes_contre_comptes: number;
  votes_abstention_comptes: number;
}

// Fonctions utilitaires
const formatMontant = (montant: number): string => {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(montant));
};

const nombreEnLettres = (nombre: number): string => {
  const unite = [
    "",
    "un",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize",
    "dix-sept",
    "dix-huit",
    "dix-neuf",
  ];
  const dizaine = [
    "",
    "",
    "vingt",
    "trente",
    "quarante",
    "cinquante",
    "soixante",
    "soixante-dix",
    "quatre-vingt",
    "quatre-vingt-dix",
  ];

  if (nombre === 0) return "zéro";
  if (nombre < 20) return unite[nombre];
  if (nombre < 100) {
    const d = Math.floor(nombre / 10);
    const u = nombre % 10;
    if (u === 0) return dizaine[d];
    if (d === 7 || d === 9) {
      return dizaine[d] + "-" + unite[10 + u];
    }
    return dizaine[d] + (u === 1 ? " et " : "-") + unite[u];
  }
  // Simplification pour les grands nombres
  return nombre.toString();
};

const extractVille = (adresse: string): string => {
  if (!adresse) return "";
  const segments = adresse.split(",").map((segment) => segment.trim());
  return segments[segments.length - 1] || "";
};

export interface GenerationResult {
  success: boolean;
  buffer?: Buffer;
  error?: string;
}

export async function generatePVAGOrdinaire(data: AGOrdinaireData): Promise<Buffer | GenerationResult> {
  // Validations
  if (!data.denomination || !data.forme_juridique) {
    return {
      success: false,
      error: "Les informations de la société sont manquantes. Veuillez vérifier le nom de l'entreprise et la forme juridique dans la fiche client.",
    };
  }

  if (!data.date_ag || !data.heure_ag) {
    return {
      success: false,
      error: "La date et l'heure de l'assemblée générale sont requises. Veuillez remplir ces champs dans l'acte.",
    };
  }

  if (!data.exercice_clos) {
    return {
      success: false,
      error: "L'exercice clos est requis. Veuillez indiquer l'exercice concerné (ex: '2024').",
    };
  }

  if (data.resultat_exercice === null || data.resultat_exercice === undefined) {
    return {
      success: false,
      error: "Le résultat de l'exercice est requis. Veuillez indiquer le bénéfice ou la perte de l'exercice.",
    };
  }

  if (!data.affectation_resultat) {
    return {
      success: false,
      error: "L'affectation du résultat est requise. Veuillez sélectionner comment le résultat sera affecté (report à nouveau, réserves, dividendes ou mixte).",
    };
  }

  if (!data.president_nom || !data.president_prenom) {
    return {
      success: false,
      error: "Les informations du président sont manquantes. Veuillez remplir les champs 'Président (nom)' et 'Président (prénom)' dans la fiche client.",
    };
  }

  if (!data.associes || data.associes.length === 0) {
    return {
      success: false,
      error: "Aucun associé trouvé pour cette société. Ajoutez au moins un associé dans la fiche client.",
    };
  }

  // Calculs
  const totalActions = data.associes.reduce((sum, a) => sum + a.nb_actions, 0);
  // Total des actions représentées (présents + représentés)
  const totalActionsRepresentees = data.associes.reduce((sum, a) => sum + a.nb_actions, 0);
  const pourcentageCapital = totalActions > 0 ? (totalActionsRepresentees / totalActions) * 100 : 0;

  // Validation des votes
  const totalVotes = data.votes_pour_comptes + data.votes_contre_comptes + data.votes_abstention_comptes;
  if (totalVotes !== totalActionsRepresentees) {
    return {
      success: false,
      error: `Le total des votes (${totalVotes}) ne correspond pas au nombre d'actions représentées (${totalActionsRepresentees}). Modifiez l'acte pour corriger les votes.`,
    };
  }

  const estBenefice = data.resultat_exercice >= 0;
  const montantAbsolu = Math.abs(data.resultat_exercice);

  // Calcul du montant par action si dividendes
  let montantParAction = 0;
  if (data.affectation_resultat === "dividendes" || data.affectation_resultat === "mixte") {
    if (data.montant_dividendes && totalActions > 0) {
      montantParAction = data.montant_dividendes / totalActions;
    }
  }

  const ville = extractVille(data.siege_social);
  
  // Calcul de l'heure de clôture (2h après le début)
  let heureCloture = data.heure_ag;
  const matchHeure = data.heure_ag.match(/(\d{1,2})h(\d{2})?/);
  if (matchHeure) {
    const heure = parseInt(matchHeure[1]) + 2;
    const minutes = matchHeure[2] || "00";
    heureCloture = `${heure.toString().padStart(2, "0")}h${minutes}`;
  }

  // Construction du document
  const children: Paragraph[] = [];

  // Titre principal
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 400,
      },
      children: [
        new TextRun({
          text: "PROCÈS-VERBAL D'ASSEMBLÉE GÉNÉRALE ORDINAIRE",
          bold: true,
          size: 32, // 16pt
        }),
      ],
    })
  );

  // Section Société
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: {
        before: 200,
        after: 200,
      },
      children: [
        new TextRun({
          text: "SOCIÉTÉ",
          bold: true,
          size: 28, // 14pt
          allCaps: true,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Dénomination sociale : ${data.denomination}`,
          size: 22, // 11pt
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Forme juridique : ${data.forme_juridique}`,
          size: 22,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Capital social : ${formatMontant(data.capital_social)} €`,
          size: 22,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Siège social : ${data.siege_social}`,
          size: 22,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `RCS : ${data.rcs}`,
          size: 22,
        }),
      ],
    })
  );

  // Section Date, heure, lieu
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: {
        before: 400,
        after: 200,
      },
      children: [
        new TextRun({
          text: "DATE, HEURE ET LIEU",
          bold: true,
          size: 28,
          allCaps: true,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `L'Assemblée Générale Ordinaire de la société ${data.denomination} s'est réunie le ${data.date_ag} à ${data.heure_ag} ${data.lieu_ag}.`,
          size: 22,
        }),
      ],
    })
  );

  // Section Présents / Représentés
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: {
        before: 400,
        after: 200,
      },
      children: [
        new TextRun({
          text: "PRÉSENTS / REPRÉSENTÉS",
          bold: true,
          size: 28,
          allCaps: true,
        }),
      ],
    })
  );

  data.associes.forEach((associe) => {
    const statut = associe.present ? "Présent" : "Représenté";
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `- ${associe.prenom} ${associe.nom} : ${associe.nb_actions} action${associe.nb_actions > 1 ? "s" : ""} (${statut})`,
            size: 22,
          }),
        ],
      })
    );
  });

  children.push(
    new Paragraph({
      spacing: {
        before: 200,
      },
      children: [
        new TextRun({
          text: `Total des actions représentées : ${totalActionsRepresentees} sur ${totalActions} (${formatMontant(pourcentageCapital)}% du capital social).`,
          size: 22,
          bold: true,
        }),
      ],
    })
  );

  // Section Présidence
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: {
        before: 400,
        after: 200,
      },
      children: [
        new TextRun({
          text: "PRÉSIDENCE",
          bold: true,
          size: 28,
          allCaps: true,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `L'assemblée est présidée par ${data.president_prenom} ${data.president_nom}, Président de la société.`,
          size: 22,
        }),
      ],
    })
  );

  // Section Ordre du jour
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: {
        before: 400,
        after: 200,
      },
      children: [
        new TextRun({
          text: "ORDRE DU JOUR",
          bold: true,
          size: 28,
          allCaps: true,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "1. Approbation des comptes de l'exercice clos le " + data.exercice_clos,
          size: 22,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "2. Affectation du résultat",
          size: 22,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "3. Quitus au Président",
          size: 22,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "4. Pouvoirs pour les formalités",
          size: 22,
        }),
      ],
    })
  );

  // Section Résolutions
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: {
        before: 400,
        after: 200,
      },
      children: [
        new TextRun({
          text: "RÉSOLUTIONS",
          bold: true,
          size: 28,
          allCaps: true,
        }),
      ],
    })
  );

  // Première résolution - Approbation des comptes
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: {
        before: 200,
        after: 200,
      },
      children: [
        new TextRun({
          text: "PREMIÈRE RÉSOLUTION - Approbation des comptes",
          bold: true,
          size: 24, // 12pt
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: {
        after: 200,
      },
      children: [
        new TextRun({
          text: "L'Assemblée Générale, après avoir pris connaissance :",
          size: 22,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "- Du rapport de gestion du Président,",
          size: 22,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `- Des comptes annuels (bilan, compte de résultat et annexes) de l'exercice clos le ${data.exercice_clos},`,
          size: 22,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: {
        before: 200,
        after: 200,
      },
      children: [
        new TextRun({
          text: `Constate que l'exercice fait apparaître un ${estBenefice ? "bénéfice" : "perte"} de ${formatMontant(montantAbsolu)} €.`,
          size: 22,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: {
        after: 200,
      },
      children: [
        new TextRun({
          text: `APPROUVE les comptes annuels de l'exercice clos le ${data.exercice_clos} tels qu'ils ont été présentés.`,
          size: 22,
          bold: true,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: {
        before: 200,
        after: 200,
      },
      children: [
        new TextRun({
          text: `Votes : POUR ${data.votes_pour_comptes} - CONTRE ${data.votes_contre_comptes} - ABSTENTION ${data.votes_abstention_comptes}`,
          size: 22,
        }),
      ],
    })
  );

  const resolutionAdoptee = data.votes_pour_comptes > data.votes_contre_comptes;
  children.push(
    new Paragraph({
      spacing: {
        after: 400,
      },
      children: [
        new TextRun({
          text: `La résolution est ${resolutionAdoptee ? "ADOPTÉE" : "REJETÉE"}.`,
          size: 22,
          bold: true,
        }),
      ],
    })
  );

  // Deuxième résolution - Affectation du résultat
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: {
        before: 200,
        after: 200,
      },
      children: [
        new TextRun({
          text: "DEUXIÈME RÉSOLUTION - Affectation du résultat",
          bold: true,
          size: 24,
        }),
      ],
    })
  );

  if (estBenefice) {
    switch (data.affectation_resultat) {
      case "report_nouveau":
        children.push(
          new Paragraph({
            spacing: {
              after: 200,
            },
            children: [
              new TextRun({
                text: `DÉCIDE d'affecter l'intégralité du bénéfice (${formatMontant(montantAbsolu)} €) au compte 'Report à nouveau'.`,
                size: 22,
                bold: true,
              }),
            ],
          })
        );
        break;

      case "reserves":
        children.push(
          new Paragraph({
            spacing: {
              after: 200,
            },
            children: [
              new TextRun({
                text: `DÉCIDE d'affecter l'intégralité du bénéfice (${formatMontant(montantAbsolu)} €) au compte 'Réserves'.`,
                size: 22,
                bold: true,
              }),
            ],
          })
        );
        break;

      case "dividendes":
        if (!data.montant_dividendes) {
          throw new Error("Le montant des dividendes est requis pour cette affectation.");
        }
        children.push(
          new Paragraph({
            spacing: {
              after: 200,
            },
            children: [
              new TextRun({
                text: `DÉCIDE de distribuer ${formatMontant(data.montant_dividendes)} € aux associés au titre de dividendes, soit ${formatMontant(montantParAction)} € par action.`,
                size: 22,
                bold: true,
              }),
            ],
          })
        );
        break;

      case "mixte":
        const details: string[] = [];
        if (data.montant_dividendes) {
          details.push(`${formatMontant(data.montant_dividendes)} € au titre de dividendes`);
        }
        if (data.montant_reserves) {
          details.push(`${formatMontant(data.montant_reserves)} € au compte 'Réserves'`);
        }
        if (data.montant_report) {
          details.push(`${formatMontant(data.montant_report)} € au compte 'Report à nouveau'`);
        }
        children.push(
          new Paragraph({
            spacing: {
              after: 200,
            },
            children: [
              new TextRun({
                text: `DÉCIDE d'affecter le bénéfice comme suit : ${details.join(", ")}.`,
                size: 22,
                bold: true,
              }),
            ],
          })
        );
        break;
    }
  } else {
    children.push(
      new Paragraph({
        spacing: {
          after: 200,
        },
        children: [
          new TextRun({
            text: `DÉCIDE d'affecter la perte de ${formatMontant(montantAbsolu)} € au compte 'Report à nouveau'.`,
            size: 22,
            bold: true,
          }),
        ],
      })
    );
  }

  // Troisième résolution - Quitus au Président
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: {
        before: 200,
        after: 200,
      },
      children: [
        new TextRun({
          text: "TROISIÈME RÉSOLUTION - Quitus au Président",
          bold: true,
          size: 24,
        }),
      ],
    })
  );

  if (data.quitus_president) {
    children.push(
      new Paragraph({
        spacing: {
          after: 200,
        },
        children: [
          new TextRun({
            text: "DONNE quitus au Président pour sa gestion durant l'exercice écoulé.",
            size: 22,
            bold: true,
          }),
        ],
      })
    );
  } else {
    children.push(
      new Paragraph({
        spacing: {
          after: 200,
        },
        children: [
          new TextRun({
            text: "REFUSE de donner quitus au Président.",
            size: 22,
            bold: true,
          }),
        ],
      })
    );
  }

  // Quatrième résolution - Pouvoirs
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: {
        before: 200,
        after: 200,
      },
      children: [
        new TextRun({
          text: "QUATRIÈME RÉSOLUTION - Pouvoirs",
          bold: true,
          size: 24,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: {
        after: 400,
      },
      children: [
        new TextRun({
          text: "DONNE tous pouvoirs au Président pour accomplir les formalités légales.",
          size: 22,
          bold: true,
        }),
      ],
    })
  );

  // Section Clôture
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: {
        before: 400,
        after: 200,
      },
      children: [
        new TextRun({
          text: "CLÔTURE",
          bold: true,
          size: 28,
          allCaps: true,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: {
        after: 400,
      },
      children: [
        new TextRun({
          text: `L'ordre du jour étant épuisé, la séance est levée à ${heureCloture}.`,
          size: 22,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: {
        before: 400,
        after: 600,
      },
      children: [
        new TextRun({
          text: `Fait à ${ville || "Paris"}, le ${data.date_ag}`,
          size: 22,
        }),
      ],
    })
  );

  // Signatures
  children.push(
    new Paragraph({
      spacing: {
        before: 600,
        after: 200,
      },
      children: [
        new TextRun({
          text: "Signatures :",
          size: 22,
          bold: true,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: {
        before: 400,
        after: 200,
      },
      children: [
        new TextRun({
          text: "Le Président,",
          size: 22,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: {
        before: 200,
        after: 400,
      },
      children: [
        new TextRun({
          text: `${data.president_prenom} ${data.president_nom}`,
          size: 22,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: {
        before: 400,
        after: 200,
      },
      children: [
        new TextRun({
          text: "Les Associés,",
          size: 22,
        }),
      ],
    })
  );

  // Espace pour signatures des associés
  data.associes.forEach((associe) => {
    children.push(
      new Paragraph({
        spacing: {
          before: 200,
          after: 200,
        },
        children: [
          new TextRun({
            text: `${associe.prenom} ${associe.nom}`,
            size: 22,
          }),
        ],
      })
    );
  });

  // Création du document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 2.5cm
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  // Génération du buffer
  try {
    const buffer = await Packer.toBuffer(doc);
    return { success: true, buffer };
  } catch (error: any) {
    return {
      success: false,
      error: `Erreur technique lors de la génération du document Word : ${error.message}. Veuillez réessayer ou contacter le support.`,
    };
  }
}


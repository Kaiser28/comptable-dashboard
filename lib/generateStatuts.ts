import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx";

export interface ClientData {
  nom_entreprise: string;
  objet_social: string;
  adresse_siege: any;
  capital_social: number;
  nb_actions: number;
  montant_libere: number;
  duree_societe: number;
  date_cloture_exercice?: string;
  date_creation?: string;
}

export interface AssocieData {
  civilite: string;
  prenom: string;
  nom: string;
  date_naissance?: string;
  lieu_naissance?: string;
  adresse: any;
}

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

function calculerPremierExerciceFin(dateCreation: string | undefined, dateCloture: string | undefined): string {
  if (!dateCloture) dateCloture = "31/12";
  const creation = dateCreation ? new Date(dateCreation) : new Date();
  const [jour, mois] = dateCloture.split("/");
  let annee = creation.getFullYear();
  const cloture = new Date(annee, parseInt(mois) - 1, parseInt(jour));
  if (cloture < creation) annee++;
  return formatDate(new Date(annee, parseInt(mois) - 1, parseInt(jour)).toISOString());
}

export async function generateStatuts(client: ClientData, associes: AssocieData[]): Promise<Buffer> {
  if (!associes || associes.length === 0) throw new Error("Aucun associé trouvé");

  const associe = associes[0];
  const formeJuridique = getFormeJuridique(associes.length);
  const adresseSiege = formatAdresse(client.adresse_siege);
  const adresseAssocie = formatAdresse(associe.adresse);
  const valeurNominale = client.capital_social / client.nb_actions;
  const dateSignature = formatDate(undefined);
  const premierExerciceFin = calculerPremierExerciceFin(client.date_creation, client.date_cloture_exercice);

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "STATUTS",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: "Société par Actions Simplifiée",
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Les soussignés :", bold: true })] }),
          new Paragraph({ text: `${associe.civilite} ${associe.prenom} ${associe.nom}` }),
          new Paragraph({ text: `Né(e) le ${associe.date_naissance || "Non renseigné"} à ${associe.lieu_naissance || "Non renseigné"}` }),
          new Paragraph({ text: `Demeurant ${adresseAssocie}` }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "Ont établi ainsi qu'il suit les statuts d'une société par actions simplifiée qu'ils conviennent de constituer entre eux." }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "TITRE I : FORME - DÉNOMINATION - SIÈGE - OBJET - DURÉE", bold: true })] }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 1 - Forme", bold: true })] }),
          new Paragraph({ text: `Il est formé entre les soussignés et ceux qui deviendront ultérieurement associés une ${formeJuridique.complete} (${formeJuridique.sigle}), régie par les dispositions législatives et réglementaires en vigueur ainsi que par les présents statuts.` }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 2 - Dénomination", bold: true })] }),
          new Paragraph({ text: `La société a pour dénomination sociale : ${client.nom_entreprise}.` }),
          new Paragraph({ text: `Dans tous les actes et documents émanant de la société et destinés aux tiers, la dénomination sociale doit être précédée ou suivie immédiatement des mots "${formeJuridique.complete}" ou du sigle "${formeJuridique.sigle}" ainsi que de l'indication du montant du capital social.` }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 3 - Siège social", bold: true })] }),
          new Paragraph({ text: `Le siège social est fixé : ${adresseSiege}.` }),
          new Paragraph({ text: "Il peut être transféré en tout autre endroit par décision du président, sous réserve de ratification par la collectivité des associés dans les conditions prévues par la loi et les présents statuts." }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 4 - Objet", bold: true })] }),
          new Paragraph({ text: "La société a pour objet :" }),
          new Paragraph({ text: client.objet_social || "Objet social non renseigné" }),
          new Paragraph({ text: "Et plus généralement, toutes opérations industrielles, commerciales, financières, mobilières ou immobilières pouvant se rattacher directement ou indirectement à l'objet social ou susceptibles d'en faciliter la réalisation, le développement ou la continuité." }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 5 - Durée", bold: true })] }),
          new Paragraph({ text: `La durée de la société est fixée à ${client.duree_societe} années à compter de son immatriculation au Registre du Commerce et des Sociétés, sauf prorogation ou dissolution anticipée décidée conformément aux statuts.` }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "TITRE II : APPORTS - CAPITAL SOCIAL", bold: true })] }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 6 - Apports", bold: true })] }),
          new Paragraph({ text: `Les associés font apport à la société d'une somme totale de ${formatMontant(client.capital_social)} euros en numéraire.` }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 7 - Capital social", bold: true })] }),
          new Paragraph({ text: `Le capital social est fixé à ${formatMontant(client.capital_social)} euros.` }),
          new Paragraph({ text: `Il est divisé en ${client.nb_actions} actions de ${formatMontant(valeurNominale)} euros chacune, intégralement souscrites et libérées à hauteur de ${formatMontant(client.montant_libere)} euros, le solde devant être libéré dans les conditions prévues par la loi.` }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 8 - Modification du capital", bold: true })] }),
          new Paragraph({ text: "Le capital social peut être augmenté, réduit ou amorti dans les conditions prévues par la loi et les présents statuts." }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 9 - Forme des actions", bold: true })] }),
          new Paragraph({ text: "Les actions sont nominatives et donnent lieu à une inscription en compte conformément à la réglementation en vigueur. Les attestations d'inscription valent titres au regard des tiers." }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 10 - Transmission des actions", bold: true })] }),
          new Paragraph({ text: "Les actions sont librement cessibles entre associés. Toute cession à un tiers non associé est soumise à l'agrément préalable de la collectivité des associés dans les conditions de majorité prévues par les présents statuts." }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "TITRE III : DIRECTION", bold: true })] }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 11 - Présidence", bold: true })] }),
          new Paragraph({ text: "La société est représentée et dirigée par un président." }),
          new Paragraph({ text: `Le premier président est : ${associe.civilite} ${associe.prenom} ${associe.nom}, nommé pour une durée illimitée. Il peut être révoqué dans les conditions prévues par la loi et les présents statuts.` }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 12 - Pouvoirs du président", bold: true })] }),
          new Paragraph({ text: "Le président est investi des pouvoirs les plus étendus pour agir en toute circonstance au nom de la société, dans la limite de l'objet social et sous réserve des pouvoirs expressément attribués par la loi ou les statuts à la collectivité des associés." }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 13 - Rémunération", bold: true })] }),
          new Paragraph({ text: "La collectivité des associés fixe et, le cas échéant, modifie la rémunération du président. Celle-ci peut comprendre une partie fixe et/ou une partie variable." }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "TITRE IV : DÉCISIONS COLLECTIVES", bold: true })] }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 14 - Assemblées générales", bold: true })] }),
          new Paragraph({ text: "Les associés sont réunis en assemblée générale aussi souvent que l'intérêt de la société l'exige et au moins une fois par an pour l'approbation des comptes de l'exercice." }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 15 - Convocation", bold: true })] }),
          new Paragraph({ text: "Les assemblées sont convoquées par le président par lettre simple, courrier électronique ou tout autre moyen écrit, au moins sept jours avant la date de réunion, sauf délai différent prévu par la loi." }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 16 - Quorum et majorité", bold: true })] }),
          new Paragraph({ text: "Chaque action donne droit à une voix. Sauf dispositions légales contraires, les décisions sont prises à la majorité simple des voix exprimées par les associés présents ou représentés." }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "TITRE V : EXERCICE SOCIAL - COMPTES", bold: true })] }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 17 - Exercice social", bold: true })] }),
          new Paragraph({ text: "L'exercice social commence le 1er janvier et se termine le 31 décembre de chaque année." }),
          new Paragraph({ text: `Par exception, le premier exercice social se terminera le ${premierExerciceFin}.` }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 18 - Comptes annuels", bold: true })] }),
          new Paragraph({ text: "À la clôture de chaque exercice, le président établit l'inventaire, les comptes annuels et le rapport de gestion. Les comptes sont soumis à l'approbation de la collectivité des associés." }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 19 - Affectation du résultat", bold: true })] }),
          new Paragraph({ text: "Le bénéfice distribuable est réparti entre les associés proportionnellement au nombre d'actions détenues, sauf décision contraire de l'assemblée générale prise dans les limites fixées par la loi." }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "TITRE VI : DISSOLUTION - LIQUIDATION", bold: true })] }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 20 - Dissolution", bold: true })] }),
          new Paragraph({ text: "La société prend fin par l'arrivée du terme, par décision de la collectivité des associés réunis en assemblée générale extraordinaire ou pour toute autre cause prévue par la loi." }),
          new Paragraph({ text: "" }),

          new Paragraph({ children: [new TextRun({ text: "Article 21 - Liquidation", bold: true })] }),
          new Paragraph({ text: "En cas de dissolution, la collectivité des associés désigne un ou plusieurs liquidateurs dont elle détermine les pouvoirs. Les liquidateurs disposent des pouvoirs les plus étendus pour réaliser l'actif, acquitter le passif et répartir le solde conformément à la loi." }),
          new Paragraph({ text: "" }),

          new Paragraph({ text: "", pageBreakBefore: true }),
          new Paragraph({ children: [new TextRun({ text: `Fait à ${adresseSiege}, le ${dateSignature}`, bold: true })] }),
          new Paragraph({ children: [new TextRun({ text: "Signature :", bold: true })] }),
          new Paragraph({ text: `${associe.prenom} ${associe.nom}` }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
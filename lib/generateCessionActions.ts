import { Document, Packer, Paragraph, TextRun, AlignmentType, PageNumber, Footer, NumberFormat, Header, BorderStyle } from "docx";
import type { ActeJuridiqueData, ClientData, CabinetData, AssocieData } from "./types/database";

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
 * Formate un montant en euros avec séparateurs de milliers
 */
function formatMontant(montant: number | null | undefined): string {
  if (!montant) return "0";
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(montant);
}

/**
 * Convertit un nombre en lettres (français)
 * Version simplifiée pour les montants en euros
 */
function nombreEnLettres(nombre: number): string {
  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
    'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
  
  const entier = Math.floor(nombre);
  const decimales = Math.round((nombre - entier) * 100);
  
  if (entier === 0 && decimales === 0) return 'zéro euro';
  
  let resultat = '';
  let reste = entier;
  
  // Gestion des millions
  if (reste >= 1000000) {
    const millions = Math.floor(reste / 1000000);
    resultat += convertirNombre(millions) + ' million' + (millions > 1 ? 's' : '') + ' ';
    reste = reste % 1000000;
  }
  
  // Gestion des milliers
  if (reste >= 1000) {
    const milliers = Math.floor(reste / 1000);
    if (milliers === 1) {
      resultat += 'mille ';
    } else {
      resultat += convertirNombre(milliers) + ' mille ';
    }
    reste = reste % 1000;
  }
  
  // Gestion des centaines
  if (reste >= 100) {
    const centaines = Math.floor(reste / 100);
    if (centaines === 1) {
      resultat += 'cent ';
    } else {
      resultat += unites[centaines] + ' cent' + (centaines > 1 && reste % 100 === 0 ? 's' : '') + ' ';
    }
    reste = reste % 100;
  }
  
  // Gestion des dizaines et unités
  if (reste >= 20) {
    const dizaine = Math.floor(reste / 10);
    const unite = reste % 10;
    
    if (dizaine === 7 || dizaine === 9) {
      // Soixante-dix, quatre-vingt-dix
      const base = dizaine === 7 ? 60 : 80;
      const resteUnite = reste - base;
      resultat += dizaines[Math.floor(base / 10)] + (resteUnite > 0 ? '-' + unites[resteUnite] : '');
    } else {
      resultat += dizaines[dizaine];
      if (unite > 0) {
        resultat += (dizaine === 8 ? '-' : ' ') + unites[unite];
      } else if (dizaine === 8) {
        resultat += 's';
      }
    }
  } else if (reste > 0) {
    resultat += unites[reste];
  }
  
  // Ajout des centimes
  if (decimales > 0) {
    resultat += ' euro' + (entier > 1 ? 's' : '') + ' et ' + convertirNombre(decimales) + ' centime' + (decimales > 1 ? 's' : '');
  } else {
    resultat += ' euro' + (entier > 1 ? 's' : '');
  }
  
  return resultat.trim();
}

function convertirNombre(n: number): string {
  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
    'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
  
  if (n === 0) return 'zéro';
  if (n < 20) return unites[n];
  
  const dizaine = Math.floor(n / 10);
  const unite = n % 10;
  
  if (dizaine === 7 || dizaine === 9) {
    const base = dizaine === 7 ? 60 : 80;
    const reste = n - base;
    return dizaines[Math.floor(base / 10)] + (reste > 0 ? '-' + unites[reste] : '');
  }
  
  let result = dizaines[dizaine];
  if (unite > 0) {
    result += (dizaine === 8 ? '-' : ' ') + unites[unite];
  } else if (dizaine === 8) {
    result += 's';
  }
  
  return result;
}

/**
 * Extrait la ville depuis une adresse (string ou objet)
 */
function extractVille(adresse: string | { ville?: string } | null | undefined): string {
  if (!adresse) return "";
  if (typeof adresse === "string") {
    const parts = adresse.split(',').map(s => s.trim());
    return parts[parts.length - 1] || "";
  }
  return adresse.ville || "";
}

/**
 * Formate une adresse complète
 */
function formatAdresse(adresse: any): string {
  if (!adresse) return "";
  if (typeof adresse === "string") return adresse;
  const parts = [
    adresse.numero_voie,
    adresse.type_voie,
    adresse.nom_voie || adresse.libelle_voie,
    adresse.code_postal,
    adresse.ville
  ].filter(Boolean);
  return parts.join(" ");
}

/**
 * Génère un acte de cession d'actions professionnel
 * 
 * @param acte - Données de l'acte juridique
 * @param client - Données du client
 * @param cabinet - Données du cabinet
 * @param cedant - Données de l'associé cédant
 * @returns Buffer du document Word généré
 * @throws Error si les données requises sont manquantes
 */
export async function generateCessionActions(
  acte: ActeJuridiqueData,
  client: ClientData,
  cabinet: CabinetData,
  cedant: AssocieData
): Promise<Buffer> {
  // Validations des données requises
  if (acte.type !== 'cession_actions') {
    throw new Error("Ce générateur ne peut être utilisé que pour les actes de cession d'actions");
  }

  if (!acte.cessionnaire_nom || !acte.cessionnaire_prenom) {
    throw new Error("Le nom et prénom du cessionnaire sont requis");
  }

  if (!acte.nombre_actions || acte.nombre_actions <= 0) {
    throw new Error("Le nombre d'actions cédées doit être supérieur à zéro");
  }

  if (!acte.prix_unitaire || acte.prix_unitaire <= 0) {
    throw new Error("Le prix unitaire doit être supérieur à zéro");
  }

  if (!acte.prix_total || acte.prix_total <= 0) {
    throw new Error("Le prix total doit être supérieur à zéro");
  }

  if (!client.nom_entreprise) {
    throw new Error("Le nom de l'entreprise est requis");
  }

  if (!client.siret) {
    throw new Error("Le numéro SIRET est requis");
  }

  if (!cedant.nom || !cedant.prenom) {
    throw new Error("Les données du cédant sont incomplètes");
  }

  // Variables dynamiques
  const nomCabinet = cabinet.nom;
  const adresseCabinet = cabinet.adresse || "";
  const villeCabinet = extractVille(cabinet.adresse) || "Ville";
  const dateActe = formatDate(acte.date_acte);
  
  const nomEntreprise = client.nom_entreprise;
  const siret = client.siret;
  const capitalSocial = client.capital_social || 0;
  // Calcul de la valeur nominale : capital_social / nombre d'actions
  // Valeur par défaut de 1€ si les données ne sont pas disponibles
  const valeurNominale = (client.nb_actions && client.nb_actions > 0 && capitalSocial > 0)
    ? capitalSocial / client.nb_actions
    : 1;
  
  const cedantCivilite = cedant.civilite || "M.";
  const cedantNom = cedant.nom;
  const cedantPrenom = cedant.prenom;
  const cedantDateNaissance = formatDate(cedant.date_naissance);
  const cedantLieuNaissance = cedant.lieu_naissance || "";
  const cedantNationalite = cedant.nationalite || "";
  const cedantAdresse = formatAdresse(cedant.adresse) || "";
  
  const cessionnaireCivilite = "M."; // Par défaut, peut être ajusté
  const cessionnaireNom = acte.cessionnaire_nom;
  const cessionnairePrenom = acte.cessionnaire_prenom;
  const cessionnaireAdresse = acte.cessionnaire_adresse || "";
  const cessionnaireNationalite = acte.cessionnaire_nationalite || "";
  
  const nombreActions = acte.nombre_actions;
  const prixUnitaire = acte.prix_unitaire;
  const prixTotal = acte.prix_total;
  const prixTotalLettres = nombreEnLettres(prixTotal);
  const dateAgrement = acte.date_agrement ? formatDate(acte.date_agrement) : "";
  const modalitesPaiement = acte.modalites_paiement || "Non spécifiées";

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
                    text: `ACTE DE CESSION D'ACTIONS - ${nomEntreprise}`,
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
          // Titre principal
          new Paragraph({
            children: [
              new TextRun({
                text: "ACTE DE CESSION D'ACTIONS",
                bold: true,
                size: 16 * 2,
                font: "Arial",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 360 },
          }),

          // Section ENTRE LES SOUSSIGNÉS
          new Paragraph({
            children: [
              new TextRun({
                text: "ENTRE LES SOUSSIGNÉS",
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
                text: "LE CÉDANT :",
                bold: true,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `${cedantCivilite} ${cedantPrenom} ${cedantNom}, né le ${cedantDateNaissance} à ${cedantLieuNaissance}, de nationalité ${cedantNationalite}, demeurant ${cedantAdresse}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 240 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "LE CESSIONNAIRE :",
                bold: true,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `${cessionnaireCivilite} ${cessionnairePrenom} ${cessionnaireNom}${cessionnaireNationalite ? `, de nationalité ${cessionnaireNationalite}` : ''}, demeurant ${cessionnaireAdresse || 'Adresse non renseignée'}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 360 },
          }),

          // Section PRÉAMBULE
          new Paragraph({
            children: [
              new TextRun({
                text: "PRÉAMBULE",
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
                text: `Il est rappelé que le Cédant détient ${nombreActions} action${nombreActions > 1 ? 's' : ''} de ${formatMontant(valeurNominale)}€ chacune de valeur nominale dans la société ${nomEntreprise}, immatriculée au RCS sous le numéro ${siret}, au capital social de ${formatMontant(capitalSocial)}€.`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 360 },
          }),

          // Section ARTICLE 1 - CESSION
          new Paragraph({
            children: [
              new TextRun({
                text: "ARTICLE 1 - CESSION",
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
                text: `Le Cédant cède au Cessionnaire ${nombreActions} action${nombreActions > 1 ? 's' : ''} au prix unitaire de ${formatMontant(prixUnitaire)}€, soit un prix total de ${formatMontant(prixTotal)}€ (${prixTotalLettres}).`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 360 },
          }),

          // Section ARTICLE 2 - AGRÉMENT
          new Paragraph({
            children: [
              new TextRun({
                text: "ARTICLE 2 - AGRÉMENT",
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
                text: dateAgrement 
                  ? `L'agrément des autres associés a été obtenu en date du ${dateAgrement}.`
                  : "L'agrément des autres associés a été obtenu conformément aux dispositions statutaires.",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 360 },
          }),

          // Section ARTICLE 3 - PAIEMENT
          new Paragraph({
            children: [
              new TextRun({
                text: "ARTICLE 3 - PAIEMENT",
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
                text: `Le paiement du prix de cession s'effectuera selon les modalités suivantes : ${modalitesPaiement}.`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 360 },
          }),

          // Section ARTICLE 4 - TRANSFERT DE PROPRIÉTÉ
          new Paragraph({
            children: [
              new TextRun({
                text: "ARTICLE 4 - TRANSFERT DE PROPRIÉTÉ",
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
                text: "Le transfert de propriété des actions cédées sera effectif à compter de la date de signature du présent acte. Le Cessionnaire bénéficiera de tous les droits attachés aux actions cédées, notamment le droit aux dividendes et le droit de vote, à compter de cette date.",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 360 },
          }),

          // Signatures
          new Paragraph({
            children: [
              new TextRun({
                text: `Fait à ${villeCabinet}, le ${dateActe}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { before: 480, after: 480 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "LE CÉDANT",
                bold: true,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 240 },
          }),

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
                text: `${cedantCivilite} ${cedantPrenom} ${cedantNom}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 360 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "LE CESSIONNAIRE",
                bold: true,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 240 },
          }),

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
                text: `${cessionnaireCivilite} ${cessionnairePrenom} ${cessionnaireNom}`,
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


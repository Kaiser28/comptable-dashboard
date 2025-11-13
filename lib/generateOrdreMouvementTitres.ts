import { Document, Packer, Paragraph, TextRun, AlignmentType, PageNumber, Footer, NumberFormat, Header, BorderStyle, Table, TableRow, TableCell, WidthType } from "docx";
import type { ActeJuridiqueData, ClientData, CabinetData, AssocieData } from "./types/database";
import { nombreEnLettres } from "./utils/nombreEnLettres";

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
 * Génère un Ordre de Mouvement de Titres (OMT) professionnel
 * Document juridiquement obligatoire pour l'inscription au registre des mouvements de titres
 * 
 * @param acte - Données de l'acte juridique avec relations (cedant, client)
 * @param cabinet - Données du cabinet
 * @returns Buffer du document Word généré
 * @throws Error si les données requises sont manquantes
 */
export async function generateOrdreMouvementTitres(
  acte: ActeJuridiqueData & { cedant: AssocieData; client: ClientData },
  cabinet: CabinetData
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

  if (!acte.client.nom_entreprise) {
    throw new Error("Le nom de l'entreprise est requis");
  }

  if (!acte.client.siret) {
    throw new Error("Le numéro SIRET est requis");
  }

  if (!acte.cedant.nom || !acte.cedant.prenom) {
    throw new Error("Les données du cédant sont incomplètes");
  }

  // Variables dynamiques
  const nomCabinet = cabinet.nom;
  const adresseCabinet = cabinet.adresse || "";
  const villeCabinet = extractVille(cabinet.adresse) || "Ville";
  const dateActe = formatDate(acte.date_acte);
  
  const client = acte.client;
  const cedant = acte.cedant;
  
  const nomEntreprise = client.nom_entreprise;
  const formeJuridique = client.forme_juridique || "";
  const capitalSocial = client.capital_social || 0;
  const adresseSiege = formatAdresse(client.adresse_siege || client.adresse) || "Non renseignée";
  const siret = client.siret;
  const villeRCS = extractVille(client.adresse_siege || client.adresse) || "Ville";
  
  // Calcul de la valeur nominale
  const valeurNominale = (client.nb_actions && client.nb_actions > 0 && capitalSocial > 0)
    ? capitalSocial / client.nb_actions
    : 1;
  
  const cedantNumeroActionnaire = (cedant as any).numero_actionnaire || "À attribuer";
  const cedantCivilite = cedant.civilite || "M.";
  const cedantNom = cedant.nom;
  const cedantPrenom = cedant.prenom;
  const cedantDateNaissance = formatDate(cedant.date_naissance);
  const cedantLieuNaissance = cedant.lieu_naissance || "";
  const cedantNationalite = cedant.nationalite || "";
  const cedantAdresse = formatAdresse(cedant.adresse) || "";
  
  const cessionnaireCivilite = acte.cessionnaire_civilite || "M.";
  const cessionnaireNom = acte.cessionnaire_nom;
  const cessionnairePrenom = acte.cessionnaire_prenom;
  const cessionnaireAdresse = acte.cessionnaire_adresse || "";
  const cessionnaireNationalite = acte.cessionnaire_nationalite || "";
  
  const nombreActions = acte.nombre_actions;
  const prixUnitaire = acte.prix_unitaire;
  const prixTotal = acte.prix_total;
  
  // Convertir le nombre d'actions en lettres (sans "euros")
  function nombreActionsEnLettres(n: number): string {
    const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
      'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
    
    if (n === 0) return 'zéro';
    if (n < 20) return unites[n];
    
    let reste = n;
    let resultat = '';
    
    // Gestion des milliers
    if (reste >= 1000) {
      const milliers = Math.floor(reste / 1000);
      if (milliers === 1) {
        resultat += 'mille ';
      } else {
        resultat += convertirNombreSimple(milliers) + ' mille ';
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
    
    return resultat.trim();
  }
  
  function convertirNombreSimple(n: number): string {
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
  
  const nombreActionsLettres = nombreActionsEnLettres(nombreActions);

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
            margin: {
              top: 1440, // 2.5cm en twips (1cm = 567 twips)
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `ORDRE DE MOUVEMENT DE TITRES - ${nomEntreprise}`,
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
                text: "ORDRE DE MOUVEMENT DE TITRES",
                bold: true,
                size: 16 * 2, // 16pt en half-points
                font: "Arial",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 480 },
          }),

          // Section SOCIÉTÉ ÉMETTRICE
          new Paragraph({
            children: [
              new TextRun({
                text: "SOCIÉTÉ ÉMETTRICE",
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
                text: `Dénomination sociale : ${nomEntreprise}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          ...(formeJuridique ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Forme juridique : ${formeJuridique}`,
                  size: 11 * 2,
                  font: "Arial",
                }),
              ],
              spacing: { after: 120 },
            }),
          ] : []),

          new Paragraph({
            children: [
              new TextRun({
                text: `Capital social : ${formatMontant(capitalSocial)}€`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Siège social : ${adresseSiege}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `SIRET : ${siret}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `RCS : ${villeRCS} ${siret}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 360 },
          }),

          // Section PROPRIÉTAIRE ACTUEL (CÉDANT)
          new Paragraph({
            children: [
              new TextRun({
                text: "PROPRIÉTAIRE ACTUEL (CÉDANT)",
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
                text: `N° d'actionnaire : ${cedantNumeroActionnaire}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Civilité : ${cedantCivilite}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Nom : ${cedantNom}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Prénom : ${cedantPrenom}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          ...(cedantDateNaissance ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Date de naissance : ${cedantDateNaissance}`,
                  size: 11 * 2,
                  font: "Arial",
                }),
              ],
              spacing: { after: 120 },
            }),
          ] : []),

          ...(cedantLieuNaissance ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Lieu de naissance : ${cedantLieuNaissance}`,
                  size: 11 * 2,
                  font: "Arial",
                }),
              ],
              spacing: { after: 120 },
            }),
          ] : []),

          ...(cedantNationalite ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Nationalité : ${cedantNationalite}`,
                  size: 11 * 2,
                  font: "Arial",
                }),
              ],
              spacing: { after: 120 },
            }),
          ] : []),

          new Paragraph({
            children: [
              new TextRun({
                text: `Adresse : ${cedantAdresse}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 360 },
          }),

          // Section NOUVEAU PROPRIÉTAIRE (CESSIONNAIRE)
          new Paragraph({
            children: [
              new TextRun({
                text: "NOUVEAU PROPRIÉTAIRE (CESSIONNAIRE)",
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
                text: "N° d'actionnaire : Nouveau - à attribuer par la société",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Civilité : ${cessionnaireCivilite}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Nom : ${cessionnaireNom}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Prénom : ${cessionnairePrenom}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          ...(cessionnaireNationalite ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Nationalité : ${cessionnaireNationalite}`,
                  size: 11 * 2,
                  font: "Arial",
                }),
              ],
              spacing: { after: 120 },
            }),
          ] : []),

          new Paragraph({
            children: [
              new TextRun({
                text: `Adresse : ${cessionnaireAdresse}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 360 },
          }),

          // Section OPÉRATION
          new Paragraph({
            children: [
              new TextRun({
                text: "OPÉRATION",
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
                text: "Nature de l'opération : CESSION",
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Date de l'opération : ${dateActe}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Nombre d'actions transférées : ${nombreActions}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Valeur nominale unitaire : ${formatMontant(valeurNominale)}€`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Prix unitaire de cession : ${formatMontant(prixUnitaire)}€`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Prix total : ${formatMontant(prixTotal)}€`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { after: 360 },
          }),

          // MENTION MANUSCRITE (encadré) - Utilisation d'un tableau pour créer un encadré propre
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `BON POUR TRANSFERT DE ${nombreActionsLettres.toUpperCase()} (${nombreActions}) ACTION${nombreActions > 1 ? 'S' : ''}`,
                            bold: true,
                            size: 11 * 2,
                            font: "Arial",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 120 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `DE LA SOCIÉTÉ ${nomEntreprise.toUpperCase()}`,
                            bold: true,
                            size: 11 * 2,
                            font: "Arial",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 120 },
                      }),
                    ],
                    borders: {
                      top: {
                        color: "000000",
                        space: 1,
                        style: BorderStyle.SINGLE,
                        size: 6,
                      },
                      bottom: {
                        color: "000000",
                        space: 1,
                        style: BorderStyle.SINGLE,
                        size: 6,
                      },
                      left: {
                        color: "000000",
                        space: 1,
                        style: BorderStyle.SINGLE,
                        size: 6,
                      },
                      right: {
                        color: "000000",
                        space: 1,
                        style: BorderStyle.SINGLE,
                        size: 6,
                      },
                    },
                    shading: {
                      fill: "FFFFFF",
                    },
                  }),
                ],
              }),
            ],
            margins: {
              top: 240,
              bottom: 360,
            },
          }),

          // Section SIGNATURES
          new Paragraph({
            children: [
              new TextRun({
                text: `Fait à ${villeCabinet}, le ${dateActe}`,
                size: 11 * 2,
                font: "Arial",
              }),
            ],
            spacing: { before: 480, after: 360 },
          }),

          // Tableau des signatures (2 colonnes)
          new Table({
            columnWidths: [4535, 4535], // 50% chaque colonne
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "LE CÉDANT",
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
                            text: `${cedantCivilite} ${cedantPrenom} ${cedantNom}`,
                            size: 11 * 2,
                            font: "Arial",
                          }),
                        ],
                        spacing: { after: 240 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Signature :",
                            size: 11 * 2,
                            font: "Arial",
                          }),
                        ],
                        spacing: { after: 120 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: " ",
                            size: 11 * 2,
                            font: "Arial",
                          }),
                        ],
                        spacing: { after: 240 },
                      }),
                    ],
                    width: {
                      size: 50,
                      type: WidthType.PERCENTAGE,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "LE CESSIONNAIRE",
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
                            text: `${cessionnaireCivilite} ${cessionnairePrenom} ${cessionnaireNom}`,
                            size: 11 * 2,
                            font: "Arial",
                          }),
                        ],
                        spacing: { after: 240 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Signature :",
                            size: 11 * 2,
                            font: "Arial",
                          }),
                        ],
                        spacing: { after: 120 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: " ",
                            size: 11 * 2,
                            font: "Arial",
                          }),
                        ],
                        spacing: { after: 240 },
                      }),
                    ],
                    width: {
                      size: 50,
                      type: WidthType.PERCENTAGE,
                    },
                  }),
                ],
              }),
            ],
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
          }),

          // Rappel important (bas de page)
          new Paragraph({
            children: [
              new TextRun({
                text: "Ce document doit être remis à la société pour inscription au registre des mouvements de titres.",
                italics: true,
                size: 10 * 2,
                font: "Arial",
                color: "666666",
              }),
            ],
            spacing: { before: 480, after: 120 },
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  // Génération du buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}


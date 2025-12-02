import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité - Lexigen',
  description: 'Politique de Confidentialité et protection des données personnelles de Lexigen - Conformité RGPD',
  robots: 'index, follow',
};

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Politique de Confidentialité</h1>
        
        <p className="text-base leading-relaxed mb-6 text-justify">
          La présente Politique de Confidentialité décrit la manière dont la société SFERIA collecte, utilise et protège 
          les données personnelles des utilisateurs du service Lexigen, conformément au Règlement Général sur la Protection 
          des Données (RGPD) et à la loi Informatique et Libertés.
        </p>

        <div className="space-y-6">
          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Responsable du traitement</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Le responsable du traitement des données personnelles est :
            </p>
            <ul className="list-none mb-4 space-y-2 text-base leading-relaxed">
              <li><strong>SAS SFERIA</strong></li>
              <li>SIRET : 99130112800013</li>
              <li>RCS : 991 301 128 R.C.S. Versailles</li>
              <li>Adresse : 31 rue aux Fleurs, 78960 Voisins-le-Bretonneux, France</li>
              <li>Email : contact@sferia.fr</li>
              <li>Téléphone : +33 6 98 53 25 45</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Conformément à l'article 37 du RGPD, SFERIA n'est pas tenue de désigner un Délégué à la Protection des Données (DPO) 
              car l'entreprise compte moins de 250 salariés et ses activités de traitement ne nécessitent pas un suivi régulier 
              et systématique à grande échelle des personnes concernées.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Données collectées</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              SFERIA collecte et traite les données personnelles suivantes dans le cadre de l'utilisation du service Lexigen :
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              <strong>Données d'identification et de contact :</strong>
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li>Nom et prénom</li>
              <li>Adresse email professionnelle</li>
              <li>Numéro de téléphone (optionnel)</li>
              <li>SIRET du cabinet ou de l'entreprise</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              <strong>Données de connexion :</strong>
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li>Adresse IP</li>
              <li>Données de navigation (cookies techniques uniquement)</li>
              <li>Horodatage des connexions</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              <strong>Données relatives à l'utilisation du service :</strong>
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li>Informations relatives aux clients créés dans le service</li>
              <li>Documents générés et historique des actions</li>
              <li>Données de facturation et de paiement (gérées par Stripe)</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              <strong>Données relatives aux clients des utilisateurs :</strong>
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les utilisateurs peuvent saisir dans le service des informations relatives à leurs propres clients (nom, prénom, 
              adresse, SIRET, etc.) pour générer des documents juridiques. Ces données sont traitées par SFERIA en qualité de 
              sous-traitant au nom de l'utilisateur, qui en reste le responsable du traitement.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Finalités du traitement</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les données personnelles collectées sont traitées pour les finalités suivantes :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li><strong>Gestion de l'abonnement</strong> : Création et gestion du compte utilisateur, facturation, suivi des paiements</li>
              <li><strong>Fourniture du service</strong> : Accès à la plateforme, génération de documents, stockage des données</li>
              <li><strong>Support technique</strong> : Réponse aux demandes d'assistance, résolution des problèmes techniques</li>
              <li><strong>Amélioration du service</strong> : Analyse de l'utilisation (données agrégées et anonymisées), développement de nouvelles fonctionnalités</li>
              <li><strong>Obligations légales</strong> : Conservation des données comptables et fiscales, réponse aux demandes des autorités compétentes</li>
              <li><strong>Sécurité</strong> : Prévention de la fraude, détection d'intrusions, sauvegarde des données</li>
            </ul>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Base légale du traitement</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Le traitement des données personnelles est fondé sur les bases légales suivantes :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li><strong>Exécution d'un contrat</strong> : Les données nécessaires à la fourniture du service et à la gestion 
              de l'abonnement sont traitées sur la base de l'exécution du contrat de service (CGV)</li>
              <li><strong>Intérêt légitime</strong> : L'amélioration du service, la prévention de la fraude et la sécurité 
              des données reposent sur l'intérêt légitime de SFERIA</li>
              <li><strong>Obligation légale</strong> : La conservation des données comptables et fiscales est imposée par la loi</li>
              <li><strong>Consentement</strong> : Les cookies non essentiels (s'il y en a) nécessitent le consentement de l'utilisateur</li>
            </ul>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Destinataires des données</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les données personnelles collectées sont accessibles uniquement aux personnes autorisées de SFERIA dans le cadre 
              de leurs fonctions (équipe technique, support client, direction).
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les données peuvent également être transmises aux prestataires suivants, agissant en qualité de sous-traitants :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li><strong>Stripe Inc.</strong> : Traitement des paiements par carte bancaire. Données transmises : identifiant de transaction, 
              montant, email (pour facturation). Stripe est certifié PCI-DSS niveau 1. 
              Politique de confidentialité : <a href="https://stripe.com/fr/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">stripe.com/fr/privacy</a></li>
              <li><strong>Supabase</strong> : Hébergement de la base de données et infrastructure backend. Données hébergées en Europe (AWS). 
              Politique de confidentialité : <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">supabase.com/privacy</a></li>
              <li><strong>Vercel Inc.</strong> : Hébergement de l'application web. Données hébergées aux États-Unis avec garanties appropriées. 
              Politique de confidentialité : <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">vercel.com/legal/privacy-policy</a></li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Tous les sous-traitants sont soumis à des obligations contractuelles strictes de confidentialité et de sécurité, 
              conformes au RGPD.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les données peuvent également être communiquées aux autorités compétentes en cas d'obligation légale ou de demande judiciaire.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Durée de conservation</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les données personnelles sont conservées pour les durées suivantes :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li><strong>Données de compte actif</strong> : Pendant toute la durée de l'abonnement</li>
              <li><strong>Données après résiliation</strong> : 3 ans à compter de la résiliation du compte (obligations comptables et fiscales)</li>
              <li><strong>Données de facturation</strong> : 10 ans (obligation légale de conservation des documents comptables)</li>
              <li><strong>Données de connexion</strong> : 12 mois maximum</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              À l'expiration de ces durées, les données sont supprimées définitivement de manière sécurisée, sauf obligation légale 
              de conservation plus longue.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Droits des personnes concernées</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Conformément au RGPD, toute personne dispose des droits suivants sur ses données personnelles :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li><strong>Droit d'accès</strong> : Obtenir une copie de ses données personnelles</li>
              <li><strong>Droit de rectification</strong> : Corriger ses données inexactes ou incomplètes</li>
              <li><strong>Droit à l'effacement</strong> : Demander la suppression de ses données (sous réserve des obligations légales de conservation)</li>
              <li><strong>Droit à la limitation</strong> : Limiter le traitement de ses données dans certains cas</li>
              <li><strong>Droit à la portabilité</strong> : Récupérer ses données dans un format structuré et couramment utilisé</li>
              <li><strong>Droit d'opposition</strong> : S'opposer au traitement de ses données pour des motifs légitimes</li>
              <li><strong>Droit de retirer son consentement</strong> : Retirer son consentement à tout moment (pour les traitements basés sur le consentement)</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Pour exercer ces droits, l'utilisateur peut adresser une demande par email à contact@sferia.fr en précisant 
              son identité et l'objet de sa demande. SFERIA s'engage à répondre dans un délai d'un mois maximum.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              En cas de non-respect de ses droits, l'utilisateur peut introduire une réclamation auprès de la Commission Nationale 
              de l'Informatique et des Libertés (CNIL) : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">www.cnil.fr</a>
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Cookies</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Le service Lexigen utilise uniquement des cookies techniques strictement nécessaires au fonctionnement du service :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li><strong>Cookies d'authentification</strong> : Maintien de la session utilisateur</li>
              <li><strong>Cookies de sécurité</strong> : Protection contre les attaques CSRF</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Ces cookies sont exemptés de consentement conformément à la directive ePrivacy. Aucun cookie de tracking, 
              d'analyse ou de publicité n'est utilisé sur le service Lexigen.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les cookies techniques sont conservés pendant la durée de la session ou au maximum 30 jours pour les cookies 
              de préférences utilisateur.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Transferts de données hors de l'Union Européenne</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Certains prestataires de SFERIA sont situés hors de l'Union Européenne :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li><strong>Stripe Inc.</strong> (États-Unis) : Les données de paiement sont transférées avec des clauses contractuelles 
              types approuvées par la Commission Européenne, garantissant un niveau de protection adéquat des données.</li>
              <li><strong>Vercel Inc.</strong> (États-Unis) : L'hébergement de l'application peut impliquer des transferts de données 
              vers les États-Unis. Vercel adhère au Privacy Shield Framework et à ses successeurs, garantissant un niveau de protection 
              adéquat des données.</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les données hébergées par Supabase (base de données) sont stockées exclusivement en Europe (infrastructure AWS Europe), 
              conformément au RGPD.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Sécurité des données</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              SFERIA met en œuvre des mesures techniques et organisationnelles appropriées pour assurer la sécurité des données personnelles :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li>Chiffrement SSL/TLS pour toutes les communications</li>
              <li>Chiffrement des données au repos dans la base de données</li>
              <li>Authentification forte par mot de passe (hachage bcrypt)</li>
              <li>Row Level Security (RLS) pour isoler les données par cabinet</li>
              <li>Sauvegardes quotidiennes automatiques</li>
              <li>Surveillance et détection d'intrusions</li>
              <li>Accès aux données limité aux personnes autorisées</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              En cas de violation de données personnelles susceptible d'engendrer un risque pour les droits et libertés des personnes, 
              SFERIA notifiera la CNIL dans les 72 heures et informera les personnes concernées si le risque est élevé.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Modifications de la Politique de Confidentialité</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              SFERIA se réserve le droit de modifier la présente Politique de Confidentialité à tout moment pour s'adapter aux évolutions 
              légales, réglementaires ou techniques.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Toute modification substantielle sera portée à la connaissance des utilisateurs par email au moins 30 jours avant son entrée 
              en vigueur. La version mise à jour sera disponible sur cette page avec indication de la date de dernière mise à jour.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              <strong>Dernière mise à jour :</strong> Janvier 2025
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Contact</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Pour toute question relative à la protection des données personnelles ou pour exercer vos droits, vous pouvez contacter SFERIA :
            </p>
            <ul className="list-none mb-4 space-y-2 text-base leading-relaxed">
              <li>Email : <a href="mailto:contact@sferia.fr" className="text-blue-600 underline">contact@sferia.fr</a></li>
              <li>Téléphone : +33 6 98 53 25 45</li>
              <li>Adresse postale : 31 rue aux Fleurs, 78960 Voisins-le-Bretonneux, France</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Pour toute réclamation concernant le traitement de vos données personnelles, vous pouvez également vous adresser à la CNIL : 
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline"> www.cnil.fr</a>
            </p>
          </article>
        </div>

        <footer className="mt-12 pt-8 border-t">
          <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
            ← Retour à l'accueil
          </Link>
        </footer>
      </div>
    </div>
  );
}


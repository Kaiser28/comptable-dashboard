import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'CGV - Lexigen',
  description: 'Conditions Générales de Vente de Lexigen - Service de génération automatique de statuts juridiques SAS/SASU',
  robots: 'index, follow',
};

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Conditions Générales de Vente</h1>
        
        <p className="text-base leading-relaxed mb-6 text-justify">
          Les présentes Conditions Générales de Vente (ci-après « CGV ») régissent l'utilisation du service Lexigen édité par la société SFERIA. 
          Toute souscription à un abonnement Lexigen implique l'acceptation sans réserve des présentes CGV.
        </p>

        <div className="space-y-6">
          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 1 - Objet et champ d'application</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les présentes CGV ont pour objet de définir les conditions et modalités d'utilisation du service Lexigen, 
              plateforme SaaS de génération automatique de documents juridiques (statuts SAS/SASU, procès-verbaux, déclarations, etc.) 
              destinée aux professionnels du secteur comptable et juridique.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Toute commande implique l'acceptation sans réserve des présentes CGV, qui prévalent sur tout autre document, 
              sauf accord écrit dérogatoire de SFERIA.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 2 - Tarifs</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les tarifs applicables au service Lexigen sont les suivants :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li><strong>Abonnement mensuel</strong> : 39,99 € HT (47,99 € TTC) par mois</li>
              <li><strong>Abonnement annuel</strong> : 439,89 € HT (527,87 € TTC) par an</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les prix sont exprimés en euros, hors taxes. La TVA au taux de 20% s'applique conformément à la législation française en vigueur.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              SFERIA se réserve le droit de modifier ses tarifs à tout moment. Les modifications tarifaires s'appliquent aux nouveaux abonnements 
              souscrits après la date de modification. Les abonnements en cours restent au tarif initial jusqu'à leur renouvellement.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 3 - Souscription et essai gratuit</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              La souscription à Lexigen s'effectue en ligne sur le site internet www.lexigen.fr. Le Client doit créer un compte utilisateur 
              en renseignant les informations requises (nom, prénom, email professionnel, SIRET du cabinet).
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Un essai gratuit de 14 jours est proposé à tout nouveau Client. Pendant cette période d'essai, le Client peut utiliser 
              l'ensemble des fonctionnalités du service sans engagement. Aucun moyen de paiement n'est requis pour démarrer l'essai gratuit.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              À l'expiration de la période d'essai de 14 jours, si le Client n'a pas résilié son compte, l'abonnement choisi 
              (mensuel ou annuel) est automatiquement activé et le paiement est prélevé selon les modalités définies à l'article 4.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 4 - Conditions de paiement</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Le paiement s'effectue exclusivement par carte bancaire via le prestataire de paiement Stripe Inc., 
              conformément aux conditions générales d'utilisation de Stripe disponibles sur www.stripe.com.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Pour les abonnements mensuels, le paiement est prélevé automatiquement chaque mois à la date anniversaire de la souscription. 
              Pour les abonnements annuels, le paiement est prélevé en une seule fois à la date de souscription.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              En cas d'échec du prélèvement, SFERIA se réserve le droit de suspendre l'accès au service jusqu'à régularisation du paiement. 
              Le Client est informé par email en cas d'échec de paiement.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les factures sont disponibles en téléchargement depuis le tableau de bord du Client. Elles sont également envoyées par email 
              à l'adresse renseignée lors de la création du compte.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 5 - Durée et renouvellement</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              L'abonnement Lexigen est souscrit pour une durée déterminée selon l'option choisie (mensuelle ou annuelle).
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              L'abonnement est reconduit tacitement pour des périodes successives de même durée, sauf résiliation par l'une ou l'autre 
              des parties dans les conditions prévues à l'article 6.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Le Client est informé par email 7 jours avant chaque échéance de renouvellement automatique.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 6 - Résiliation</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              <strong>Abonnement mensuel</strong> : Le Client peut résilier son abonnement à tout moment depuis son tableau de bord 
              ou par email à contact@sferia.fr. La résiliation prend effet à la fin du mois en cours. Aucun remboursement au prorata 
              n'est effectué pour le mois en cours.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              <strong>Abonnement annuel</strong> : Le Client peut résilier son abonnement uniquement à la date anniversaire de la souscription, 
              avec un préavis de 30 jours. La résiliation doit être notifiée par email à contact@sferia.fr. 
              Aucune résiliation anticipée n'est possible pour les abonnements annuels, et aucun remboursement au prorata n'est effectué.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              SFERIA se réserve le droit de résilier l'abonnement du Client en cas de manquement grave aux présentes CGV, 
              notamment en cas d'utilisation frauduleuse du service ou de non-paiement. La résiliation prend effet immédiatement 
              après notification par email.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              En cas de résiliation, l'accès au service est suspendu immédiatement. Les données du Client sont conservées 
              conformément à la Politique de Confidentialité pendant la durée légale de conservation.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 7 - Obligations de l'éditeur</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              SFERIA s'engage à mettre à disposition du Client le service Lexigen dans les conditions suivantes :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li>Disponibilité du service : 99% du temps, hors périodes de maintenance programmée</li>
              <li>Maintenance préventive : effectuée en dehors des heures ouvrables (22h-6h heure de Paris) avec notification préalable de 48h</li>
              <li>Support technique : réponse sous 48h ouvrées par email à contact@sferia.fr</li>
              <li>Sécurité des données : conformité RGPD, hébergement en Europe, chiffrement SSL</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              SFERIA se réserve le droit d'interrompre temporairement l'accès au service pour des raisons de maintenance, 
              de mise à jour ou de force majeure, sans que cette interruption n'ouvre droit à un remboursement.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 8 - Obligations du client</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Le Client s'engage à :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li>Utiliser le service Lexigen conformément à sa destination et dans le respect de la législation en vigueur</li>
              <li>Ne pas utiliser le service à des fins frauduleuses, illégales ou contraires aux bonnes mœurs</li>
              <li>Conserver la confidentialité de ses identifiants de connexion</li>
              <li>Informer immédiatement SFERIA en cas de perte, vol ou utilisation frauduleuse de ses identifiants</li>
              <li>Renseigner des informations exactes et à jour lors de la création du compte</li>
              <li>Respecter les droits de propriété intellectuelle de SFERIA et des tiers</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Le Client est seul responsable de l'utilisation qu'il fait du service et des documents générés. 
              SFERIA ne saurait être tenue responsable d'une utilisation non conforme du service par le Client.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 9 - Responsabilité et garanties</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              SFERIA met tout en œuvre pour assurer la disponibilité et la qualité du service Lexigen. 
              Cependant, le service est fourni « en l'état » sans garantie expresse ou implicite.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              SFERIA ne saurait être tenue responsable :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li>Des dommages indirects résultant de l'utilisation ou de l'impossibilité d'utiliser le service</li>
              <li>De la perte de données résultant d'une faute du Client ou d'un cas de force majeure</li>
              <li>De l'utilisation des documents générés par le Client, le Client restant seul responsable de leur validation juridique</li>
              <li>Des interruptions de service dues à des cas de force majeure ou à des actes de tiers</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              La responsabilité de SFERIA est limitée au montant des sommes versées par le Client au titre de l'abonnement 
              au cours des 12 derniers mois précédant le fait dommageable.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              <strong>Important</strong> : Lexigen génère des documents à partir de templates génériques. Le Client reste responsable 
              de la validation et de l'adaptation des documents générés à chaque situation particulière. SFERIA ne fournit pas de conseil juridique.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 10 - Propriété intellectuelle</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Le service Lexigen, incluant son interface, ses algorithmes, ses templates de documents et sa base de données, 
              est la propriété exclusive de SFERIA et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Le Client dispose d'un droit d'utilisation personnelle et non exclusive du service dans le cadre de son activité professionnelle. 
              Toute reproduction, représentation, modification ou adaptation du service, en tout ou partie, est strictement interdite sans 
              autorisation écrite préalable de SFERIA.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les documents générés par le Client via Lexigen sont la propriété du Client. Le Client peut les utiliser, modifier et distribuer 
              librement dans le cadre de son activité professionnelle.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 11 - Données personnelles</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les données personnelles collectées dans le cadre de l'utilisation du service Lexigen sont traitées conformément 
              à la Politique de Confidentialité disponible sur www.lexigen.fr/confidentialite et conformément au Règlement Général 
              sur la Protection des Données (RGPD).
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Le Client dispose d'un droit d'accès, de rectification, de suppression, de portabilité et d'opposition sur ses données personnelles, 
              qu'il peut exercer en contactant SFERIA à l'adresse contact@sferia.fr.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 12 - Modifications des CGV</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              SFERIA se réserve le droit de modifier les présentes CGV à tout moment. Les modifications sont portées à la connaissance 
              des Clients par email au moins 30 jours avant leur entrée en vigueur.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Si le Client n'accepte pas les modifications apportées aux CGV, il peut résilier son abonnement dans les conditions 
              prévues à l'article 6. À défaut de résiliation dans un délai de 30 jours suivant la notification des modifications, 
              le Client est réputé avoir accepté les nouvelles CGV.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 13 - Droit applicable et juridiction compétente</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les présentes CGV sont régies par le droit français. Tout litige relatif à leur interprétation ou à leur exécution 
              relève de la compétence exclusive des tribunaux de Versailles, même en cas de pluralité de défendeurs ou d'appel en garantie.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Conformément aux articles L. 611-1 et R. 612-1 et suivants du Code de la consommation, le Client peut recourir gratuitement 
              à un médiateur de la consommation en vue de la résolution amiable du litige qui l'oppose à SFERIA.
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


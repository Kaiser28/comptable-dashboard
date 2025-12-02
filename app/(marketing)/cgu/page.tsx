import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'CGU - Lexigen',
  description: 'Conditions Générales d\'Utilisation de Lexigen - Service de génération automatique de statuts juridiques',
  robots: 'index, follow',
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Conditions Générales d'Utilisation</h1>
        
        <p className="text-base leading-relaxed mb-6 text-justify">
          Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et l'utilisation du service Lexigen, 
          édité par la société SFERIA. Toute utilisation du service implique l'acceptation sans réserve des présentes CGU.
        </p>

        <div className="space-y-6">
          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 1 - Objet du service</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Lexigen est une plateforme SaaS (Software as a Service) destinée aux professionnels du secteur comptable et juridique, 
              permettant la génération automatique de documents juridiques pour la création et la gestion de sociétés SAS (Société par Actions Simplifiée) 
              et SASU (Société par Actions Simplifiée Unipersonnelle).
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Le service permet notamment de générer :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li>Les statuts de la société (SAS/SASU)</li>
              <li>Les procès-verbaux d'assemblée générale (ordinaire et extraordinaire)</li>
              <li>Les déclarations de non-condamnation (DNC)</li>
              <li>Les actes de cession d'actions</li>
              <li>Les actes d'augmentation et de réduction de capital</li>
              <li>Les annonces légales pré-remplies</li>
              <li>Les formulaires administratifs (M0, etc.)</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les documents générés sont fournis au format Word (.docx) et PDF, permettant leur personnalisation et leur validation 
              par le professionnel avant utilisation.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 2 - Accès au service</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              L'accès au service Lexigen nécessite la création d'un compte utilisateur sur le site www.lexigen.fr. 
              Le compte est réservé aux professionnels (experts-comptables, avocats, conseils juridiques) exerçant une activité légale en France.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Pour créer un compte, l'utilisateur doit renseigner :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li>Son nom et prénom</li>
              <li>Son adresse email professionnelle</li>
              <li>Le SIRET de son cabinet ou entreprise</li>
              <li>Un mot de passe sécurisé (minimum 8 caractères)</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              L'utilisateur peut inviter des collaborateurs à rejoindre son compte cabinet, permettant un accès multi-utilisateurs 
              au service dans le respect des limites d'utilisation définies par l'abonnement.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              SFERIA se réserve le droit de refuser l'accès au service à tout utilisateur ne respectant pas les conditions d'éligibilité 
              ou présentant un risque pour la sécurité du service.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 3 - Utilisation du service</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              L'utilisateur s'engage à utiliser le service Lexigen conformément à sa destination et dans le respect de la législation en vigueur.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Le service permet notamment de :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li>Créer et gérer une base de clients</li>
              <li>Saisir les informations nécessaires à la génération de documents juridiques</li>
              <li>Générer des documents personnalisés à partir de templates pré-définis</li>
              <li>Télécharger les documents générés aux formats Word et PDF</li>
              <li>Envoyer des formulaires sécurisés aux clients pour collecte d'informations</li>
              <li>Suivre l'historique des documents générés</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              L'utilisateur est seul responsable de la qualité et de l'exactitude des informations saisies dans le service. 
              SFERIA ne saurait être tenue responsable d'erreurs résultant de données incorrectes fournies par l'utilisateur.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              L'utilisateur s'engage à ne pas utiliser le service à des fins frauduleuses, illégales ou contraires aux bonnes mœurs, 
              notamment pour générer des documents destinés à des activités illicites.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 4 - Propriété des données</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              L'utilisateur reste propriétaire exclusif de toutes les données qu'il saisit dans le service Lexigen, 
              incluant les informations relatives à ses clients, les documents générés et toute autre donnée personnelle ou professionnelle.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              SFERIA s'engage à ne pas utiliser, exploiter, vendre ou transmettre les données de l'utilisateur à des tiers, 
              sauf dans les cas prévus par la Politique de Confidentialité ou requis par la loi.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              En cas de résiliation du compte, l'utilisateur peut exporter ses données avant la suppression définitive du compte. 
              Les données sont conservées conformément à la durée légale de conservation définie dans la Politique de Confidentialité.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les données sont hébergées en Europe (infrastructure AWS via Supabase) conformément au Règlement Général sur la Protection des Données (RGPD).
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 5 - Sécurité</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              SFERIA met en œuvre des mesures techniques et organisationnelles appropriées pour assurer la sécurité et la confidentialité 
              des données de l'utilisateur :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li>Chiffrement SSL/TLS pour toutes les communications (HTTPS)</li>
              <li>Chiffrement des données au repos dans la base de données</li>
              <li>Authentification sécurisée par mot de passe (hachage bcrypt)</li>
              <li>Row Level Security (RLS) au niveau de la base de données pour isoler les données par cabinet</li>
              <li>Sauvegardes quotidiennes automatiques</li>
              <li>Surveillance et détection d'intrusions</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              L'utilisateur est responsable de la confidentialité de ses identifiants de connexion. Il s'engage à ne pas les communiquer 
              à des tiers et à informer immédiatement SFERIA en cas de perte, vol ou utilisation frauduleuse de ses identifiants.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              En cas de compromission de sécurité suspectée, SFERIA se réserve le droit de suspendre temporairement l'accès au compte 
              concerné jusqu'à régularisation de la situation.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 6 - Disponibilité</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              SFERIA s'efforce d'assurer une disponibilité du service de 99% du temps, calculée sur une base mensuelle, 
              hors périodes de maintenance programmée.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les opérations de maintenance préventive sont effectuées en dehors des heures ouvrables (22h-6h heure de Paris) 
              et font l'objet d'une notification préalable de 48 heures par email aux utilisateurs.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              En cas d'indisponibilité imprévue du service, SFERIA s'engage à mettre tout en œuvre pour rétablir le service 
              dans les meilleurs délais. Aucune garantie de disponibilité absolue n'est toutefois accordée, notamment en cas de force majeure.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les interruptions de service dues à des cas de force majeure, des actes de tiers ou des pannes techniques indépendantes 
              de la volonté de SFERIA n'ouvrent pas droit à un remboursement ou à une compensation.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 7 - Support technique</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              SFERIA met à disposition des utilisateurs un support technique par email à l'adresse contact@sferia.fr.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les demandes de support sont traitées dans un délai de 48 heures ouvrées (hors week-ends et jours fériés). 
              Les demandes urgentes peuvent être signalées comme telles dans l'objet de l'email.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Le support technique couvre :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li>L'assistance à l'utilisation du service</li>
              <li>La résolution des problèmes techniques</li>
              <li>Les questions relatives aux fonctionnalités</li>
              <li>La gestion des incidents de sécurité</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Le support ne couvre pas :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li>Le conseil juridique sur l'utilisation des documents générés</li>
              <li>L'assistance à la personnalisation avancée des documents</li>
              <li>La formation approfondie sur les aspects juridiques</li>
            </ul>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 8 - Modifications du service</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              SFERIA se réserve le droit de modifier, améliorer ou faire évoluer le service Lexigen à tout moment, 
              notamment pour ajouter de nouvelles fonctionnalités, corriger des bugs ou améliorer les performances.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les modifications majeures du service (changement d'interface, suppression de fonctionnalités, etc.) 
              font l'objet d'une notification préalable de 30 jours par email aux utilisateurs.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les mises à jour mineures (corrections de bugs, améliorations de performance) sont appliquées automatiquement 
              sans notification préalable, généralement lors des périodes de maintenance programmée.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Si une modification majeure du service n'est pas acceptée par l'utilisateur, celui-ci peut résilier son abonnement 
              dans les conditions prévues par les Conditions Générales de Vente.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 9 - Suspension et fermeture de compte</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              SFERIA se réserve le droit de suspendre ou de fermer définitivement le compte d'un utilisateur en cas de :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li>Non-paiement de l'abonnement après échec du prélèvement</li>
              <li>Utilisation frauduleuse ou illégale du service</li>
              <li>Violation des présentes CGU ou des Conditions Générales de Vente</li>
              <li>Comportement abusif ou nuisible à la sécurité du service</li>
              <li>Demande de l'utilisateur</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              En cas de suspension, l'accès au service est temporairement désactivé jusqu'à régularisation de la situation. 
              L'utilisateur est informé par email de la suspension et des motifs de celle-ci.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              En cas de fermeture définitive du compte, les données de l'utilisateur sont conservées conformément à la durée légale 
              de conservation, puis supprimées définitivement. L'utilisateur peut demander l'export de ses données avant la fermeture 
              du compte en contactant SFERIA à contact@sferia.fr.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Article 10 - Droit applicable</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les présentes CGU sont régies par le droit français. Tout litige relatif à leur interprétation ou à leur exécution 
              relève de la compétence exclusive des tribunaux de Versailles, conformément aux dispositions des Conditions Générales de Vente.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Conformément à la réglementation européenne et française en vigueur, l'utilisateur dispose d'un droit de médiation 
              pour résoudre amiablement tout litige avec SFERIA.
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


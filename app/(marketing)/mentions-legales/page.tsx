import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mentions Légales - Lexigen',
  description: 'Mentions légales du service Lexigen - Informations sur l\'éditeur, l\'hébergeur et les conditions d\'utilisation',
  robots: 'index, follow',
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Mentions Légales</h1>

        <div className="space-y-6">
          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Éditeur du site</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Le site www.lexigen.fr est édité par :
            </p>
            <ul className="list-none mb-4 space-y-2 text-base leading-relaxed">
              <li><strong>Dénomination sociale :</strong> SAS SFERIA</li>
              <li><strong>Forme juridique :</strong> Société par Actions Simplifiée</li>
              <li><strong>SIRET :</strong> 99130112800013</li>
              <li><strong>RCS :</strong> 991 301 128 R.C.S. Versailles</li>
              <li><strong>Numéro TVA intracommunautaire :</strong> FR87991301128</li>
              <li><strong>Capital social :</strong> 1 000 €</li>
              <li><strong>Siège social :</strong> 31 rue aux Fleurs, 78960 Voisins-le-Bretonneux, France</li>
              <li><strong>Directeur de publication :</strong> Jean-Laurore Dominique</li>
            </ul>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Contact</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Pour toute question ou demande d'information concernant le service Lexigen, vous pouvez nous contacter :
            </p>
            <ul className="list-none mb-4 space-y-2 text-base leading-relaxed">
              <li><strong>Email :</strong> <a href="mailto:contact@sferia.fr" className="text-blue-600 underline">contact@sferia.fr</a></li>
              <li><strong>Téléphone :</strong> +33 6 98 53 25 45</li>
              <li><strong>Adresse postale :</strong> 31 rue aux Fleurs, 78960 Voisins-le-Bretonneux, France</li>
            </ul>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Hébergeur</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Le site www.lexigen.fr est hébergé par :
            </p>
            <ul className="list-none mb-4 space-y-2 text-base leading-relaxed">
              <li><strong>Raison sociale :</strong> Vercel Inc.</li>
              <li><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</li>
              <li><strong>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">www.vercel.com</a></li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Vercel Inc. est une société de droit californien spécialisée dans l'hébergement d'applications web. 
              Les données peuvent être hébergées aux États-Unis avec des garanties appropriées conformes au RGPD.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Base de données</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les données du service Lexigen sont stockées dans une base de données hébergée par :
            </p>
            <ul className="list-none mb-4 space-y-2 text-base leading-relaxed">
              <li><strong>Prestataire :</strong> Supabase</li>
              <li><strong>Infrastructure :</strong> Amazon Web Services (AWS) Europe</li>
              <li><strong>Localisation :</strong> Europe (conformité RGPD)</li>
              <li><strong>Site web :</strong> <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">www.supabase.com</a></li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les données sont hébergées exclusivement en Europe, garantissant une conformité totale avec le Règlement Général 
              sur la Protection des Données (RGPD).
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Prestataire de paiement</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les paiements par carte bancaire sont traités par :
            </p>
            <ul className="list-none mb-4 space-y-2 text-base leading-relaxed">
              <li><strong>Raison sociale :</strong> Stripe Inc.</li>
              <li><strong>Adresse :</strong> 510 Townsend Street, San Francisco, CA 94103, États-Unis</li>
              <li><strong>Site web :</strong> <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">www.stripe.com</a></li>
              <li><strong>Certification :</strong> PCI-DSS niveau 1 (norme de sécurité la plus stricte pour les paiements)</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Stripe est un prestataire de paiement certifié et sécurisé, utilisé par des millions d'entreprises dans le monde. 
              Les données de paiement sont traitées conformément aux standards de sécurité les plus stricts.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Propriété intellectuelle</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              L'ensemble des éléments du site www.lexigen.fr, incluant mais sans s'y limiter :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li>La structure générale du site</li>
              <li>Les textes, graphismes, logos, icônes</li>
              <li>Les algorithmes et le code source</li>
              <li>Les templates de documents juridiques</li>
              <li>La base de données</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              sont la propriété exclusive de SAS SFERIA et sont protégés par les lois françaises et internationales relatives 
              à la propriété intellectuelle, notamment le Code de la Propriété Intellectuelle.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, 
              quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de SFERIA.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              <strong>© 2025 SFERIA - Tous droits réservés</strong>
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Utilisation du service</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              L'utilisation du service Lexigen est soumise aux Conditions Générales de Vente (CGV) et aux Conditions Générales 
              d'Utilisation (CGU), disponibles respectivement aux adresses suivantes :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li><a href="/cgv" className="text-blue-600 underline">www.lexigen.fr/cgv</a> - Conditions Générales de Vente</li>
              <li><a href="/cgu" className="text-blue-600 underline">www.lexigen.fr/cgu</a> - Conditions Générales d'Utilisation</li>
              <li><a href="/confidentialite" className="text-blue-600 underline">www.lexigen.fr/confidentialite</a> - Politique de Confidentialité</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Toute utilisation du service implique l'acceptation sans réserve de ces conditions.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Responsabilité</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              SFERIA s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur le site www.lexigen.fr, 
              dont elle se réserve le droit de corriger, à tout moment et sans préavis, le contenu.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Toutefois, SFERIA ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition sur le site. 
              En conséquence, SFERIA décline toute responsabilité :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li>Pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur le site</li>
              <li>Pour tout dommage résultant d'une intrusion frauduleuse d'un tiers ayant entraîné une modification des informations 
              mises à disposition sur le site</li>
              <li>Pour les dommages directs ou indirects causés au matériel de l'utilisateur lors de l'accès au site</li>
              <li>Pour les dommages résultant de l'utilisation ou de l'impossibilité d'utiliser le site</li>
            </ul>
            <p className="text-base leading-relaxed mb-4 text-justify">
              <strong>Important :</strong> Lexigen génère des documents juridiques à partir de templates génériques. 
              SFERIA ne fournit pas de conseil juridique. L'utilisateur reste seul responsable de la validation et de l'adaptation 
              des documents générés à chaque situation particulière.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Liens hypertextes</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Le site www.lexigen.fr peut contenir des liens hypertextes vers d'autres sites présents sur le réseau Internet. 
              Les liens vers ces autres ressources vous font quitter le site www.lexigen.fr.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Il est possible de créer un lien vers la page d'accueil du site www.lexigen.fr sans autorisation préalable de SFERIA. 
              Aucune autorisation ni demande d'information préalable ne peut être exigée par l'éditeur à l'égard d'un site qui souhaite 
              établir un lien vers le site de l'éditeur. Il convient toutefois d'afficher le site dans une nouvelle fenêtre du navigateur.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Cependant, SFERIA se réserve le droit de demander la suppression d'un lien qu'elle estime non conforme à l'objet du site.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Protection des données personnelles</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les données personnelles collectées sur le site www.lexigen.fr sont traitées conformément au Règlement Général sur 
              la Protection des Données (RGPD) et à la loi Informatique et Libertés.
            </p>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Pour plus d'informations sur le traitement de vos données personnelles et vos droits, consultez notre 
              <a href="/confidentialite" className="text-blue-600 underline"> Politique de Confidentialité</a>.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Droit applicable et juridiction compétente</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Les présentes mentions légales sont régies par le droit français. Tout litige relatif à leur interprétation ou à leur 
              exécution relève de la compétence exclusive des tribunaux de Versailles.
            </p>
          </article>

          <article className="mb-6">
            <h2 className="text-2xl font-semibold mt-8 mb-4">Crédits</h2>
            <p className="text-base leading-relaxed mb-4 text-justify">
              Le service Lexigen utilise les technologies et services suivants :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2 text-base leading-relaxed">
              <li><strong>Next.js</strong> - Framework React pour le développement web (<a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">nextjs.org</a>)</li>
              <li><strong>Stripe</strong> - Solution de paiement en ligne (<a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">stripe.com</a>)</li>
              <li><strong>Supabase</strong> - Plateforme backend et base de données (<a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">supabase.com</a>)</li>
              <li><strong>Vercel</strong> - Hébergement et déploiement (<a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">vercel.com</a>)</li>
            </ul>
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


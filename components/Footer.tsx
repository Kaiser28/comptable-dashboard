import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Section 1 : Logo et description */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Lexigen</h3>
            <p className="text-sm text-gray-600 mb-4">
              Génération automatique de statuts juridiques
            </p>
            <p className="text-xs text-gray-500">
              © 2025 SAS SFERIA - Tous droits réservés
            </p>
          </div>

          {/* Section 2 : Liens légaux */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Informations légales
            </h4>
            <nav className="flex flex-col space-y-2">
              <Link
                href="/cgv"
                className="text-gray-600 hover:text-gray-900 hover:underline transition-colors"
              >
                Conditions Générales de Vente
              </Link>
              <Link
                href="/cgu"
                className="text-gray-600 hover:text-gray-900 hover:underline transition-colors"
              >
                Conditions Générales d'Utilisation
              </Link>
              <Link
                href="/confidentialite"
                className="text-gray-600 hover:text-gray-900 hover:underline transition-colors"
              >
                Politique de confidentialité
              </Link>
              <Link
                href="/mentions-legales"
                className="text-gray-600 hover:text-gray-900 hover:underline transition-colors"
              >
                Mentions légales
              </Link>
            </nav>
          </div>

          {/* Section 3 : Contact */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Contact
            </h4>
            <div className="flex flex-col space-y-2">
              <a
                href="mailto:contact@sferia.fr"
                className="text-gray-600 hover:text-gray-900 hover:underline transition-colors"
              >
                contact@sferia.fr
              </a>
              <a
                href="tel:+33698532545"
                className="text-gray-600 hover:text-gray-900 hover:underline transition-colors"
              >
                +33 6 98 53 25 45
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


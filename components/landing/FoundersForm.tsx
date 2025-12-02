'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function FoundersForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedCGV, setAcceptedCGV] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!acceptedCGV) {
      toast.error('Vous devez accepter les CGV/CGU pour continuer');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    
    // Récupérer les checkboxes outils_saas
    const outilsSaaS: string[] = [];
    formData.getAll('outils_saas[]').forEach((value) => {
      if (typeof value === 'string') {
        outilsSaaS.push(value);
      }
    });

    const body = {
      nom_cabinet: formData.get('nom_cabinet'),
      prenom_nom: formData.get('prenom_nom'),
      fonction: formData.get('fonction'),
      email: formData.get('email'),
      telephone: formData.get('telephone'),
      ville: formData.get('ville'),
      nb_collaborateurs: formData.get('nb_collaborateurs'),
      nb_creations: formData.get('nb_creations'),
      process_actuel: formData.get('process_actuel'),
      pain_principal: formData.get('pain_principal'),
      outils_saas: outilsSaaS,
      outils_saas_autre: formData.get('outils_saas_autre'),
      quand_demarrer: formData.get('quand_demarrer'),
      engagement_feedback: formData.get('engagement_feedback'),
      consent_contact: formData.get('consent_contact'),
    };

    try {
      const response = await fetch('/api/candidature-founders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi de la candidature');
      }

      // Rediriger vers la page de confirmation
      const prenom = data.prenom || body.prenom_nom?.toString().split(' ')[0] || '';
      const email = data.email || body.email?.toString() || '';
      router.push(`/merci-candidature?email=${encodeURIComponent(email)}&prenom=${encodeURIComponent(prenom)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'envoi de la candidature');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section : Informations cabinet */}
      <fieldset className="space-y-6" disabled={isSubmitting}>
        <legend className="text-xl font-bold text-gray-900 mb-4">Informations sur votre cabinet</legend>
        
        <div>
          <label htmlFor="nom-cabinet" className="block text-sm font-medium text-gray-700 mb-2">
            Nom du cabinet <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nom-cabinet"
            name="nom_cabinet"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="prenom-nom" className="block text-sm font-medium text-gray-700 mb-2">
            Votre prénom et nom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="prenom-nom"
            name="prenom_nom"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="fonction" className="block text-sm font-medium text-gray-700 mb-2">
            Votre fonction <span className="text-red-500">*</span>
          </label>
          <select
            id="fonction"
            name="fonction"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            <option value="">-- Sélectionnez --</option>
            <option value="ec-associe">Expert-comptable associé</option>
            <option value="ec-collaborateur">Expert-comptable collaborateur</option>
            <option value="responsable-admin">Responsable administratif</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email professionnel <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-2">
            Téléphone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="telephone"
            name="telephone"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="ville" className="block text-sm font-medium text-gray-700 mb-2">
            Ville du cabinet <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="ville"
            name="ville"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
      </fieldset>

      {/* Section : Qualification */}
      <fieldset className="space-y-6" disabled={isSubmitting}>
        <legend className="text-xl font-bold text-gray-900 mb-4">Qualification de votre activité</legend>
        
        <div>
          <label htmlFor="nb-collaborateurs" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de collaborateurs dans votre cabinet <span className="text-red-500">*</span>
          </label>
          <select
            id="nb-collaborateurs"
            name="nb_collaborateurs"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            <option value="">-- Sélectionnez --</option>
            <option value="1-2">1-2 (solo/petite structure)</option>
            <option value="3-5">3-5</option>
            <option value="6-10">6-10</option>
            <option value="11-20">11-20</option>
            <option value="20+">20+</option>
          </select>
        </div>

        <div>
          <label htmlFor="nb-creations" className="block text-sm font-medium text-gray-700 mb-2">
            Combien de créations de SAS traitez-vous par mois actuellement ? <span className="text-red-500">*</span>
          </label>
          <select
            id="nb-creations"
            name="nb_creations"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            <option value="">-- Sélectionnez --</option>
            <option value="0-5">0-5 (occasionnel)</option>
            <option value="5-10">5-10</option>
            <option value="10-20">10-20</option>
            <option value="20-30">20-30</option>
            <option value="30+">30+</option>
          </select>
        </div>

        <div>
          <label htmlFor="process-actuel" className="block text-sm font-medium text-gray-700 mb-2">
            Quel est votre processus actuel pour créer des statuts ? <span className="text-red-500">*</span>
          </label>
          <textarea
            id="process-actuel"
            name="process_actuel"
            rows={4}
            required
            placeholder="Ex: Nous utilisons des modèles Word, tout est manuel, ça prend 2-3h par dossier..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="pain-principal" className="block text-sm font-medium text-gray-700 mb-2">
            Quel est votre principal problème avec les créations de SAS ? <span className="text-red-500">*</span>
          </label>
          <textarea
            id="pain-principal"
            name="pain_principal"
            rows={4}
            required
            placeholder="Ex: Les allers-retours clients pour récupérer les infos, le temps passé sur des tâches à faible valeur..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Utilisez-vous déjà d'autres outils SaaS dans votre cabinet ? <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {[
              { value: 'logiciel-compta', label: 'Logiciel de compta (Cegid, ACD, Sage, etc.)' },
              { value: 'signature-elec', label: 'Outil de signature électronique' },
              { value: 'crm', label: 'CRM' },
              { value: 'facturation', label: 'Outil de facturation' },
              { value: 'autre', label: 'Autres' },
              { value: 'aucun', label: 'Aucun pour le moment' },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="outils_saas[]"
                  value={option.value}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
          <input
            type="text"
            name="outils_saas_autre"
            placeholder="Précisez si autre"
            className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="quand-demarrer" className="block text-sm font-medium text-gray-700 mb-2">
            Quand souhaitez-vous démarrer avec LexiGen ? <span className="text-red-500">*</span>
          </label>
          <select
            id="quand-demarrer"
            name="quand_demarrer"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            <option value="">-- Sélectionnez --</option>
            <option value="maintenant">Dès maintenant (novembre 2025)</option>
            <option value="1-mois">D'ici 1 mois (décembre 2025)</option>
            <option value="2-3-mois">D'ici 2-3 mois (janvier 2026)</option>
            <option value="plus-tard">Plus tard</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Êtes-vous prêt à participer à 1 call de feedback par mois pendant 3 mois ? <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {[
              { value: 'oui', label: 'Oui, je m\'engage' },
              { value: 'a-voir', label: 'À voir selon ma disponibilité' },
              { value: 'non', label: 'Non' },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="engagement_feedback"
                  value={option.value}
                  required
                  className="border-gray-300 text-blue-600 focus:ring-blue-600"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      {/* Consentement */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            name="consent_contact"
            required
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
          />
          <span className="text-sm text-gray-700">
            J'accepte d'être contacté par LexiGen pour un entretien de présélection <span className="text-red-500">*</span>
          </span>
        </label>
      </div>

      {/* Checkbox d'acceptation CGV/CGU */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            id="accept-cgv"
            checked={acceptedCGV}
            onChange={(e) => setAcceptedCGV(e.target.checked)}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
          />
          <span className="text-sm text-gray-700">
            {`J'accepte les `}
            <a href="/cgv" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">CGV</a>
            {`, les `}
            <a href="/cgu" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">CGU</a>
            {` et la `}
            <a href="/confidentialite" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">Politique de Confidentialité</a>
            <span className="text-red-500"> *</span>
          </span>
        </label>
      </div>

      {/* CTA Submit */}
      <div className="bg-gray-50 rounded-lg p-4 mt-4">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={acceptedCGV}
            onChange={(e) => setAcceptedCGV(e.target.checked)}
            className="mt-1 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">
            J&apos;accepte les <a href="/cgv" target="_blank" className="text-blue-600 underline">CGV</a>, <a href="/cgu" target="_blank" className="text-blue-600 underline">CGU</a> et la <a href="/confidentialite" target="_blank" className="text-blue-600 underline">Politique</a> <span className="text-red-500">*</span>
          </span>
        </label>
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={!acceptedCGV || isSubmitting}
        className={`w-full text-lg py-6 ${!acceptedCGV || isSubmitting ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}
      >
        {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma candidature'}
      </Button>

      {/* Texte réassurance */}
      <p className="text-center text-sm text-gray-600">
        🔒 Vos données sont sécurisées et ne seront jamais partagées.<br />
        Sans engagement - nous vous recontactons sous 48h.
      </p>
    </form>
  );
}


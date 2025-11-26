'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function MerciCandidaturePage() {
  const searchParams = useSearchParams();
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const prenomParam = searchParams.get('prenom');
    const emailParam = searchParams.get('email');
    if (prenomParam) setPrenom(prenomParam);
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center py-20 px-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardContent className="p-12">
          <div className="text-center">
            {/* Icône succès */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>

            {/* Titre */}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              ✅ Candidature reçue !
            </h1>

            {/* Message personnalisé */}
            {prenom && (
              <p className="text-xl text-gray-700 mb-2">
                Merci {prenom} !
              </p>
            )}

            <p className="text-lg text-gray-600 mb-8">
              Votre candidature au <strong>Programme Founders</strong> a bien été enregistrée.
            </p>

            {/* Informations */}
            <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6 mb-8 text-left">
              <h2 className="font-semibold text-gray-900 mb-4">Prochaines étapes :</h2>
              <p className="text-gray-700 mb-2">
                Nous étudions votre candidature sous <strong>48h</strong>.
              </p>
              {email && (
                <p className="text-gray-700 mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Vous allez recevoir un email de confirmation à <strong>{email}</strong>
                </p>
              )}
              <p className="text-gray-700">
                <Phone className="h-5 w-5 text-blue-600 inline mr-2" />
                Si votre profil correspond, nous vous appelons pour un{' '}
                <strong>entretien de 30 min</strong> (sans engagement).
              </p>
            </div>

            {/* Message de clôture */}
            <p className="text-gray-600 mb-8">
              À très bientôt,<br />
              <strong className="text-gray-900">L'équipe LexiGen</strong>
            </p>

            {/* CTA Retour */}
            <Link href="/">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                Retour à l'accueil
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


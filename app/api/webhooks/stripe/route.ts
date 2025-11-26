export const dynamic = 'force-dynamic';

import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { firstPaymentSuccessEmail, paymentFailedEmail } from '@/lib/email-templates';

/**
 * POST /api/webhooks/stripe
 * Webhook Stripe pour mettre à jour automatiquement les abonnements dans Supabase
 * 
 * Événements gérés :
 * - checkout.session.completed : Mise à jour subscription_id et trial_end_date
 * - customer.subscription.updated : Mise à jour statut abonnement
 * - customer.subscription.deleted : Marquer comme annulé
 * - invoice.payment_succeeded : Mise à jour date prochain paiement
 * - invoice.payment_failed : Marquer en impayé
 */
export async function POST(request: Request) {
  try {
    // Lire le raw body (requis pour vérifier la signature Stripe)
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[WEBHOOK STRIPE] Signature manquante');
      return new Response(JSON.stringify({ error: 'Signature manquante' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Vérifier la signature avec le webhook secret
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error('[WEBHOOK STRIPE] Erreur vérification signature:', err.message);
      return new Response(JSON.stringify({ error: `Erreur signature: ${err.message}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[WEBHOOK STRIPE] Événement reçu:', event.type);

    // Créer le client Supabase Admin pour bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Gérer les différents types d'événements
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const customerId = typeof session.customer === 'string' 
          ? session.customer 
          : session.customer?.id;
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id;

        if (!customerId) {
          console.error('[WEBHOOK STRIPE] checkout.session.completed: customer_id manquant');
          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Récupérer les détails de la subscription pour avoir trial_end
        let trialEndDate = null;
        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            if (subscription.trial_end) {
              trialEndDate = new Date(subscription.trial_end * 1000).toISOString();
            }
          } catch (err) {
            console.error('[WEBHOOK STRIPE] Erreur récupération subscription:', err);
          }
        }

        // Mettre à jour le cabinet
        const { error } = await supabaseAdmin
          .from('cabinets')
          .update({
            stripe_subscription_id: subscriptionId || null,
            subscription_status: 'trialing',
            trial_end_date: trialEndDate,
          })
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error('[WEBHOOK STRIPE] Erreur mise à jour cabinet (checkout.session.completed):', error);
        } else {
          console.log('[WEBHOOK STRIPE] Cabinet mis à jour (checkout.session.completed):', customerId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id;

        if (!customerId) {
          console.error('[WEBHOOK STRIPE] customer.subscription.updated: customer_id manquant');
          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Déterminer le statut
        let status = subscription.status;
        if (status === 'active' && subscription.trial_end && subscription.trial_end > Date.now() / 1000) {
          status = 'trialing';
        }

        // Mettre à jour le cabinet
        const updateData: any = {
          stripe_subscription_id: subscription.id,
          subscription_status: status,
        };

        if (subscription.trial_end) {
          updateData.trial_end_date = new Date(subscription.trial_end * 1000).toISOString();
        }

        if (subscription.current_period_end) {
          updateData.subscription_end_date = new Date(subscription.current_period_end * 1000).toISOString();
        }

        const { error } = await supabaseAdmin
          .from('cabinets')
          .update(updateData)
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error('[WEBHOOK STRIPE] Erreur mise à jour cabinet (customer.subscription.updated):', error);
        } else {
          console.log('[WEBHOOK STRIPE] Cabinet mis à jour (customer.subscription.updated):', customerId, 'status:', status);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id;

        if (!customerId) {
          console.error('[WEBHOOK STRIPE] customer.subscription.deleted: customer_id manquant');
          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Marquer l'abonnement comme annulé
        const { error } = await supabaseAdmin
          .from('cabinets')
          .update({
            subscription_status: 'canceled',
            subscription_end_date: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error('[WEBHOOK STRIPE] Erreur mise à jour cabinet (customer.subscription.deleted):', error);
        } else {
          console.log('[WEBHOOK STRIPE] Cabinet mis à jour (customer.subscription.deleted):', customerId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const customerId = typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id;

        if (!customerId) {
          console.error('[WEBHOOK STRIPE] invoice.payment_succeeded: customer_id manquant');
          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Mettre à jour la date de prochain paiement (period_end)
        const updateData: any = {};
        if (invoice.period_end) {
          updateData.subscription_end_date = new Date(invoice.period_end * 1000).toISOString();
        }

        let isFirstPayment = false;
        // Si c'est le premier paiement après le trial, mettre à jour le statut
        if (invoice.subscription) {
          try {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            if (subscription.status === 'active' && !subscription.trial_end) {
              updateData.subscription_status = 'active';
              // Vérifier si c'est le premier paiement (pas de trial_end et billing_reason = 'subscription_create')
              isFirstPayment = invoice.billing_reason === 'subscription_create' || 
                                (invoice.billing_reason === 'subscription_cycle' && !subscription.trial_end);
            }
          } catch (err) {
            console.error('[WEBHOOK STRIPE] Erreur récupération subscription (invoice.payment_succeeded):', err);
          }
        }

        if (Object.keys(updateData).length > 0) {
          const { error } = await supabaseAdmin
            .from('cabinets')
            .update(updateData)
            .eq('stripe_customer_id', customerId);

          if (error) {
            console.error('[WEBHOOK STRIPE] Erreur mise à jour cabinet (invoice.payment_succeeded):', error);
          } else {
            console.log('[WEBHOOK STRIPE] Cabinet mis à jour (invoice.payment_succeeded):', customerId);
          }
        }

        // Envoyer l'email de confirmation si c'est le premier paiement
        if (isFirstPayment && process.env.NODE_ENV === 'production') {
          try {
            // Récupérer d'abord le cabinet via stripe_customer_id
            const { data: cabinetData, error: cabinetError } = await supabaseAdmin
              .from('cabinets')
              .select('id')
              .eq('stripe_customer_id', customerId)
              .single();

            if (cabinetError || !cabinetData) {
              console.warn('[WEBHOOK STRIPE] Cabinet non trouvé pour customer_id:', customerId);
            } else {
              // Récupérer l'expert admin du cabinet
              const { data: expertData, error: expertError } = await supabaseAdmin
                .from('experts_comptables')
                .select('prenom, nom, email')
                .eq('cabinet_id', cabinetData.id)
                .eq('role', 'admin')
                .maybeSingle();

              if (expertError || !expertData) {
                console.warn('[WEBHOOK STRIPE] Expert non trouvé pour cabinet_id:', cabinetData.id);
              } else {
                const amount = (invoice.amount_paid / 100).toFixed(2);
                const nextBillingDate = invoice.period_end 
                  ? new Date(invoice.period_end * 1000).toISOString()
                  : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

                const emailHtml = firstPaymentSuccessEmail(
                  expertData.prenom || 'Utilisateur',
                  amount,
                  nextBillingDate
                );

                const emailId = await sendEmail({
                  to: expertData.email || invoice.customer_email,
                  subject: 'Paiement confirmé - LexiGen',
                  html: emailHtml,
                });

                if (emailId) {
                  console.log('[WEBHOOK STRIPE] Email premier paiement envoyé:', emailId);
                } else {
                  console.warn('[WEBHOOK STRIPE] Échec envoi email premier paiement (non bloquant)');
                }
              }
            }
          } catch (emailError: any) {
            console.error('[WEBHOOK STRIPE] Erreur envoi email premier paiement (non bloquant):', emailError);
            // Ne pas faire échouer le webhook si l'email échoue
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const customerId = typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id;

        if (!customerId) {
          console.error('[WEBHOOK STRIPE] invoice.payment_failed: customer_id manquant');
          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Marquer le compte en impayé
        const { error } = await supabaseAdmin
          .from('cabinets')
          .update({
            subscription_status: 'past_due',
          })
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error('[WEBHOOK STRIPE] Erreur mise à jour cabinet (invoice.payment_failed):', error);
        } else {
          console.log('[WEBHOOK STRIPE] Cabinet mis à jour (invoice.payment_failed):', customerId);
        }

        // Envoyer l'email d'alerte paiement échoué
        if (process.env.NODE_ENV === 'production') {
          try {
            // Récupérer d'abord le cabinet via stripe_customer_id
            const { data: cabinetData, error: cabinetError } = await supabaseAdmin
              .from('cabinets')
              .select('id')
              .eq('stripe_customer_id', customerId)
              .single();

            if (cabinetError || !cabinetData) {
              console.warn('[WEBHOOK STRIPE] Cabinet non trouvé pour customer_id:', customerId);
            } else {
              // Récupérer l'expert admin du cabinet
              const { data: expertData, error: expertError } = await supabaseAdmin
                .from('experts_comptables')
                .select('prenom, nom, email')
                .eq('cabinet_id', cabinetData.id)
                .eq('role', 'admin')
                .maybeSingle();

              if (expertError || !expertData) {
                console.warn('[WEBHOOK STRIPE] Expert non trouvé pour cabinet_id:', cabinetData.id);
              } else {
                const retryDate = invoice.next_payment_attempt
                  ? new Date(invoice.next_payment_attempt * 1000).toISOString()
                  : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

                const emailHtml = paymentFailedEmail(
                  expertData.prenom || 'Utilisateur',
                  retryDate
                );

                const emailId = await sendEmail({
                  to: expertData.email || invoice.customer_email,
                  subject: 'Problème de paiement - LexiGen',
                  html: emailHtml,
                });

                if (emailId) {
                  console.log('[WEBHOOK STRIPE] Email paiement échoué envoyé:', emailId);
                } else {
                  console.warn('[WEBHOOK STRIPE] Échec envoi email paiement échoué (non bloquant)');
                }
              }
            }
          } catch (emailError: any) {
            console.error('[WEBHOOK STRIPE] Erreur envoi email paiement échoué (non bloquant):', emailError);
            // Ne pas faire échouer le webhook si l'email échoue
          }
        }
        break;
      }

      default:
        console.log('[WEBHOOK STRIPE] Événement non géré:', event.type);
    }

    // Toujours retourner 200 à Stripe (même en cas d'erreur interne)
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[WEBHOOK STRIPE] Erreur inattendue:', error);
    // Retourner 200 pour éviter les retry infinis de Stripe
    return new Response(JSON.stringify({ error: 'Erreur interne' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


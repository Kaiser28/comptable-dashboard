export interface StripeSubscription {
  id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  current_period_end: number;
  cancel_at_period_end: boolean;
  trial_end: number | null;
}

export interface StripeCustomer {
  id: string;
  email: string;
  subscription: StripeSubscription | null;
}


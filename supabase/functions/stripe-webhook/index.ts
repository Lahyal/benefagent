import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb = createClient(supabaseUrl, serviceKey);

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop() || '';

  try {
    // Stripe webhook (POST to function root with stripe-signature)
    const sig = req.headers.get('stripe-signature');
    if (sig && stripeSecret && webhookSecret) {
      const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });
      const rawBody = await req.text();
      const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan || 'pro';
        if (userId) {
          await sb.from('subscriptions').upsert({
            user_id: userId,
            plan,
            status: 'active',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        }
      }

      if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
        const sub = event.data.object as Stripe.Subscription;
        const status = sub.status === 'active' ? 'active' : 'canceled';
        await sb.from('subscriptions').update({ status, updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id);
      }

      return json({ received: true });
    }

    if (!stripeSecret) {
      return json({ error: 'STRIPE_SECRET_KEY not configured' }, 500);
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });
    const body = await req.json();

    // POST .../create-checkout
    if (path === 'create-checkout' || body.plan) {
      const { plan, userId, userEmail, priceId, successUrl, cancelUrl } = body;
      if (!userId || !priceId) {
        return json({ error: 'userId and priceId required' }, 400);
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: userEmail,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl || 'https://benefagent.com/app.html?payment=success',
        cancel_url: cancelUrl || 'https://benefagent.com/app.html',
        metadata: { userId, plan: plan || 'pro' },
      });

      return json({ url: session.url });
    }

    // POST .../create-portal
    if (path === 'create-portal' || body.customerId) {
      const { customerId, returnUrl } = body;
      if (!customerId) return json({ error: 'customerId required' }, 400);

      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl || 'https://benefagent.com/app.html',
      });

      return json({ url: portal.url });
    }

    return json({ error: 'Unknown route' }, 404);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Stripe error' }, 500);
  }
});

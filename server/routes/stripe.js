const express = require('express');
const Stripe = require('stripe');
const { verifyToken } = require('../middleware/firebaseAuth');

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-11-20.acacia',
});

// POST /api/stripe/create-checkout — Create Stripe Checkout Session
router.post('/create-checkout', verifyToken, async (req, res) => {
  const { priceId, mode: checkoutMode } = req.body;
  const user = req.user;
  const mode = checkoutMode === 'payment' ? 'payment' : 'subscription';

  if (!priceId) {
    return res.status(400).json({ error: 'Missing priceId' });
  }

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
    return res.status(503).json({ error: 'Payment system not configured yet. Please add Stripe keys.' });
  }

  try {
    const sessionParams = {
      payment_method_types: ['card'],
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?payment=cancelled`,
      client_reference_id: user.uid,
      metadata: { firebaseUid: user.uid },
      allow_promotion_codes: true,
    };
    if (mode === 'subscription') {
      sessionParams.subscription_data = { metadata: { firebaseUid: user.uid } };
    }
    const session = await stripe.checkout.sessions.create(sessionParams);

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[Stripe Checkout Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stripe/create-portal — Customer portal for subscription management
router.post('/create-portal', verifyToken, async (req, res) => {
  const user = req.user;

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
    return res.status(503).json({ error: 'Payment system not configured yet.' });
  }

  try {
    // Find Stripe customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      return res.status(404).json({ error: 'No Stripe customer found for this user' });
    }
    const customerId = customers.data[0].id;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/settings`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[Stripe Portal Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stripe/subscription — Get subscription status
router.get('/subscription', verifyToken, async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
    return res.json({ subscription: 'free', plan: 'free' });
  }

  try {
    const customers = await stripe.customers.list({ email: req.user.email, limit: 1 });
    if (customers.data.length === 0) {
      return res.json({ subscription: 'free', plan: 'free' });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.json({ subscription: 'free', plan: 'free' });
    }

    const sub = subscriptions.data[0];
    const priceId = sub.items.data[0].price.id;

    let plan = 'free';
    if (priceId === process.env.STRIPE_GROW_PRICE_ID) plan = 'grow';
    if (priceId === process.env.STRIPE_SCALE_PRICE_ID) plan = 'scale';
    if (priceId === process.env.STRIPE_EVOLUTION_PRICE_ID) plan = 'evolution';

    res.json({
      subscription: plan,
      plan,
      status: sub.status,
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });
  } catch (err) {
    console.error('[Stripe Subscription Error]', err.message);
    res.json({ subscription: 'free', plan: 'free' });
  }
});

// POST /api/stripe/webhook — Handle Stripe webhooks
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET.includes('placeholder')) {
    console.warn('[Stripe Webhook] Webhook secret not configured');
    return res.json({ received: true });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle subscription events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const firebaseUid = session.metadata?.firebaseUid || session.client_reference_id;
      if (firebaseUid) {
        await updateUserSubscription(firebaseUid, session.subscription, 'pro');
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const firebaseUid = sub.metadata?.firebaseUid;
      if (firebaseUid) {
        const priceId = sub.items.data[0]?.price?.id;
        let plan = 'free';
        if (priceId === process.env.STRIPE_GROW_PRICE_ID) plan = 'grow';
        if (priceId === process.env.STRIPE_SCALE_PRICE_ID) plan = 'scale';
        if (priceId === process.env.STRIPE_EVOLUTION_PRICE_ID) plan = 'evolution';
        if (sub.status !== 'active') plan = 'free';
        await updateUserSubscription(firebaseUid, sub.id, plan);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const firebaseUid = sub.metadata?.firebaseUid;
      if (firebaseUid) {
        await updateUserSubscription(firebaseUid, null, 'free');
      }
      break;
    }

    default:
      break;
  }

  res.json({ received: true });
});

// Update user subscription in Firestore
async function updateUserSubscription(uid, subscriptionId, plan) {
  try {
    const admin = require('firebase-admin');
    // Only update if firebase is initialized
    if (admin.apps.length > 0) {
      const db = admin.firestore();
      // Never overwrite admin subscription — admin access is manually assigned
      const existing = await db.collection('users').doc(uid).get();
      if (existing.exists && existing.data().subscription === 'admin') {
        console.log(`[Webhook] Skipping update for admin user ${uid}`);
        return;
      }
      await db.collection('users').doc(uid).update({
        subscription: plan,
        stripeSubscriptionId: subscriptionId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`[Webhook] Updated user ${uid} subscription to ${plan}`);
    }
  } catch (err) {
    console.error('[Webhook] Failed to update Firestore:', err.message);
  }
}

module.exports = router;

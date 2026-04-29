const express = require('express');
const Stripe = require('stripe');
const { verifyToken } = require('../middleware/firebaseAuth');

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-11-20.acacia',
});

// POST /api/stripe/validate-promo — Validate a promotion code (public — no auth required)
router.post('/validate-promo', async (req, res) => {
  const { code } = req.body;

  if (!code) return res.status(400).json({ error: 'Missing code' });

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
    return res.status(503).json({ error: 'Payment system not configured yet.' });
  }

  try {
    const promoCodes = await stripe.promotionCodes.list({ code, active: true, limit: 1 });
    if (promoCodes.data.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired discount code' });
    }
    const promo = promoCodes.data[0];
    const coupon = promo.coupon;
    let discountLabel = '';
    if (coupon.percent_off) {
      discountLabel = `${coupon.percent_off}% off`;
    } else if (coupon.amount_off) {
      const currency = (coupon.currency || 'eur').toUpperCase();
      discountLabel = `${(coupon.amount_off / 100).toFixed(2)} ${currency} off`;
    }
    res.json({ valid: true, promoId: promo.id, discountLabel, name: coupon.name || code });
  } catch (err) {
    console.error('[Stripe Promo Validate Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stripe/create-checkout — Create Stripe Checkout Session
router.post('/create-checkout', verifyToken, async (req, res) => {
  const { priceId, mode: checkoutMode, promoId } = req.body;
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
    };

    if (promoId) {
      sessionParams.discounts = [{ promotion_code: promoId }];
    } else {
      sessionParams.allow_promotion_codes = true;
    }

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
    // Prefer stripeCustomerId stored in Firestore; fall back to email lookup
    let customerId = null;
    try {
      const admin = require('firebase-admin');
      if (admin.apps.length > 0) {
        const userDoc = await admin.firestore().collection('users').doc(user.uid).get();
        customerId = userDoc.data()?.stripeCustomerId || null;
      }
    } catch (_) {}

    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length === 0) {
        return res.status(404).json({ error: 'No Stripe customer found for this user' });
      }
      customerId = customers.data[0].id;
    }

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

// POST /api/stripe/cancel-subscription — Cancel at period end
router.post('/cancel-subscription', verifyToken, async (req, res) => {
  const user = req.user;

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
    return res.status(503).json({ error: 'Payment system not configured yet.' });
  }

  try {
    let customerId = null;
    try {
      const admin = require('firebase-admin');
      if (admin.apps.length > 0) {
        const userDoc = await admin.firestore().collection('users').doc(user.uid).get();
        customerId = userDoc.data()?.stripeCustomerId || null;
      }
    } catch (_) {}

    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length === 0) {
        return res.status(404).json({ error: 'No Stripe customer found for this user' });
      }
      customerId = customers.data[0].id;
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const updated = await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    });

    const periodEnd = new Date(updated.cancel_at * 1000).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    // Store expiry date in Firestore so the scheduled function can downgrade automatically
    try {
      const admin = require('firebase-admin');
      if (admin.apps.length > 0) {
        await admin.firestore().collection('users').doc(user.uid).update({
          subscriptionCancelAt: admin.firestore.Timestamp.fromMillis(updated.cancel_at * 1000),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (e) {
      console.error('[Stripe Cancel] Failed to store cancelAt in Firestore:', e.message);
    }

    res.json({ success: true, cancelAt: updated.cancel_at, periodEnd });
  } catch (err) {
    console.error('[Stripe Cancel Error]', err.message);
    res.status(500).json({ error: err.message });
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
      if (firebaseUid && session.subscription) {
        // Expand subscription to get priceId and assign correct plan
        try {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const priceId = sub.items.data[0]?.price?.id;
          const plan = resolvePlan(priceId);
          if (!plan) {
            console.error(`[Webhook] checkout.session.completed: unrecognised priceId "${priceId}" — update Stripe price env vars`);
            // Still store customer/subscription IDs but don't touch subscription field
            await updateUserSubscription(firebaseUid, session.subscription, null, session.customer);
          } else {
            await updateUserSubscription(firebaseUid, session.subscription, plan, session.customer);
          }
        } catch (err) {
          console.error('[Webhook] Failed to retrieve subscription on checkout:', err.message);
        }
      } else if (firebaseUid && session.mode === 'payment') {
        // One-time payment (e.g. add-on) — just store customerId
        await updateUserSubscription(firebaseUid, null, null, session.customer);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const firebaseUid = sub.metadata?.firebaseUid;
      if (firebaseUid) {
        if (sub.status !== 'active') {
          // Subscription cancelled / past_due / etc. — downgrade to free
          await updateUserSubscription(firebaseUid, sub.id, 'free');
        } else {
          const priceId = sub.items.data[0]?.price?.id;
          const plan = resolvePlan(priceId);
          if (!plan) {
            console.error(`[Webhook] customer.subscription.updated: unrecognised priceId "${priceId}" — update Stripe price env vars`);
            // Do NOT overwrite subscription with 'free' for an active sub we can't identify
          } else {
            await updateUserSubscription(firebaseUid, sub.id, plan);
          }
        }
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

// Map a Stripe priceId to an internal plan name. Returns null if unknown.
function resolvePlan(priceId) {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_GROW_PRICE_ID) return 'grow';
  if (priceId === process.env.STRIPE_SCALE_PRICE_ID) return 'scale';
  if (priceId === process.env.STRIPE_EVOLUTION_PRICE_ID) return 'evolution';
  return null;
}

// Update user subscription in Firestore
async function updateUserSubscription(uid, subscriptionId, plan, stripeCustomerId) {
  try {
    const admin = require('firebase-admin');
    if (admin.apps.length > 0) {
      const db = admin.firestore();
      const existing = await db.collection('users').doc(uid).get();
      if (existing.exists && existing.data().subscription === 'admin') {
        console.log(`[Webhook] Skipping update for admin user ${uid}`);
        return;
      }
      const update = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
      if (plan !== null) {
        update.subscription = plan;
        update.stripeSubscriptionId = subscriptionId;
      }
      if (stripeCustomerId) {
        update.stripeCustomerId = stripeCustomerId;
      }
      await db.collection('users').doc(uid).update(update);
      console.log(`[Webhook] Updated user ${uid}:`, update);
    }
  } catch (err) {
    console.error('[Webhook] Failed to update Firestore:', err.message);
  }
}

module.exports = router;

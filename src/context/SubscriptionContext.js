import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext(null);

export function useSubscription() {
  return useContext(SubscriptionContext);
}

const TRIAL_DAYS = 14;

export const PLANS = {
  free: {
    name: 'Free',
    trialDays: TRIAL_DAYS,
    // After trial ends, only these specific tools are accessible:
    allowedTools: ['marketing:seo-keyword-research', 'marketing:seo-meta-tags'],
  },
  grow: {
    name: 'Grow',
    categories: ['marketing', 'content', 'digital'],
    allowedTools: ['strategy:business-plan'],
  },
  scale: {
    name: 'Scale',
    categories: ['marketing', 'content', 'digital', 'ecommerce', 'agency', 'creative'],
    allowedTools: ['strategy:business-plan'],
  },
  evolution: {
    name: 'Evolution',
    categories: ['marketing', 'content', 'digital', 'ecommerce', 'agency', 'creative', 'finance', 'startup', 'strategy'],
    allowedTools: [],
  },
  admin: {
    name: 'Admin',
    allAccess: true,
  },
};

export function SubscriptionProvider({ children }) {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const [subscription, setSubscription] = useState('free');
  const [usageCount, setUsageCount] = useState(0);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    if (userProfile) {
      setSubscription(userProfile.subscription || 'free');
      setUsageCount(userProfile.usageCount || 0);
      setCheckingSubscription(false);
    } else {
      setCheckingSubscription(false);
    }
  }, [userProfile]);

  // --- Trial helpers ---

  function getCreatedAtMs() {
    const createdAt = userProfile?.createdAt;
    if (!createdAt) return null;
    if (typeof createdAt.toMillis === 'function') return createdAt.toMillis();
    return new Date(createdAt).getTime();
  }

  function isInTrial() {
    if (subscription !== 'free') return false;
    const ms = getCreatedAtMs();
    if (!ms) return false;
    return (Date.now() - ms) < TRIAL_DAYS * 24 * 60 * 60 * 1000;
  }

  function trialDaysRemaining() {
    if (subscription !== 'free') return 0;
    const ms = getCreatedAtMs();
    if (!ms) return 0;
    const elapsed = Date.now() - ms;
    const remaining = TRIAL_DAYS * 24 * 60 * 60 * 1000 - elapsed;
    return remaining > 0 ? Math.ceil(remaining / (24 * 60 * 60 * 1000)) : 0;
  }

  // --- Access functions ---

  function getPlan() {
    return PLANS[subscription] || PLANS.free;
  }

  function canUseSpecificTool(categoryId, toolId) {
    if (!currentUser) return false;
    const plan = getPlan();
    if (plan.allAccess) return true;
    if (isInTrial()) return true;
    if (plan.categories?.includes(categoryId)) return true;
    if (plan.allowedTools?.includes(`${categoryId}:${toolId}`)) return true;
    return false;
  }

  // Category-level check — true if user can access ANY tool in the category
  function canUseTool(categoryId) {
    if (!currentUser) return false;
    const plan = getPlan();
    if (plan.allAccess) return true;
    if (isInTrial()) return true;
    if (plan.categories?.includes(categoryId)) return true;
    if (plan.allowedTools?.some((t) => t.startsWith(`${categoryId}:`))) return true;
    return false;
  }

  function isCategoryLocked(categoryId) {
    const plan = getPlan();
    if (plan.allAccess) return false;
    if (isInTrial()) return false;
    if (plan.categories?.includes(categoryId)) return false;
    if (plan.allowedTools?.some((t) => t.startsWith(`${categoryId}:`))) return false;
    return true;
  }

  async function trackUsage() {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { usageCount: increment(1) });
      setUsageCount((prev) => prev + 1);
    } catch (err) {
      console.error('Error tracking usage:', err);
    }
  }

  function getPlanLimits() {
    return PLANS[subscription] || PLANS.free;
  }

  const value = {
    subscription,
    usageCount,
    checkingSubscription,
    canUseTool,
    canUseSpecificTool,
    isCategoryLocked,
    isInTrial,
    trialDaysRemaining,
    trackUsage,
    getPlanLimits,
    PLANS,
    refreshUserProfile,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

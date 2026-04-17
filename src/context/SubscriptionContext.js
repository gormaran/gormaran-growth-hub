import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext(null);

export function useSubscription() {
  return useContext(SubscriptionContext);
}

const TRIAL_DAYS = 1;
export const FREE_MONTHLY_LIMIT = 10;

export const PLANS = {
  free: {
    name: 'Free',
    trialHours: 24,
    // After trial ends, only these specific tools are accessible:
    allowedTools: ['marketing:seo-keyword-research', 'marketing:seo-meta-tags', 'marketing:instagram-audit'],
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

  // Backward compat: map legacy plan names to current ones
  const PLAN_ALIASES = { 'pro': 'grow', 'business': 'evolution' };

  // Admin UID override — mirrors server-side ADMIN_UIDS check
  const ADMIN_UIDS = (process.env.REACT_APP_ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);

  useEffect(() => {
    if (ADMIN_UIDS.includes(currentUser?.uid)) {
      setSubscription('admin');
      setCheckingSubscription(false);
      return;
    }
    if (userProfile) {
      const raw = userProfile.subscription || 'free';
      setSubscription(PLAN_ALIASES[raw] || raw);

      // Monthly reset: if usageResetDate is from a previous month, reset the counter
      const resetTs = userProfile.usageResetDate;
      const resetDate = resetTs?.toDate ? resetTs.toDate() : (resetTs ? new Date(resetTs) : null);
      const now = new Date();
      const isNewMonth = !resetDate ||
        resetDate.getMonth() !== now.getMonth() ||
        resetDate.getFullYear() !== now.getFullYear();

      if (isNewMonth && currentUser) {
        setUsageCount(0);
        updateDoc(doc(db, 'users', currentUser.uid), {
          usageCount: 0,
          usageResetDate: serverTimestamp(),
        }).catch(() => {});
      } else {
        setUsageCount(userProfile.usageCount || 0);
      }
      setCheckingSubscription(false);
    } else {
      setCheckingSubscription(false);
    }
  }, [userProfile, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function hasMonthlyUsageLeft() {
    const plan = getPlan();
    if (plan.allAccess) return true;
    if (subscription !== 'free') return true;
    if (isInTrial()) return true;
    return usageCount < FREE_MONTHLY_LIMIT;
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
    hasMonthlyUsageLeft,
    trackUsage,
    getPlanLimits,
    PLANS,
    FREE_MONTHLY_LIMIT,
    refreshUserProfile,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

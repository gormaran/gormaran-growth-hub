import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext(null);

export function useSubscription() {
  return useContext(SubscriptionContext);
}

export const FREE_MONTHLY_LIMIT = 10;

export const PLANS = {
  free: {
    name: 'Free',
    monthlyLimit: FREE_MONTHLY_LIMIT,
    allCategories: true,
  },
  pro: {
    name: 'Pro',
    allCategories: true,
    unlimitedUsage: true,
  },
  enterprise: {
    name: 'Enterprise',
    allCategories: true,
    unlimitedUsage: true,
    whiteLabel: true,
    apiAccess: true,
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
  const PLAN_ALIASES = { 'grow': 'pro', 'scale': 'pro', 'evolution': 'enterprise', 'business': 'enterprise' };

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

  // --- Access functions ---

  function getPlan() {
    return PLANS[subscription] || PLANS.free;
  }

  function isInTrial() { return false; }
  function trialDaysRemaining() { return 0; }

  function canUseSpecificTool(categoryId) {
    if (!currentUser) return false;
    return true; // All plans have access to all tools; usage quota enforced separately
  }

  function canUseTool(categoryId) {
    if (!currentUser) return false;
    return true;
  }

  function isCategoryLocked() {
    return false; // No category locking in new model — only usage quota
  }

  function hasMonthlyUsageLeft() {
    const plan = getPlan();
    if (plan.allAccess || plan.unlimitedUsage) return true;
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

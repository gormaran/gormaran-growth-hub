import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext(null);

export function useSubscription() {
  return useContext(SubscriptionContext);
}

const PLANS = {
  free: {
    name: 'Free',
    dailyLimit: 3,
    categories: ['marketing', 'content'],
  },
  pro: {
    name: 'Pro',
    dailyLimit: Infinity,
    categories: ['marketing', 'content', 'strategy', 'digital', 'creative'],
  },
  business: {
    name: 'Business',
    dailyLimit: Infinity,
    categories: ['marketing', 'content', 'strategy', 'digital', 'creative', 'ecommerce', 'agency', 'startup', 'finance'],
  },
  admin: {
    name: 'Admin',
    dailyLimit: Infinity,
    categories: ['marketing', 'content', 'strategy', 'digital', 'creative', 'ecommerce', 'agency', 'startup', 'finance', 'automation'],
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

  function canUseTool(categoryId) {
    if (!currentUser) return false;
    if (subscription === 'admin') return true;
    const plan = PLANS[subscription] || PLANS.free;
    if (!plan.categories.includes(categoryId)) return false;
    if (plan.dailyLimit !== Infinity && usageCount >= plan.dailyLimit) return false;
    return true;
  }

  function isCategoryLocked(categoryId) {
    if (subscription === 'admin') return false;
    const plan = PLANS[subscription] || PLANS.free;
    return !plan.categories.includes(categoryId);
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

  function isAtLimit() {
    if (subscription === 'admin') return false;
    const plan = PLANS[subscription] || PLANS.free;
    return plan.dailyLimit !== Infinity && usageCount >= plan.dailyLimit;
  }

  const value = {
    subscription,
    usageCount,
    checkingSubscription,
    canUseTool,
    isCategoryLocked,
    trackUsage,
    getPlanLimits,
    isAtLimit,
    PLANS,
    refreshUserProfile,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

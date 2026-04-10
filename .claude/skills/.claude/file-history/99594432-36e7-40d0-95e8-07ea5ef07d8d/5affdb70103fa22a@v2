import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function createUserProfile(user, displayName) {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName || '',
        photoURL: user.photoURL || '',
        subscription: 'free',
        usageCount: 0,
        usageResetDate: new Date(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    const updated = await getDoc(userRef);
    setUserProfile(updated.data());
  }

  async function register(email, password, displayName) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    await createUserProfile(user, displayName);
    return user;
  }

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await refreshUserProfile(result.user.uid);
    return result;
  }

  async function signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    // Pass displayName explicitly — result.user.displayName is guaranteed
    // to be populated at this point (directly from the popup response),
    // unlike the user object received later in onAuthStateChanged.
    await createUserProfile(result.user, result.user.displayName || '');
    return result;
  }

  async function logout() {
    setUserProfile(null);
    return signOut(auth);
  }

  async function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function refreshUserProfile(uid) {
    const userRef = doc(db, 'users', uid || currentUser?.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      setUserProfile(snap.data());
      return snap.data();
    }
    return null;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      try {
        if (user) {
          // Only load the existing profile — never create here.
          // Profile creation happens exclusively in register() and signInWithGoogle(),
          // which have the correct displayName available. Creating here caused a race
          // condition where onAuthStateChanged fired before signInWithGoogle's
          // createUserProfile finished, resulting in a duplicate write with a
          // potentially null displayName.
          await refreshUserProfile(user.uid);
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error('AuthContext error:', err);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    register,
    login,
    logout,
    signInWithGoogle,
    resetPassword,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

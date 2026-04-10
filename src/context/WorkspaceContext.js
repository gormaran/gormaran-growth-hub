import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useSubscription } from './SubscriptionContext';

const WorkspaceContext = createContext(null);
export function useWorkspace() { return useContext(WorkspaceContext); }

export const PERSONAL_WS = { id: 'personal', name: 'Personal', emoji: '🏠' };

// Max workspaces per plan (including Personal)
export const WORKSPACE_LIMITS = {
  free: 1,
  grow: 1,
  scale: 5,
  evolution: Infinity,
  admin: Infinity,
};

export function WorkspaceProvider({ children }) {
  const { currentUser } = useAuth();
  const { subscription } = useSubscription();

  const [workspaces, setWorkspaces] = useState([PERSONAL_WS]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState('personal');
  const [brandProfile, setBrandProfile] = useState(null);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);

  const maxWorkspaces = WORKSPACE_LIMITS[subscription] ?? 1;
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || PERSONAL_WS;
  const canCreateWorkspace = workspaces.length < maxWorkspaces;

  // Reload workspaces when user changes
  useEffect(() => {
    if (!currentUser) {
      setWorkspaces([PERSONAL_WS]);
      setCurrentWorkspaceId('personal');
      setBrandProfile(null);
      setLoadingWorkspaces(false);
      return;
    }
    loadWorkspaces();
  }, [currentUser?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload brand profile when workspace or user changes
  useEffect(() => {
    if (currentUser?.uid) {
      loadBrandProfile(currentUser.uid, currentWorkspaceId);
    }
  }, [currentWorkspaceId, currentUser?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadWorkspaces() {
    setLoadingWorkspaces(true);
    try {
      const wsCol = collection(db, 'users', currentUser.uid, 'workspaces');
      const snap = await getDocs(query(wsCol, orderBy('createdAt', 'asc')));
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Personal is always first and hardcoded (not stored in Firestore)
      const all = [PERSONAL_WS, ...fetched.filter(w => w.id !== 'personal')];
      setWorkspaces(all);

      // Restore last used workspace from localStorage
      const saved = localStorage.getItem(`gormaran_ws_${currentUser.uid}`);
      const validSaved = all.find(w => w.id === saved);
      setCurrentWorkspaceId(validSaved ? saved : 'personal');
    } catch (err) {
      console.error('[Workspace] load failed:', err);
      setWorkspaces([PERSONAL_WS]);
      setCurrentWorkspaceId('personal');
    } finally {
      setLoadingWorkspaces(false);
    }
  }

  async function loadBrandProfile(uid, wsId) {
    try {
      if (wsId === 'personal') {
        // Legacy path: users/{uid}/settings/brandProfile
        const snap = await getDoc(doc(db, 'users', uid, 'settings', 'brandProfile'));
        setBrandProfile(snap.exists() ? snap.data() : null);
      } else {
        const snap = await getDoc(doc(db, 'users', uid, 'workspaces', wsId, 'settings', 'brandProfile'));
        setBrandProfile(snap.exists() ? snap.data() : null);
      }
    } catch {
      setBrandProfile(null);
    }
  }

  async function saveBrandProfile(data) {
    if (!currentUser) return;
    const payload = { ...data, updatedAt: new Date().toISOString() };
    if (currentWorkspaceId === 'personal') {
      await setDoc(doc(db, 'users', currentUser.uid, 'settings', 'brandProfile'), payload);
    } else {
      await setDoc(
        doc(db, 'users', currentUser.uid, 'workspaces', currentWorkspaceId, 'settings', 'brandProfile'),
        payload
      );
    }
    setBrandProfile(payload);
  }

  function switchWorkspace(wsId) {
    setCurrentWorkspaceId(wsId);
    if (currentUser) {
      localStorage.setItem(`gormaran_ws_${currentUser.uid}`, wsId);
    }
  }

  async function createWorkspace({ name, emoji = '📁' }) {
    if (!currentUser) return null;
    if (!canCreateWorkspace) throw new Error('Workspace limit reached for your plan');
    const wsRef = doc(collection(db, 'users', currentUser.uid, 'workspaces'));
    await setDoc(wsRef, { name, emoji, createdAt: serverTimestamp() });
    const newWs = { id: wsRef.id, name, emoji };
    setWorkspaces(prev => [...prev, newWs]);
    return newWs;
  }

  async function updateWorkspace(wsId, { name, emoji }) {
    if (!currentUser || wsId === 'personal') return;
    await updateDoc(doc(db, 'users', currentUser.uid, 'workspaces', wsId), { name, emoji });
    setWorkspaces(prev => prev.map(w => w.id === wsId ? { ...w, name, emoji } : w));
  }

  async function deleteWorkspace(wsId) {
    if (!currentUser || wsId === 'personal') return;
    await deleteDoc(doc(db, 'users', currentUser.uid, 'workspaces', wsId));
    setWorkspaces(prev => prev.filter(w => w.id !== wsId));
    if (currentWorkspaceId === wsId) switchWorkspace('personal');
  }

  const value = {
    workspaces,
    currentWorkspace,
    currentWorkspaceId,
    brandProfile,
    loadingWorkspaces,
    maxWorkspaces,
    canCreateWorkspace,
    switchWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    saveBrandProfile,
    WORKSPACE_LIMITS,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

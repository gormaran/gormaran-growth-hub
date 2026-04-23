import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';

const COL = 'blog_posts';

export async function getAllPublishedPosts() {
  const q = query(
    collection(db, COL),
    where('status', '==', 'published'),
    orderBy('published_at', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllPostsAdmin() {
  const q = query(collection(db, COL), orderBy('updated_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getPostBySlug(slug) {
  const q = query(collection(db, COL), where('slug', '==', slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function getPostById(id) {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createPost(data) {
  return addDoc(collection(db, COL), {
    ...data,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    published_at: data.status === 'published' ? serverTimestamp() : null,
  });
}

export async function updatePost(id, data) {
  const updates = { ...data, updated_at: serverTimestamp() };
  if (data.status === 'published' && data._wasPublishedNow) {
    updates.published_at = serverTimestamp();
  }
  delete updates._wasPublishedNow;
  return updateDoc(doc(db, COL, id), updates);
}

export async function deletePost(id) {
  return deleteDoc(doc(db, COL, id));
}

export async function uploadBlogImage(file) {
  const ext = file.name.split('.').pop();
  const name = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, name);
  const snap = await uploadBytes(storageRef, file);
  return getDownloadURL(snap.ref);
}

export function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

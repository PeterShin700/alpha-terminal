import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, increment } from 'firebase/firestore';
import type { Briefing } from '@/types/briefing';

const COLLECTION_NAME = 'briefings';

export async function getBriefings(maxResults: number = 10): Promise<Briefing[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Briefing));
  } catch (error) {
    console.error('Error fetching briefings:', error);
    return [];
  }
}

export async function addBriefing(content: string): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      content,
      createdAt: Date.now(),
      likes: 0,
      dislikes: 0
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding briefing:', error);
    return null;
  }
}

export async function updateBriefing(id: string, content: string): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      content
    });
    return true;
  } catch (error) {
    console.error('Error updating briefing:', error);
    return false;
  }
}

export async function deleteBriefing(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting briefing:', error);
    return false;
  }
}

export async function incrementReaction(id: string, type: 'likes' | 'dislikes'): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      [type]: increment(1)
    });
    return true;
  } catch (error) {
    console.error(`Error incrementing ${type} for briefing:`, error);
    return false;
  }
}

export async function addBriefingComment(briefingId: string, content: string, authorName: string): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTION_NAME, briefingId);
    const newComment = {
      id: crypto.randomUUID(),
      content,
      createdAt: Date.now(),
      authorName
    };
    
    // Using an array union could be done with arrayUnion from firestore, 
    // but since we don't have it imported, let's just fetch and update or import arrayUnion.
    const { arrayUnion } = await import('firebase/firestore');
    await updateDoc(docRef, {
      adminComments: arrayUnion(newComment)
    });
    return true;
  } catch (error) {
    console.error('Error adding briefing comment:', error);
    return false;
  }
}

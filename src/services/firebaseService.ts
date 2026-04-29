import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  setDoc,
  Timestamp,
  getDoc,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const saveTransaction = async (data: any, coupleId: string) => {
  const path = 'transactions';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      date: Timestamp.now(),
      userId: auth.currentUser?.uid,
      coupleId: coupleId
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const subscribeToTransactions = (coupleId: string, callback: (data: any[]) => void) => {
  const path = 'transactions';
  const q = query(
    collection(db, path),
    where('coupleId', '==', coupleId),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
    }));
    callback(transactions);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

export const getUserProfile = async (uid: string) => {
  const path = `users/${uid}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const updateUserProfile = async (uid: string, data: any) => {
  const path = `users/${uid}`;
  try {
    await setDoc(doc(db, 'users', uid), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const generateLinkingCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const findUserByLinkingCode = async (code: string) => {
  const q = query(collection(db, 'users'), where('linkingCode', '==', code.toUpperCase()));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
};

export const linkPartner = async (currentUserId: string, partnerId: string) => {
  const coupleId = `${currentUserId}_${partnerId}`;
  
  // Update both users
  await updateDoc(doc(db, 'users', currentUserId), {
    partnerId: partnerId,
    coupleId: coupleId
  });
  
  await updateDoc(doc(db, 'users', partnerId), {
    partnerId: currentUserId,
    coupleId: coupleId
  });

  return coupleId;
};

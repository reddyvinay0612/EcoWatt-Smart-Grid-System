import * as realAuth from 'firebase/auth';
import { auth, isPlaceholder } from './config';

// Define standard mock store handlers
let authListeners = [];

const getMockUsers = () => {
  try {
    return JSON.parse(localStorage.getItem('mock_users') || '[]');
  } catch (e) {
    return [];
  }
};

const saveMockUsers = (users) => {
  localStorage.setItem('mock_users', JSON.stringify(users));
};

const getMockSession = () => {
  try {
    return JSON.parse(localStorage.getItem('mock_session_user') || 'null');
  } catch (e) {
    return null;
  }
};

const saveMockSession = (user) => {
  localStorage.setItem('mock_session_user', JSON.stringify(user));
};

export const signInWithEmailAndPassword = async (authObj, email, password) => {
  if (!isPlaceholder) {
    return realAuth.signInWithEmailAndPassword(authObj, email, password);
  }

  const users = getMockUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    throw { code: 'auth/user-not-found', message: 'Firebase: Error (auth/user-not-found).' };
  }
  
  if (user.password !== password) {
    throw { code: 'auth/wrong-password', message: 'Firebase: Error (auth/wrong-password).' };
  }

  const sessionUser = { email: user.email, displayName: user.displayName || 'Operator' };
  saveMockSession(sessionUser);
  authListeners.forEach(listener => listener(sessionUser));
  return { user: sessionUser };
};

export const createUserWithEmailAndPassword = async (authObj, email, password) => {
  if (!isPlaceholder) {
    return realAuth.createUserWithEmailAndPassword(authObj, email, password);
  }

  const users = getMockUsers();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw { code: 'auth/email-already-in-use', message: 'Firebase: Error (auth/email-already-in-use).' };
  }

  const newUser = { email, password, displayName: '' };
  users.push(newUser);
  saveMockUsers(users);

  const sessionUser = { email: newUser.email, displayName: '' };
  saveMockSession(sessionUser);
  authListeners.forEach(listener => listener(sessionUser));
  return { user: sessionUser };
};

export const updateProfile = async (userObj, { displayName }) => {
  if (!isPlaceholder) {
    return realAuth.updateProfile(userObj, { displayName });
  }

  const users = getMockUsers();
  const session = getMockSession();
  
  if (session && session.email) {
    const userIndex = users.findIndex(u => u.email.toLowerCase() === session.email.toLowerCase());
    if (userIndex !== -1) {
      users[userIndex].displayName = displayName;
      saveMockUsers(users);
    }
    session.displayName = displayName;
    saveMockSession(session);
    authListeners.forEach(listener => listener(session));
  }
  return true;
};

export const signOut = async (authObj) => {
  if (!isPlaceholder) {
    return realAuth.signOut(authObj);
  }

  saveMockSession(null);
  authListeners.forEach(listener => listener(null));
  return true;
};

export const onAuthStateChanged = (authObj, callback) => {
  if (!isPlaceholder) {
    return realAuth.onAuthStateChanged(authObj, callback);
  }

  authListeners.push(callback);
  const session = getMockSession();
  
  // Asynchronously invoke callback to mirror real Firebase lifecycle behavior
  setTimeout(() => {
    callback(session);
  }, 50);

  return () => {
    authListeners = authListeners.filter(l => l !== callback);
  };
};

export const updateUserPassword = async (userObj, currentPassword, newPassword) => {
  if (!isPlaceholder) {
    const credential = realAuth.EmailAuthProvider.credential(userObj.email, currentPassword);
    await realAuth.reauthenticateWithCredential(userObj, credential);
    return realAuth.updatePassword(userObj, newPassword);
  }
  
  const users = getMockUsers();
  const userIndex = users.findIndex(u => u.email.toLowerCase() === userObj.email.toLowerCase());
  if (userIndex === -1) {
    throw { code: 'auth/user-not-found', message: 'User account not found.' };
  }
  if (users[userIndex].password !== currentPassword) {
    throw { code: 'auth/wrong-password', message: 'Current password is incorrect.' };
  }
  users[userIndex].password = newPassword;
  saveMockUsers(users);
  return true;
};

export const deleteUserAccount = async (userObj, currentPassword) => {
  if (!isPlaceholder) {
    const credential = realAuth.EmailAuthProvider.credential(userObj.email, currentPassword);
    await realAuth.reauthenticateWithCredential(userObj, credential);
    return realAuth.deleteUser(userObj);
  }
  
  const users = getMockUsers();
  const filteredUsers = users.filter(u => u.email.toLowerCase() !== userObj.email.toLowerCase());
  saveMockUsers(filteredUsers);
  saveMockSession(null);
  authListeners.forEach(listener => listener(null));
  return true;
};

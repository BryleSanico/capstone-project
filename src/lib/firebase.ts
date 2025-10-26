import { getApp, getApps } from '@react-native-firebase/app';

const firebaseApp = getApps().length > 0 ? getApp() : undefined;

export default firebaseApp;

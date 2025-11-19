import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import { handleBackgroundMessage } from './src/utils/network/notificationListener';

setBackgroundMessageHandler(getMessaging(), handleBackgroundMessage);
AppRegistry.registerComponent(appName, () => App);

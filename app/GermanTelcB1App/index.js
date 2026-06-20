/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Only show errors, suppress all warnings (yellow box)
LogBox.ignoreLogs(['Warning', 'Possible', 'Non-serializable', 'ViewPropTypes', 'ColorPropType']);
LogBox.ignoreAllLogs(true);

// Register background handler for FCM notifications
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  // Handle the notification data here if needed
});

AppRegistry.registerComponent(appName, () => App);

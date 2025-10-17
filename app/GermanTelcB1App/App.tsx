import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import './src/utils/i18n';

const App: React.FC = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <RootNavigator />
    </>
  );
};

export default App;
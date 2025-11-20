/**
 * App Update Modal Container
 * 
 * Container component that connects the AppUpdateModal to the AppUpdateContext
 */

import React from 'react';
import AppUpdateModal from './AppUpdateModal';
import { useAppUpdate } from '../contexts/AppUpdateContext';

const AppUpdateModalContainer: React.FC = () => {
  const { shouldShowUpdateModal, updateInfo, dismissUpdate, openAppStore } = useAppUpdate();

  if (!updateInfo) {
    return null;
  }

  return (
    <AppUpdateModal
      visible={shouldShowUpdateModal}
      isForced={updateInfo.isForced}
      currentVersion={updateInfo.currentVersion}
      latestVersion={updateInfo.latestVersion}
      message={updateInfo.message}
      onUpdateNow={openAppStore}
      onLater={dismissUpdate}
    />
  );
};

export default AppUpdateModalContainer;


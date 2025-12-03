/**
 * Notification Reminder Modal Container
 * 
 * A container component that manages the display of the NotificationReminderModal
 * and HourPickerModal using the NotificationReminderContext state
 */

import React from 'react';
import NotificationReminderModal from './NotificationReminderModal';
import HourPickerModal from './HourPickerModal';
import { useNotificationReminder } from '../contexts/NotificationReminderContext';

const NotificationReminderModalContainer: React.FC = () => {
  const { 
    showReminderModal, 
    showHourPicker,
    dismissReminder, 
    startEnableFlow, 
    closeReminderModal,
    handleHourSelect,
    closeHourPicker,
  } = useNotificationReminder();

  return (
    <>
      <NotificationReminderModal
        visible={showReminderModal}
        onClose={closeReminderModal}
        onEnable={startEnableFlow}
        onMaybeLater={dismissReminder}
      />
      
      <HourPickerModal
        visible={showHourPicker}
        selectedHour={9} // Default to 9 AM
        onClose={closeHourPicker}
        onHourSelect={handleHourSelect}
      />
    </>
  );
};

export default NotificationReminderModalContainer;


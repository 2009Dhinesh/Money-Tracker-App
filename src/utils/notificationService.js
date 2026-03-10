import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

// Configuration for notifications
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export const checkPermissionStatus = async () => {
  if (isExpoGo) return 'undetermined';
  const { status } = await Notifications.getPermissionsAsync();
  return status;
};

export const requestNotificationPermissions = async () => {
  if (isExpoGo) {
    console.warn('Notifications are not supported in Expo Go. Please use a development build.');
    return 'denied';
  }
  
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return 'denied';
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus === 'granted' && Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return finalStatus;
};

export const scheduleReminderNotification = async (title, body, date) => {
  if (isExpoGo) return null;
  const trigger = new Date(date);
  
  if (trigger <= new Date()) return null;

  trigger.setHours(9, 0, 0, 0);
  if (trigger <= new Date()) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: { type: 'reminder' },
    },
    trigger,
  });
  
  return id;
};

export const sendInstantNotification = async (title, body) => {
  // Allow local push notifications in Expo Go, though background may have issues.
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // null means show it RIGHT NOW
  });
};

export const cancelAllNotifications = async () => {
  if (isExpoGo) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const syncDebtsWithNotifications = async (debts) => {
  await cancelAllNotifications();
  
  for (const debt of debts) {
    if (debt.dueDate && debt.status !== 'completed') {
      const typeLabel = debt.type === 'given' ? 'Recovery' : 'Payment';
      const person = debt.contact?.name || 'someone';
      const amount = debt.remainingAmount || debt.totalAmount;
      
      await scheduleReminderNotification(
        `📅 Debt ${typeLabel} Reminder`,
        `₹${amount.toLocaleString()} is due today from ${person}`,
        debt.dueDate
      );
    }
  }
};

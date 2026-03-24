import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import CustomAlert from '../components/CustomAlert';
import Snackbar from '../components/Snackbar';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    type: 'default',
  });

  const [snackbarConfig, setSnackbarConfig] = useState({
    visible: false,
    message: '',
    actionText: '',
    onAction: null,
    onDismiss: null,
    duration: 5000,
  });

  const snackbarTimeoutRef = useRef(null);

  const showAlert = useCallback((config) => {
    const safeTitle = typeof config.title === 'object' ? JSON.stringify(config.title) : (config.title || '');
    const safeMessage = typeof config.message === 'object' ? JSON.stringify(config.message) : (config.message || '');

    setAlertConfig((prev) => ({
      visible: true,
      title: safeTitle,
      message: safeMessage,
      buttons: config.buttons || [],
      type: config.type || 'default',
    }));
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  const showSnackbar = useCallback((config) => {
    // Clear any existing snackbar timeout
    if (snackbarTimeoutRef.current) clearTimeout(snackbarTimeoutRef.current);

    setSnackbarConfig({
      visible: true,
      message: config.message || '',
      actionText: config.actionText || '',
      onAction: config.onAction || null,
      onDismiss: config.onDismiss || null,
      duration: config.duration || 5000,
    });
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbarConfig((prev) => ({ ...prev, visible: false }));
    if (snackbarTimeoutRef.current) clearTimeout(snackbarTimeoutRef.current);
  }, []);

  const alert = useCallback((titleOrConfig, message, buttons = [], type = 'default') => {
    if (typeof titleOrConfig === 'object') {
      showAlert(titleOrConfig);
    } else {
      showAlert({ title: titleOrConfig, message, buttons, type });
    }
  }, [showAlert]);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert, alert, showSnackbar, hideSnackbar }}>
      {children}
      <CustomAlert
        {...alertConfig}
        onClose={hideAlert}
      />
      <Snackbar
        {...snackbarConfig}
        onDismiss={() => {
          if (snackbarConfig.onDismiss) snackbarConfig.onDismiss();
          hideSnackbar();
        }}
        onAction={() => {
          if (snackbarConfig.onAction) snackbarConfig.onAction();
          hideSnackbar();
        }}
      />
    </AlertContext.Provider>
  );
};

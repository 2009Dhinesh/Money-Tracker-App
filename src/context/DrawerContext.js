import React, { createContext, useContext, useState } from 'react';
import Modal from 'react-native-modal';
import { View, StyleSheet, Dimensions } from 'react-native';
import CustomDrawerContent from '../components/CustomDrawerContent';

const DrawerContext = createContext({
  openDrawer: () => {},
  closeDrawer: () => {},
});

export const useAppDrawer = () => useContext(DrawerContext);

export const DrawerProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <DrawerContext.Provider value={{ openDrawer: () => setVisible(true), closeDrawer: () => setVisible(false) }}>
      {children}
      <Modal
        isVisible={visible}
        animationIn="slideInLeft"
        animationOut="slideOutLeft"
        onBackdropPress={() => setVisible(false)}
        onBackButtonPress={() => setVisible(false)}
        style={styles.modal}
        useNativeDriver
        hideModalContentWhileAnimating
        backdropTransitionOutTiming={100}
        animationInTiming={300}
        animationOutTiming={300}
      >
        <View style={styles.drawerContainer}>
          <CustomDrawerContent onClose={() => setVisible(false)} />
        </View>
      </Modal>
    </DrawerContext.Provider>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  drawerContainer: {
    width: Dimensions.get('window').width * 0.75,
    maxWidth: 320,
    height: '100%',
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, LayoutAnimation, Platform, UIManager, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../constants/theme';
import { useNavigation, useNavigationState } from '@react-navigation/native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DrawerItem = ({ icon, label, onPress, isActive, colors, isSubItem = false }) => (
  <TouchableOpacity
    style={[
      styles.drawerItem,
      isSubItem && styles.subItem,
      isActive && { backgroundColor: `${COLORS.primary}15` }
    ]}
    onPress={onPress}
  >
    <Ionicons 
      name={icon} 
      size={isSubItem ? 20 : 22} 
      color={isActive ? COLORS.primary : colors.textSecondary} 
    />
    <Text style={[
      styles.itemLabel,
      isSubItem && styles.subItemLabel,
      isActive && { color: COLORS.primary, fontWeight: '700' },
      !isActive && { color: colors.textPrimary }
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function CustomDrawerContent({ onClose }) {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const [assetsExpanded, setAssetsExpanded] = useState(false);
  const navigation = useNavigation();

  // Extract active route safely without relying on drawer props
  const state = useNavigationState(s => s);
  const getActiveRouteName = (navState) => {
    if (!navState) return '';
    const route = navState.routes[navState.index];
    if (route.state) return getActiveRouteName(route.state);
    return route.name;
  };
  const activeRouteName = getActiveRouteName(state);

  const navigateTo = (screenName) => {
    if (onClose) onClose();
    navigation.navigate(screenName);
  };

  const handleLogout = () => {
    if (onClose) onClose();
    logout();
  };

  const toggleAssets = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAssetsExpanded(!assetsExpanded);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: 0 }} showsVerticalScrollIndicator={false}>
        {/* -- User Profile Header -- */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.profileImageContainer}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.profileImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>
            {user?.name || 'User'}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
            {user?.email || 'user@example.com'}
          </Text>
        </View>

        {/* -- Navigation Items -- */}
        <View style={styles.menuContainer}>
          <DrawerItem 
            icon="person-outline" 
            label="Profile" 
            onPress={() => navigateTo('Profile')} 
            isActive={activeRouteName === 'Profile'} 
            colors={colors} 
          />

          {/* -- Expandable Assets Menu -- */}
          <TouchableOpacity
            style={[styles.drawerItem, assetsExpanded && { backgroundColor: `${colors.border}50` }]}
            onPress={toggleAssets}
            activeOpacity={0.7}
          >
            <Ionicons name="briefcase-outline" size={22} color={colors.textSecondary} />
            <Text style={[styles.itemLabel, { color: colors.textPrimary, flex: 1 }]}>Assets</Text>
            <Ionicons 
              name={assetsExpanded ? "chevron-up" : "chevron-down"} 
              size={18} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>

          {assetsExpanded && (
            <View style={styles.submenuContainer}>
              <DrawerItem 
                icon="diamond-outline" 
                label="Metals" 
                onPress={() => navigateTo('Metals')} 
                isActive={activeRouteName === 'Metals'} 
                colors={colors}
                isSubItem={true}
              />
              <DrawerItem 
                icon="business-outline" 
                label="Properties" 
                onPress={() => navigateTo('Land')} 
                isActive={activeRouteName === 'Land'} 
                colors={colors}
                isSubItem={true}
              />
            </View>
          )}

          <DrawerItem 
            icon="wallet-outline" 
            label="Net Worth" 
            onPress={() => navigateTo('WealthDashboard')} 
            isActive={activeRouteName === 'WealthDashboard'} 
            colors={colors} 
          />

          <DrawerItem 
            icon="trending-up-outline" 
            label="Investments" 
            onPress={() => navigateTo('Investments')} 
            isActive={activeRouteName === 'Investments'} 
            colors={colors} 
          />

          <DrawerItem 
            icon="people-outline" 
            label="Debts" 
            onPress={() => navigateTo('Debts')} 
            isActive={activeRouteName === 'Debts' || activeRouteName === 'DebtsMain'} 
            colors={colors} 
          />

          <DrawerItem 
            icon="trophy-outline" 
            label="Goals" 
            onPress={() => navigateTo('Goals')} 
            isActive={activeRouteName === 'Goals'} 
            colors={colors} 
          />
        </View>
      </ScrollView>

      {/* -- Bottom Settings / Logout -- */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.footerItem} onPress={() => toggleTheme()}>
          <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={22} color={colors.textSecondary} />
          <Text style={[styles.footerItemLabel, { color: colors.textPrimary }]}>
            {isDark ? "Light Mode" : "Dark Mode"}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.footerItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.expense} />
          <Text style={[styles.footerItemLabel, { color: COLORS.expense, fontWeight: '600' }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  header: {
    paddingTop: 60, // Safe area top (approximate)
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
  },
  profileImageContainer: {
    marginBottom: SPACING.md,
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: FONT_SIZES.sm,
  },
  menuContainer: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  itemLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    marginLeft: SPACING.md,
  },
  submenuContainer: {
    marginLeft: SPACING.xl,
    paddingLeft: SPACING.sm,
    borderLeftWidth: 2,
    borderLeftColor: `${COLORS.primary}30`,
    marginBottom: SPACING.sm,
  },
  subItem: {
    paddingVertical: SPACING.sm,
  },
  subItemLabel: {
    fontSize: FONT_SIZES.sm,
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: 40, // Safe area bottom
    borderTopWidth: 1,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  footerItemLabel: {
    fontSize: FONT_SIZES.base,
    marginLeft: SPACING.md,
  },
});

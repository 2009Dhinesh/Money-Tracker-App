import React from 'react';
import { View, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DrawerProvider } from '../context/DrawerContext';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Screens
// ... auth
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import BudgetScreen from '../screens/BudgetScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ExportScreen from '../screens/ExportScreen';
import AccountsScreen from '../screens/AccountsScreen';
import AccountDetailScreen from '../screens/AccountDetailScreen';
import DeletedAccountsScreen from '../screens/DeletedAccountsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';
import DebtsScreen from '../screens/DebtsScreen';
import AddDebtScreen from '../screens/AddDebtScreen';
import DebtDetailScreen from '../screens/DebtDetailScreen';
import GoldScreen from '../screens/GoldScreen';
import MetalsScreen from '../screens/MetalsScreen';
import LandScreen from '../screens/LandScreen';
import WealthDashboardScreen from '../screens/WealthDashboardScreen';
import GoalsScreen from '../screens/GoalsScreen';
import InvestmentsScreen from '../screens/InvestmentsScreen';
import InvestmentDetailScreen from '../screens/InvestmentDetailScreen';
import BiometricGuard from '../components/BiometricGuard';
import LoadingSpinner from '../components/LoadingSpinner';
import GlassStatusBar from '../components/GlassStatusBar';
import NetworkStatus from '../components/NetworkStatus';

import { COLORS, SPACING, RADIUS, TAB_BAR_HEIGHT } from '../constants/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Auth Stack ───────────────────────────────────────────────
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

// ─── Reusable Common Screens for All Tabs ────────────────────────
const attachCommonScreens = (StackNav) => (
  <>
    <StackNav.Screen name="AddTransaction" component={AddTransactionScreen} options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />
    <StackNav.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ animation: 'slide_from_right' }} />
    <StackNav.Screen name="PaymentMethods" component={PaymentMethodsScreen} options={{ animation: 'slide_from_right' }} />
    <StackNav.Screen name="AddDebt" component={AddDebtScreen} options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />
    <StackNav.Screen name="DebtDetail" component={DebtDetailScreen} options={{ animation: 'slide_from_right' }} />
    <StackNav.Screen name="Gold" component={GoldScreen} options={{ animation: 'slide_from_right' }} />
    <StackNav.Screen name="Metals" component={MetalsScreen} options={{ animation: 'slide_from_right' }} />
    <StackNav.Screen name="Land" component={LandScreen} options={{ animation: 'slide_from_right' }} />
    <StackNav.Screen name="WealthDashboard" component={WealthDashboardScreen} options={{ animation: 'slide_from_right' }} />
    <StackNav.Screen name="Export" component={ExportScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
    <StackNav.Screen name="Goals" component={GoalsScreen} options={{ animation: 'slide_from_right' }} />
    <StackNav.Screen name="Investments" component={InvestmentsScreen} options={{ animation: 'slide_from_right' }} />
    <StackNav.Screen name="InvestmentDetail" component={InvestmentDetailScreen} options={{ animation: 'slide_from_right' }} />
    <StackNav.Screen name="Analysis" component={ReportsScreen} options={{ animation: 'slide_from_right' }} />
    <StackNav.Screen name="Categories" component={CategoriesScreen} options={{ animation: 'slide_from_right' }} />
    <StackNav.Screen name="AccountDetail" component={AccountDetailScreen} options={{ animation: 'slide_from_right' }} />
    <StackNav.Screen name="DeletedAccounts" component={DeletedAccountsScreen} options={{ animation: 'slide_from_right' }} />
  </>
);

// ─── Per-Tab Stacks ──────────────────────────────────────────
const DashStack = createNativeStackNavigator();
const DashboardStack = () => (
  <DashStack.Navigator screenOptions={{ headerShown: false }}>
    <DashStack.Screen name="DashboardMain" component={DashboardScreen} />
    {attachCommonScreens(DashStack)}
  </DashStack.Navigator>
);

const RecStack = createNativeStackNavigator();
const TransactionsStack = () => (
  <RecStack.Navigator screenOptions={{ headerShown: false }}>
    <RecStack.Screen name="RecordsMain" component={TransactionsScreen} />
    {attachCommonScreens(RecStack)}
  </RecStack.Navigator>
);

const AccStack = createNativeStackNavigator();
const AccountsStack = () => (
  <AccStack.Navigator screenOptions={{ headerShown: false }}>
    <AccStack.Screen name="AccountsMain" component={AccountsScreen} />
    {attachCommonScreens(AccStack)}
  </AccStack.Navigator>
);

const CatStack = createNativeStackNavigator();
const CategoriesStack = () => (
  <CatStack.Navigator screenOptions={{ headerShown: false }}>
    <CatStack.Screen name="CategoriesMain" component={CategoriesScreen} />
    {attachCommonScreens(CatStack)}
  </CatStack.Navigator>
);

const BudgStack = createNativeStackNavigator();
const BudgetsStack = () => (
  <BudgStack.Navigator screenOptions={{ headerShown: false }}>
    <BudgStack.Screen name="BudgetsMain" component={BudgetScreen} />
    {attachCommonScreens(BudgStack)}
  </BudgStack.Navigator>
);

const DebtStack = createNativeStackNavigator();
const DebtsStack = () => (
  <DebtStack.Navigator screenOptions={{ headerShown: false }}>
    <DebtStack.Screen name="DebtsMain" component={DebtsScreen} />
    {attachCommonScreens(DebtStack)}
  </DebtStack.Navigator>
);

const RepStack = createNativeStackNavigator();
const ReportsStack = () => (
  <RepStack.Navigator screenOptions={{ headerShown: false }}>
    <RepStack.Screen name="ReportsMain" component={ReportsScreen} />
    {attachCommonScreens(RepStack)}
  </RepStack.Navigator>
);

// ─── Custom Center FAB Button ────────────────────────────────────
const CustomTabBarButton = ({ children, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={{
        top: -20,
        justifyContent: 'center',
        alignItems: 'center',
        ...styles.shadow
      }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={{
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        elevation: 5,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {children}
      </View>
    </TouchableOpacity>
  );
};

// ─── Tab Bar ──────────────────────────────────────────────────
const MainTabs = ({ navigation }) => {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        unmountOnBlur: true,
        tabBarShowLabel: route.name !== 'AddAction', // Hide label for the center button
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: TAB_BAR_HEIGHT,
          paddingBottom: SPACING.md,
          paddingTop: SPACING.sm,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 16,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: { marginBottom: -2 },
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'AddAction') {
            return <Ionicons name="add" size={32} color="#fff" />;
          }

          const icons = {
            Dashboard: focused ? 'home' : 'home-outline',
            Transactions: focused ? 'list' : 'list-outline',
            Accounts: focused ? 'wallet' : 'wallet-outline',
            Analysis: focused ? 'bar-chart' : 'bar-chart-outline',
          };
          return (
            <View style={focused ? [styles.iconActive, { backgroundColor: `${COLORS.primary}15` }] : null}>
              <Ionicons name={icons[route.name]} size={focused ? 22 : 20} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Transactions" component={TransactionsStack} />
      <Tab.Screen 
        name="AddAction" 
        component={View} // Dummy component, we override onPress
        options={{
          tabBarButton: (props) => (
            <CustomTabBarButton 
              onPress={() => navigation.navigate('AddTransaction')}
            >
              <Ionicons name="add" size={32} color="#fff" />
            </CustomTabBarButton>
          )
        }}
      />
      <Tab.Screen name="Accounts" component={AccountsStack} />
      <Tab.Screen name="Analysis" component={ReportsStack} />
      <Tab.Screen 
        name="Debts" 
        component={DebtsStack} 
        options={{ tabBarButton: () => null }} 
      />
      <Tab.Screen 
        name="Budgets" 
        component={BudgetsStack} 
        options={{ tabBarButton: () => null }} 
      />
    </Tab.Navigator>
  );
};

// ─── Main App Stack (Tabs + Modals) ──────────────────────────
const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    {/* Profile covers the tab bar */}
    <Stack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ animation: 'slide_from_right' }}
    />
    {/* Global Drawer Screens */}
    <Stack.Screen name="Metals" component={MetalsScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="Land" component={LandScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="WealthDashboard" component={WealthDashboardScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="Investments" component={InvestmentsScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="Goals" component={GoalsScreen} options={{ animation: 'slide_from_right' }} />
  </Stack.Navigator>
);
// ─── Root Navigator ──────────────────────────────────────────
export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, isDark } = useTheme();

  if (isLoading) return <LoadingSpinner message="Loading SalaryCalc..." />;

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: COLORS.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.textPrimary,
          border: colors.border,
          notification: COLORS.expense,
        },
      }}
    >
      <GlassStatusBar />
      <NetworkStatus />
      {isAuthenticated ? (
        <BiometricGuard>
          <DrawerProvider>
            <AppStack />
          </DrawerProvider>
        </BiometricGuard>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  iconActive: {
    width: 38, height: 28,
    borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center',
  },
  shadow: {
    shadowColor: '#6C63FF',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }
});

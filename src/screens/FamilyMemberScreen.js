import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Image, RefreshControl, Modal, FlatList
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { useAccounts } from '../hooks/useAccounts';
import familyApi from '../api/familyApi';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, SPACING, FONT_SIZES, RADIUS, SHADOWS } from '../constants/theme';

export default function FamilyMemberScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { alert: showAlert } = useAlert();
  const { user } = useAuth();
  const { accounts, fetchAccounts } = useAccounts();
  
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [familyCode, setFamilyCode] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Approval Modal State
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedAccountPerms, setSelectedAccountPerms] = useState({}); // { accountId: 'read' | 'write' }
  
  // Member Detail State
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [memberDetail, setMemberDetail] = useState(null);
  const [memberTransactions, setMemberTransactions] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedMemberObj, setSelectedMemberObj] = useState(null); // Full member object from list

  const fetchData = useCallback(async () => {
    try {
      const [membersRes, requestsRes] = await Promise.all([
        familyApi.getFamilyMembers(),
        familyApi.getConnectionRequests()
      ]);

      if (membersRes.success) {
        setMembers(membersRes.members || []);
        setFamilyCode(membersRes.familyCode);
      }

      if (requestsRes.success) {
        setPendingRequests(requestsRes.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      fetchAccounts(); 
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleOpenApproval = (req) => {
    setSelectedRequest(req);
    setSelectedAccountPerms({});
    setApprovalModalVisible(true);
  };

  const toggleAccountSelection = (accountId) => {
    setSelectedAccountPerms(prev => {
      const next = { ...prev };
      if (next[accountId]) {
        delete next[accountId];
      } else {
        next[accountId] = 'read';
      }
      return next;
    });
  };

  const togglePermission = (accountId) => {
    setSelectedAccountPerms(prev => ({
      ...prev,
      [accountId]: prev[accountId] === 'read' ? 'write' : 'read'
    }));
  };

  const submitApproval = async (status) => {
    if (!selectedRequest) return;
    
    try {
      setLoading(true);
      const permsArray = Object.entries(selectedAccountPerms).map(([accountId, access]) => ({
        accountId,
        access
      }));

      await familyApi.handleJoinRequest(selectedRequest._id, {
        status,
        accountPermissions: permsArray
      });

      showAlert(
        status === 'approved' ? 'Approved' : 'Rejected',
        `User request has been ${status}.`,
        [],
        status === 'approved' ? 'success' : 'warning'
      );
      
      setApprovalModalVisible(false);
      fetchData();
    } catch (err) {
      showAlert('Error', err.message, [], 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionRequest = async (requestId, status) => {
    try {
      setLoading(true);
      const res = await familyApi.handleConnectionRequest(requestId, status);
      if (res.success) {
        showAlert(
          status === 'accepted' ? 'Accepted ✅' : 'Rejected ❌',
          `Connection request ${status}.`,
          [],
          status === 'accepted' ? 'success' : 'warning'
        );
        fetchData();
      }
    } catch (err) {
      showAlert('Error', err.response?.data?.message || err.message, [], 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberClick = async (member) => {
    try {
      setLoadingDetails(true);
      setMemberModalVisible(true);
      setSelectedMemberObj(member); // Store the original member object
      setMemberDetail(member.userId); // member.userId is populated
      setMemberTransactions([]);

      const res = await familyApi.getMemberDetails(member.userId._id);
      if (res.success) {
        setMemberDetail({
          ...res.member,
          permissions: res.permissions.accounts,
          accessType: res.permissions.accessType
        });
        setMemberTransactions(res.transactions);
      }
    } catch (err) {
      if (err.status !== 403) {
        console.error('Fetch member details error:', err);
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDisconnect = () => {
    showAlert(
      'Disconnect?', 
      `Are you sure you want to remove ${memberDetail?.name} from your family? Both of you will lose shared access.`, 
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await familyApi.disconnectMember(memberDetail._id);
              setMemberModalVisible(false);
              fetchData();
              showAlert('Success', 'Member disconnected.', [], 'success');
            } catch (err) {
              showAlert('Error', err.response?.data?.message || err.message, [], 'error');
            } finally {
              setLoading(false);
            }
          }
        }
      ],
      'warning'
    );
  };

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    showAlert('Copied', 'Invite code copied to clipboard!', [], 'success');
  };

  if (loading && !refreshing) return <LoadingSpinner message="Loading family group..." />;

  const isFamilyAdmin = members.some(m => m.role === 'admin' && m.userId?._id === user?._id);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Family Members</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.navigate('FamilyReport')} style={[styles.headerIcon, { marginRight: 8 }]}>
            <Ionicons name="bar-chart" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('FamilySetup')} style={styles.headerIcon}>
            <Ionicons name="add" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>PENDING REQUESTS ({pendingRequests.length})</Text>
            {pendingRequests.map(req => (
              <View 
                key={req._id} 
                style={[styles.requestCard, { backgroundColor: colors.surface, borderColor: COLORS.primary }]}
              >
                <View style={styles.requestHeader}>
                  <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.avatarText}>{req.sender?.name?.charAt(0)}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.textPrimary }]}>{req.sender?.name}</Text>
                    <Text style={[styles.memberRole, { color: colors.textSecondary }]}>{req.sender?.email}</Text>
                  </View>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity 
                    onPress={() => handleConnectionRequest(req._id, 'accepted')}
                    style={[styles.actionBtn, { backgroundColor: COLORS.income }]}
                  >
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleConnectionRequest(req._id, 'rejected')}
                    style={[styles.actionBtn, { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border }]}
                  >
                    <Ionicons name="close" size={18} color={colors.textSecondary} />
                    <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {members.length === 0 && pendingRequests.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No Family Members"
            subtitle="Connect with family members to share account access and track expenses."
          >
            <Button title="Connect Member" onPress={() => navigation.navigate('FamilySetup')} />
          </EmptyState>
        ) : (
          <View>
            <View style={[styles.familyCard, { backgroundColor: colors.surface }, SHADOWS.sm]}>
              <View style={[styles.familyIconWrap, { backgroundColor: `${COLORS.primary}15` }]}>
                <Ionicons name="qr-code-outline" size={32} color={COLORS.primary} />
              </View>
              <View style={styles.familyInfo}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: 0 }]}>MY FAMILY CODE</Text>
                <TouchableOpacity 
                   onPress={() => copyToClipboard(familyCode)}
                   style={styles.codeBadge}
                >
                  <Text style={styles.codeText}>{familyCode || 'Generating...'}</Text>
                  <Ionicons name="copy-outline" size={12} color="#fff" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>FAMILY MEMBERS</Text>
              {members.map(member => (
                <TouchableOpacity 
                  key={member._id} 
                  style={[styles.memberCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleMemberClick(member)}
                >
                  <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.avatarText}>{member.userId?.name?.charAt(0)}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.textPrimary }]}>{member.userId?.name}</Text>
                    <Text style={[styles.memberRole, { color: colors.textSecondary }]}>
                      {member.userId?.email}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Approval Modal removed as per P2P specs */}

      {/* Member Details Modal */}
      <Modal visible={memberModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, height: '80%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.avatar, { backgroundColor: COLORS.primary, width: 32, height: 32, borderRadius: 16 }]}>
                  <Text style={[styles.avatarText, { fontSize: 14 }]}>{memberDetail?.name?.charAt(0)}</Text>
                </View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary, marginLeft: 10 }]}>{memberDetail?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setMemberModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.memberActionsRow}>
              <Button 
                title={selectedMemberObj?.permissions?.accessType === 'none' ? "Add Permissions" : "Edit Permissions"}
                onPress={() => {
                  setMemberModalVisible(false);
                  navigation.navigate('PermissionSetup', { member: { ...memberDetail, permissions: selectedMemberObj.permissions } });
                }}
                type="outline"
                size="sm"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button 
                title="Disconnect" 
                onPress={handleDisconnect}
                type="outline"
                size="sm"
                style={{ flex: 1, borderColor: COLORS.expense }}
                textStyle={{ color: COLORS.expense }}
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Shared with me Section */}
              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>SHARED WITH YOU</Text>
                
                {memberDetail?.accessType === 'all' ? (
                  <View style={[styles.permCard, { backgroundColor: `${COLORS.primary}10`, borderColor: COLORS.primary, borderWidth: 1 }]}>
                    <View style={[styles.permIcon, { backgroundColor: COLORS.primary }]}>
                      <Ionicons name="eye" size={20} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.permName, { color: colors.textPrimary }]}>All Accounts</Text>
                      <Text style={{ fontSize: 10, color: colors.textSecondary }}>You can see all of {memberDetail?.name}'s accounts.</Text>
                    </View>
                  </View>
                ) : (memberDetail?.accessType === 'custom' && memberDetail?.permissions?.length > 0) ? (
                  memberDetail.permissions.map(p => (
                    <View key={p._id} style={[styles.permCard, { backgroundColor: colors.surfaceAlt }]}>
                      <View style={styles.permIcon}>
                        <Text style={{ fontSize: 16 }}>{p.accountId?.icon || '💰'}</Text>
                      </View>
                      <Text style={[styles.permName, { color: colors.textPrimary, flex: 1 }]}>{p.accountId?.name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: p.access === 'write' ? `${COLORS.income}15` : `${COLORS.primary}15` }]}>
                        <Text style={[styles.statusText, { color: p.access === 'write' ? COLORS.income : COLORS.primary }]}>
                          {p.access === 'write' ? 'Read & Write' : 'Read Only'}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.sm, fontStyle: 'italic', paddingLeft: 4 }}>
                    {memberDetail?.name} hasn't shared any accounts with you yet.
                  </Text>
                )}
              </View>

              {/* Shared by me Section (What I share with them) */}
              <View style={[styles.detailSection, { marginTop: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm }}>
                  <Text style={[styles.sectionTitle, { color: COLORS.income, marginBottom: 0 }]}>YOU ARE SHARING</Text>
                  <TouchableOpacity onPress={() => {
                    setMemberModalVisible(false);
                    navigation.navigate('PermissionSetup', { member: { ...memberDetail, permissions: selectedMemberObj.permissions } });
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: COLORS.primary }}>EDIT</Text>
                  </TouchableOpacity>
                </View>

                {selectedMemberObj?.permissions?.accessType === 'all' ? (
                  <View style={[styles.permCard, { backgroundColor: `${COLORS.income}10`, borderColor: COLORS.income, borderWidth: 1 }]}>
                    <View style={[styles.permIcon, { backgroundColor: COLORS.income }]}>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.permName, { color: colors.textPrimary }]}>All Accounts</Text>
                      <Text style={{ fontSize: 10, color: colors.textSecondary }}>Member can see all current and future accounts.</Text>
                    </View>
                  </View>
                ) : (selectedMemberObj?.permissions?.accessType === 'custom' && selectedMemberObj?.permissions?.accounts?.filter(p => p.canView).length > 0) ? (
                  selectedMemberObj.permissions.accounts.filter(p => p.canView).map(p => {
                    const accInfo = accounts.find(a => a._id === (p.accountId?._id || p.accountId));
                    return (
                      <View key={p._id} style={[styles.permCard, { backgroundColor: colors.surfaceAlt }]}>
                        <View style={styles.permIcon}>
                          <Text style={{ fontSize: 16 }}>{accInfo?.icon || '💰'}</Text>
                        </View>
                        <Text style={[styles.permName, { color: colors.textPrimary, flex: 1 }]}>{accInfo?.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: p.canEdit ? `${COLORS.income}15` : `${COLORS.primary}15` }]}>
                          <Text style={[styles.statusText, { color: p.canEdit ? COLORS.income : COLORS.primary }]}>
                            {p.canEdit ? 'Read & Write' : 'Read Only'}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={{ color: colors.textTertiary, fontSize: FONT_SIZES.sm, fontStyle: 'italic', paddingLeft: 4 }}>
                    You haven't shared any accounts with {memberDetail?.name}.
                  </Text>
                )}
              </View>

              {/* Transactions Section */}
              <View style={styles.detailSection}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECENT TRANSACTIONS</Text>
                {loadingDetails ? (
                  <LoadingSpinner message="Fetching transactions..." />
                ) : memberTransactions.length > 0 ? (
                  memberTransactions.map(tx => (
                    <View key={tx._id} style={[styles.txCard, { borderBottomColor: colors.border }]}>
                      <View style={[styles.txIcon, { backgroundColor: `${tx.category?.color || COLORS.primary}15` }]}>
                        <Text style={{ fontSize: 16 }}>{tx.category?.icon || '💸'}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: SPACING.md }}>
                        <Text style={[styles.txTitle, { color: colors.textPrimary }]} numberOfLines={1}>{tx.title}</Text>
                        <Text style={[styles.txDate, { color: colors.textSecondary }]}>
                          {new Date(tx.date).toLocaleDateString()} • {tx.account?.name}
                        </Text>
                      </View>
                      <Text style={[styles.txAmount, { color: tx.type === 'income' ? COLORS.income : COLORS.expense }]}>
                        {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyTransactions}>
                    <Ionicons 
                      name={(!memberDetail?.permissions || memberDetail.permissions.length === 0) ? "lock-closed-outline" : "receipt-outline"} 
                      size={32} 
                      color={colors.textTertiary} 
                    />
                    <Text style={{ color: colors.textTertiary, marginTop: SPACING.sm, textAlign: 'center' }}>
                      {(!memberDetail?.permissions || memberDetail.permissions.length === 0) 
                        ? "This member hasn't shared any accounts with you yet." 
                        : "No recent shared transactions."}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingBottom: SPACING.md, paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800' },
  headerIcon: { padding: 4 },
  scroll: { padding: SPACING.xl },
  familyCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.lg, borderRadius: RADIUS.xl,
    marginBottom: SPACING.xl,
  },
  familyIconWrap: { width: 56, height: 56, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  familyInfo: { flex: 1, marginLeft: SPACING.md },
  familyName: { fontSize: FONT_SIZES.xl, fontWeight: '800' },
  codeBadge: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: COLORS.primary, paddingVertical: 2, paddingHorizontal: 8, 
    borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 
  },
  codeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: 10, fontWeight: '800', marginBottom: SPACING.md, letterSpacing: 1 },
  memberCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.md, borderRadius: RADIUS.lg,
    borderWidth: 1, marginBottom: SPACING.sm,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  memberInfo: { flex: 1, marginLeft: SPACING.md },
  memberName: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  memberRole: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], padding: SPACING.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800' },
  modalSubtitle: { fontSize: FONT_SIZES.sm, marginBottom: SPACING.md },
  permItem: { paddingVertical: SPACING.md, borderBottomWidth: 1 },
  permRow: { flexDirection: 'row', alignItems: 'center' },
  permName: { fontSize: FONT_SIZES.base, fontWeight: '600' },
  permToggleRow: { flexDirection: 'row', marginTop: SPACING.sm, marginLeft: 34 },
  permBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.full, marginRight: 10, backgroundColor: 'rgba(0,0,0,0.05)' },
  permBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.textSecondary },
  modalActions: { flexDirection: 'row', marginTop: SPACING.xl, marginBottom: SPACING.xl },
  memberActionsRow: { flexDirection: 'row', marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingBottom: 16 },
  // Member Detail Specific Styles
  detailSection: { marginTop: SPACING.xl },
  permCard: { 
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md, 
    borderRadius: RADIUS.md, marginBottom: SPACING.xs 
  },
  permIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  txCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1 },
  txIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontSize: FONT_SIZES.base, fontWeight: '600' },
  txDate: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: FONT_SIZES.base, fontWeight: '700' },
  emptyTransactions: { alignItems: 'center', paddingVertical: SPACING.xl },
  // Request Specific Styles
  requestCard: {
    padding: SPACING.md, borderRadius: RADIUS.lg,
    borderWidth: 1.5, marginBottom: SPACING.md,
    ...SHADOWS.sm
  },
  requestHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  requestActions: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: RADIUS.md, gap: 4
  },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

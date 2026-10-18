import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, TabId, HIDDEN_TABS } from './components/Sidebar';
import { VoiceSecretaryModal } from './components/VoiceSecretaryModal';
import { VisitorCameraModal } from './components/VisitorCameraModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { apiClient } from './services/apiClient';
import { readLiveDataSnapshot, writeLiveDataSnapshot } from './services/dataCache';

// Tabs
import { DashboardTab } from './components/tabs/DashboardTab';
import { ReceptionPetsTab } from './components/tabs/ReceptionPetsTab';
import { AppointmentsTab } from './components/tabs/AppointmentsTab';
import { MedicalRecordsTab } from './components/tabs/MedicalRecordsTab';
import { BoardingTab } from './components/tabs/BoardingTab';
import { CashierFinanceTab } from './components/tabs/CashierFinanceTab';
import { AttendanceTab } from './components/tabs/AttendanceTab';
import { PrintTemplatesTab } from './components/tabs/PrintTemplatesTab';
import { AiVetAssistantTab } from './components/tabs/AiVetAssistantTab';
import { DvrCctvTab } from './components/tabs/DvrCctvTab';
import { CloudSyncMigrationTab } from './components/tabs/CloudSyncMigrationTab';
import { PetShopTab } from './components/tabs/PetShopTab';
import { PetShopMdiTab } from './components/tabs/PetShopMdiTab';
import { ItDeveloperIdeTab } from './components/tabs/ItDeveloperIdeTab';
import { SurgerySuiteTab } from './components/tabs/SurgerySuiteTab';
import { GroomingSuiteTab } from './components/tabs/GroomingSuiteTab';
import { TelephonySecretaryTab } from './components/tabs/TelephonySecretaryTab';

// Modals
import { ClinicProfileSettingsModal } from './components/ClinicProfileSettingsModal';
import { SnappPetTaxiModal } from './components/SnappPetTaxiModal';
import { AccessMatrixManagementModal } from './components/AccessMatrixManagementModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { MobileTabletConnectModal } from './components/MobileTabletConnectModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SeniorManagerPanel } from './components/SeniorManagerPanel';
import { StaffTasksDelegationTab } from './components/StaffTasksDelegationTab';
import { InternalMessengerTab } from './components/InternalMessengerTab';
import { EmergencySummonModal } from './components/EmergencySummonModal';
import { realtimeChat } from './services/realtimeChatService';
import { UserProfileModal } from './components/UserProfileModal';
import { InviteUserModal } from './components/InviteUserModal';
import { InviteSetupPage } from './components/InviteSetupPage';
import { PublicLandingPage } from './components/PublicLandingPage';

// Initial Mock Seed Data
import {
  initialUsers,
  initialOwners,
  initialPets,
  initialVisits,
  initialAppointments,
  initialBoardingRecords,
  initialStaffAttendance,
  initialInvoices,
  initialPrintTemplates,
  initialNotifications,
  initialSyncQueue,
  initialPetShopProducts,
  initialSweepSessions,
  initialLoyaltyMembers,
  initialSpinRewards,
  initialCryptoRates,
  initialAIAgentDrafts,
  initialLearningRules,
  initialClinicQueues,
  initialDevFiles,
  initialDevLogs,
  initialCodingPrompts,
  initialApiEndpointTests,
  initialSurgeryOperations,
  initialSurgeryEmergencyProtocols,
  initialGroomingStyles,
  initialGroomingPortfolio,
  initialStaffTipLedger,
  initialStaffPurchasePrivileges,
  initialAccessMatrix,
  initialAccessAuditLogs,
  initialPetShopSuppliers,
  initialClinicProfile,
} from './data/mockDatabase';

const defaultTestPassword = (import.meta as any).env?.VITE_AUTH_BOOTSTRAP_TOKEN || 'mpc-bootstrap-2026-secure-token-x7k9m2';
const loginTestProfiles = [
  { username: 'admin', password: (import.meta as any).env?.VITE_TEST_ADMIN_PASSWORD || defaultTestPassword, label: 'ظ…ط¯غŒط± ع©ظ„غŒظ†غŒع©' },
  { username: 'arjanak.p', password: (import.meta as any).env?.VITE_TEST_IT_PASSWORD || defaultTestPassword, label: 'ع©ط§ط±ط´ظ†ط§ط³ IT' },
  { username: 'dr.amin.bayati', password: (import.meta as any).env?.VITE_TEST_CHIEF_PASSWORD || defaultTestPassword, label: 'ظ…ط¯غŒط± ط§ط±ط´ط¯ ظˆ ظ¾ط²ط´ع© ط§ط±ط´ط¯' },
  { username: 'doctor.mehregan', password: (import.meta as any).env?.VITE_TEST_DOCTOR_PASSWORD || defaultTestPassword, label: 'ط¯ط§ظ…ظ¾ط²ط´ع©' },
  { username: 'reception.mehregan', password: (import.meta as any).env?.VITE_TEST_RECEPTION_PASSWORD || defaultTestPassword, label: 'ظ¾ط°غŒط±ط´' },
  { username: 'grooming.mehregan', password: (import.meta as any).env?.VITE_TEST_GROOMING_PASSWORD || defaultTestPassword, label: 'ط¢ط±ط§غŒط´ع¯ط±' },
  { username: 'cashier.mehregan', password: (import.meta as any).env?.VITE_TEST_CASHIER_PASSWORD || defaultTestPassword, label: 'طµظ†ط¯ظˆظ‚ط¯ط§ط±' },
  { username: 'petshop.buy', password: (import.meta as any).env?.VITE_TEST_BUY_PASSWORD || defaultTestPassword, label: 'ط®ط±غŒط¯ ظ¾طھâ€Œط´ط§ظ¾' },
  { username: 'petshop.sales', password: (import.meta as any).env?.VITE_TEST_SALES_PASSWORD || defaultTestPassword, label: 'ظپط±ظˆط´ ظ¾طھâ€Œط´ط§ظ¾' },
  { username: 'pet.owner', password: (import.meta as any).env?.VITE_TEST_OWNER_PASSWORD || defaultTestPassword, label: 'ط³ط±ظ¾ط±ط³طھ ظ¾طھ' },
];

import {
  User,
  Pet,
  Owner,
  VisitRecord,
  Appointment,
  BoardingRecord,
  StaffAttendance,
  Invoice,
  PrintTemplate,
  NotificationItem,
  CloudSyncQueueItem,
  MedicalAttachment,
  PetShopProduct,
  SweepVideoAnalysisSession,
  LoyaltyMember,
  SpinWheelReward,
  CryptoRates,
  AIAgentMarketingDraft,
  AIAgentLearningRule,
  ClinicQueueDefinition,
  DevIdeFile,
  DevScriptExecutionLog,
  AICodingPromptHistory,
  ApiEndpointTestItem,
  SurgeryOperationSession,
  GroomingStyleModel,
  GroomingPortfolioItem,
  StaffTipLedgerEntry,
  StaffPurchasePrivilege,
  RoleAccessMatrix,
  AccessAuditLog,
  PetShopSupplier,
  ClinicProfileConfig,
} from './types';

export default function App() {
  const inviteToken = new URLSearchParams(window.location.search).get('invite');
  // Global State
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const cacheVersionRef = useRef<string | null>(null);
  const refreshLockRef = useRef<Promise<void> | null>(null);
  const isRefreshingRef = useRef(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data Collections
  const [pets, setPets] = useState<Pet[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queues, setQueues] = useState<ClinicQueueDefinition[]>([]);
  const [boardingRecords, setBoardingRecords] = useState<BoardingRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<StaffAttendance[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [printTemplates, setPrintTemplates] = useState<PrintTemplate[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [syncQueue, setSyncQueue] = useState<CloudSyncQueueItem[]>([]);

  // IT Developer Suite State
  const [devFiles, setDevFiles] = useState<DevIdeFile[]>([]);
  const [devLogs, setDevLogs] = useState<DevScriptExecutionLog[]>([]);
  const [promptHistory, setPromptHistory] = useState<AICodingPromptHistory[]>([]);
  const [apiTests, setApiTests] = useState<ApiEndpointTestItem[]>([]);

  // Smart Pet Shop State
  const [products, setProducts] = useState<PetShopProduct[]>([]);
  const [suppliers, setSuppliers] = useState<PetShopSupplier[]>([]);
  const [staffPurchasePrivileges, setStaffPurchasePrivileges] = useState<StaffPurchasePrivilege[]>([]);
  const [sweepSessions, setSweepSessions] = useState<SweepVideoAnalysisSession[]>([]);
  const [loyaltyMembers, setLoyaltyMembers] = useState<LoyaltyMember[]>([]);
  const [spinRewards, setSpinRewards] = useState<SpinWheelReward[]>([]);
  const [cryptoRates, setCryptoRates] = useState<CryptoRates>({} as CryptoRates);
  const [aiAgentDrafts, setAiAgentDrafts] = useState<AIAgentMarketingDraft[]>([]);
  const [learningRules, setLearningRules] = useState<AIAgentLearningRule[]>([]);

  // Surgery & Grooming State
  const [surgerySessions, setSurgerySessions] = useState<SurgeryOperationSession[]>([]);
  const [groomingStyles, setGroomingStyles] = useState<GroomingStyleModel[]>([]);
  const [groomingPortfolio, setGroomingPortfolio] = useState<GroomingPortfolioItem[]>([]);
  const [staffTipLedger, setStaffTipLedger] = useState<StaffTipLedgerEntry[]>([]);

  // Clinic Profile & Access Control State
  const [clinicProfile, setClinicProfile] = useState<ClinicProfileConfig>(initialClinicProfile);
  const [accessMatrix, setAccessMatrix] = useState<RoleAccessMatrix>(initialAccessMatrix);
  const [accessAuditLogs, setAccessAuditLogs] = useState<AccessAuditLog[]>(initialAccessAuditLogs);

  // Modals & Drawers
  const [isVoiceSecretaryOpen, setIsVoiceSecretaryOpen] = useState(false);
  const [isVisitorCameraOpen, setIsVisitorCameraOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSnappTaxiOpen, setIsSnappTaxiOpen] = useState(false);
  const [isClinicProfileOpen, setIsClinicProfileOpen] = useState(false);
  const [isAccessMatrixOpen, setIsAccessMatrixOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMobileConnectOpen, setIsMobileConnectOpen] = useState(false);
  const [selectedPetForDrawer, setSelectedPetForDrawer] = useState<Pet | null>(null);

  // Print Passport / Invoice direct trigger modal
  const [printModalData, setPrintModalData] = useState<{
    isOpen: boolean;
    title: string;
    htmlContent: string;
  }>({
    isOpen: false,
    title: '',
    htmlContent: '',
  });

  // Preloaded JSON for Migration Cleansing from SQL Server extraction
  const [migrationJsonPayload, setMigrationJsonPayload] = useState<string | undefined>(undefined);
  const [messengerInitialRoomId, setMessengerInitialRoomId] = useState<string | undefined>(undefined);

  // Role Switcher Handler
  const handleRoleChange = (newRole: User['role']) => {
    const matchingUser = initialUsers.find((u) => u.role === newRole) || {
      id: `user-${Date.now()}`,
      username: newRole,
      name: `ع©ط§ط±ط¨ط± (${newRole})`,
      role: newRole,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      status: 'active' as const,
    };
    setCurrentUser(matchingUser);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const result = await apiClient.login(loginUsername, loginPassword);
      setCurrentUser(result.user as User);
      setIsAuthenticated(true);
    } catch (error: any) {
      setLoginError(error?.message || 'ظˆط±ظˆط¯ ظ†ط§ظ…ظˆظپظ‚ ط¨ظˆط¯.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    apiClient.getCurrentUser()
      .then((user) => {
        setCurrentUser(user as User);
        setIsAuthenticated(true);
        if (user) {
          realtimeChat.init({
            username: user.username,
            name: user.name,
            role: user.role,
          });
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      realtimeChat.updateUserInfo({
        username: currentUser.username,
        name: currentUser.name,
        role: currentUser.role,
      });
    }
  }, [currentUser?.username, currentUser?.role, isAuthenticated]);

  const handleLogout = async () => {
    await apiClient.logout();
    setIsAuthenticated(false);
    setLoginPassword('');
  };

  // Global Alt+F2 keyboard shortcut listener to open voice secretary
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && (e.key === 'F2' || e.code === 'F2')) || (e.key === 'F2' && e.altKey)) {
        e.preventDefault();
        setIsVoiceSecretaryOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Hydrate persistent data from server API on boot and on sync/migration
  const refreshAllServerData = useCallback(async () => {
    if (isRefreshingRef.current) return;
    if (refreshLockRef.current) {
      try { await refreshLockRef.current; } catch {}
      return;
    }

    isRefreshingRef.current = true;
    setHydrationError(null);

    const promise = (async () => {
      try {
        const dataVersion = await apiClient.getDataVersion();
        if (dataVersion.notModified) return;
        if (cacheVersionRef.current === dataVersion.version) return;
        const [
          serverPatients,
          serverOwners,
          serverVisits,
          serverVaccinations,
          serverInvoices,
          serverAppointments,
          serverQueues,
          serverBoarding,
          serverAttendance,
          serverProducts,
          serverSuppliers,
          serverLoyalty,
          serverSurgery,
          serverGroomingStyles,
          serverGroomingPortfolio,
          serverAccessMatrix,
          serverProfile,
          dbStatus,
        ] = await Promise.all([
          apiClient.getPatients(),
          apiClient.getOwners(),
          apiClient.getVisits(),
          apiClient.getVaccinations(),
          apiClient.getInvoices(),
          apiClient.getAppointments(),
          apiClient.getQueues(),
          apiClient.getBoarding(),
          apiClient.getAttendance(),
          apiClient.getPetShopProducts(),
          apiClient.getSuppliers(),
          apiClient.getLoyaltyMembers(),
          apiClient.getSurgerySessions(),
          apiClient.getGroomingStyles(),
          apiClient.getGroomingPortfolio(),
          apiClient.getAccessMatrix(),
          apiClient.getClinicProfile(),
          apiClient.getDatabaseStatus(),
        ]);

        if (dbStatus && dbStatus.initialized) {
          setPets(serverPatients || []);
          setOwners(serverOwners || []);
          setVisits(serverVisits || []);
          setVaccinations(serverVaccinations || []);
          setInvoices(serverInvoices || []);
          setAppointments(serverAppointments || []);
          setQueues(serverQueues && serverQueues.length > 0 ? serverQueues : initialClinicQueues);
          setBoardingRecords(serverBoarding || []);
          setAttendanceRecords(serverAttendance || []);
          setProducts(serverProducts || []);
          setSuppliers(serverSuppliers || []);
          setLoyaltyMembers(serverLoyalty || []);
          setSurgerySessions(serverSurgery || []);
          if (serverGroomingStyles && serverGroomingStyles.length > 0) {
            setGroomingStyles(serverGroomingStyles);
          }
          setGroomingPortfolio(serverGroomingPortfolio || []);
          if (serverAccessMatrix) setAccessMatrix(serverAccessMatrix);
          if (serverProfile && serverProfile.clinicName) setClinicProfile(serverProfile);
        } else {
          if (serverPatients && serverPatients.length > 0) setPets(serverPatients);
          if (serverOwners && serverOwners.length > 0) setOwners(serverOwners);
          if (serverVisits && serverVisits.length > 0) setVisits(serverVisits);
          if (serverVaccinations && serverVaccinations.length > 0) setVaccinations(serverVaccinations);
          if (serverInvoices && serverInvoices.length > 0) setInvoices(serverInvoices);
          if (serverAppointments && serverAppointments.length > 0) setAppointments(serverAppointments);
          if (serverQueues && serverQueues.length > 0) setQueues(serverQueues);
          if (serverBoarding && serverBoarding.length > 0) setBoardingRecords(serverBoarding);
          if (serverAttendance && serverAttendance.length > 0) setAttendanceRecords(serverAttendance);
          if (serverProducts && serverProducts.length > 0) setProducts(serverProducts);
          if (serverProfile && serverProfile.clinicName) setClinicProfile(serverProfile);
        }

        cacheVersionRef.current = dataVersion.version;
        await writeLiveDataSnapshot(currentUser.username, {
          version: dataVersion.version,
          savedAt: new Date().toISOString(),
          data: {
            pets: serverPatients || [],
            owners: serverOwners || [],
            visits: serverVisits || [],
            vaccinations: serverVaccinations || [],
            invoices: serverInvoices || [],
            appointments: serverAppointments || [],
            queues: serverQueues || [],
            boardingRecords: serverBoarding || [],
            attendanceRecords: serverAttendance || [],
            products: serverProducts || [],
            suppliers: serverSuppliers || [],
            loyaltyMembers: serverLoyalty || [],
            surgerySessions: serverSurgery || [],
            groomingStyles: serverGroomingStyles || [],
            groomingPortfolio: serverGroomingPortfolio || [],
            accessMatrix: serverAccessMatrix,
            clinicProfile: serverProfile,
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'ط®ط·ط§غŒ ظ†ط§ط´ظ†ط§ط®طھظ‡';
        console.error('Hydration failed:', err);
        setHydrationError(`ظ‡ظ…ع¯ط§ظ…â€Œط³ط§ط²غŒ ط¯ط§ط¯ظ‡â€Œظ‡ط§ ظ†ط§ظ…ظˆظپظ‚: ${msg}`);
      } finally {
        isRefreshingRef.current = false;
      }
    })();

    refreshLockRef.current = promise;
    try { await promise; } finally { refreshLockRef.current = null; }
  }, [currentUser.username]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser.username) return;
    let cancelled = false;
    (async () => {
      const snapshot = await readLiveDataSnapshot(currentUser.username);
      if (snapshot && !cancelled) {
        const data = snapshot.data as any;
        if (Array.isArray(data.pets)) setPets(data.pets);
        if (Array.isArray(data.owners)) setOwners(data.owners);
        if (Array.isArray(data.visits)) setVisits(data.visits);
        if (Array.isArray(data.vaccinations)) setVaccinations(data.vaccinations);
        if (Array.isArray(data.invoices)) setInvoices(data.invoices);
        if (Array.isArray(data.appointments)) setAppointments(data.appointments);
        if (Array.isArray(data.queues)) setQueues(data.queues);
        if (Array.isArray(data.boardingRecords)) setBoardingRecords(data.boardingRecords);
        if (Array.isArray(data.attendanceRecords)) setAttendanceRecords(data.attendanceRecords);
        if (Array.isArray(data.products)) setProducts(data.products);
        if (Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
        if (Array.isArray(data.loyaltyMembers)) setLoyaltyMembers(data.loyaltyMembers);
        if (Array.isArray(data.surgerySessions)) setSurgerySessions(data.surgerySessions);
        if (Array.isArray(data.groomingStyles) && data.groomingStyles.length) setGroomingStyles(data.groomingStyles);
        if (Array.isArray(data.groomingPortfolio)) setGroomingPortfolio(data.groomingPortfolio);
        if (data.accessMatrix) setAccessMatrix(data.accessMatrix);
        if (data.clinicProfile?.clinicName) setClinicProfile(data.clinicProfile);
        cacheVersionRef.current = snapshot.version;
      }
      if (!cancelled) await refreshAllServerData();
    })();
    return () => { cancelled = true; };
  }, [currentUser.username, isAuthenticated, refreshAllServerData]);

  // Keep an authenticated client fresh without blocking the visible dashboard.
  useEffect(() => {
    if (!isAuthenticated) return;
    const checkForLiveUpdates = () => {
      if (document.visibilityState === 'visible') refreshAllServerData();
    };
    const intervalId = window.setInterval(checkForLiveUpdates, 30_000);
    window.addEventListener('focus', checkForLiveUpdates);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', checkForLiveUpdates);
    };
  }, [isAuthenticated, refreshAllServerData]);

  // Fetch notifications periodically
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const fetchNotifications = async () => {
      try {
        const serverNotifications = await apiClient.getNotifications();
        if (!cancelled) setNotifications(serverNotifications);
      } catch (err) {
        console.warn('Could not fetch notifications:', err);
      }
    };
    fetchNotifications();
    const intervalId = window.setInterval(fetchNotifications, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, currentUser.username]);

  // Check-in Pet in Clinic & sync with server
  const handleCheckInPet = (petId: string, status: Pet['statusInClinic'], reason?: string) => {
    setPets((prev) => {
      const next = prev.map((p) =>
        p.id === petId
          ? {
              ...p,
              statusInClinic: status,
              notes: reason
                ? (p.notes ? `${p.notes} | ظ¾ط°غŒط±ط´: ${reason}` : `ظ¾ط°غŒط±ط´: ${reason}`)
                : p.notes,
              checkInTime:
                status !== 'not_present'
                  ? new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
                  : undefined,
            }
          : p
      );
      const updatedPet = next.find((p) => p.id === petId);
      if (updatedPet) {
        apiClient.savePatient(updatedPet).catch((e) => console.error('Save pet failed:', e));
      }
      return next;
    });
  };

  // Add new pet with server persistence
  const handleAddPet = (newPetData: Omit<Pet, 'id'>) => {
    const newPet: Pet = {
      ...newPetData,
      id: `pet-${Date.now()}`,
    };
    setPets((prev) => [newPet, ...prev]);

    // Save directly to persistent server storage
    apiClient.savePatient(newPet).catch((e) => console.error('API savePatient error:', e));

    // Also persist owner if new or update pet count
    if (newPet.ownerName && newPet.ownerPhone) {
      const existingOwner = (owners || []).find((o) => o?.phone === newPet.ownerPhone);
      if (!existingOwner) {
        const newOwner: Owner = {
          id: newPet.ownerId || `own-${Date.now()}`,
          fullName: newPet.ownerName,
          phone: newPet.ownerPhone,
          nationalId: '',
          email: '',
          address: '',
          petIds: [newPet.id],
          registeredAt: new Date().toLocaleDateString('fa-IR'),
          totalSpent: 0,
        };
        setOwners((prev) => [newOwner, ...prev]);
        apiClient.saveOwner(newOwner).catch((e) => console.error('API saveOwner error:', e));
      }
    }
    
    // Add sync queue record
    setSyncQueue((prev) => [
      {
        id: `sync-${Date.now()}`,
        recordType: 'patient',
        recordId: newPet.id,
        action: 'create',
        createdAt: new Date().toLocaleDateString('fa-IR'),
        status: 'synced',
        retryCount: 0,
      },
      ...prev,
    ]);
  };

  // Delete pet with server persistence
  const handleDeletePet = (petId: string) => {
    setPets((prev) => prev.filter((p) => p.id !== petId));
    apiClient.deletePatient(petId).catch((e) => console.error('API deletePatient error:', e));
  };

  // Delete visit with server persistence
  const handleDeleteVisit = async (visitId: string) => {
    setVisits((prev) => prev.filter((v) => v.id !== visitId));
    try {
      await fetch(`/api/visits/${visitId}`, { method: 'DELETE' });
    } catch (e) {
      console.error('API deleteVisit error:', e);
    }
  };

  // Add new visit & auto-generate invoice
  const handleRecordVisit = (visitData: Partial<VisitRecord>, cost: number = 350000) => {
    const pet = pets.find((p) => p.id === visitData.petId);
    if (!pet) return;
    const newVisitId = `vis-${Date.now()}`;

    const newVisit: VisitRecord = {
      id: newVisitId,
      petId: pet.id,
      petName: pet.name,
      ownerId: pet.ownerId,
      ownerName: pet.ownerName,
      date: new Date().toLocaleDateString('fa-IR'),
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      vetId: currentUser.id,
      vetName: currentUser.name || 'ط¯ع©طھط± ط¹ظ„غŒط±ط¶ط§ ط§ظ…غŒظ†غŒ',
      chiefComplaint: visitData.chiefComplaint || 'ظˆغŒط²غŒطھ ط¨ط§ظ„غŒظ†غŒ',
      vitalSigns: visitData.vitalSigns || {
        temperature: 0,
        heartRate: 0,
        respiratoryRate: 0,
        weightKg: pet.weightKg,
        mucousMembranes: 'ط·ط¨غŒط¹غŒ',
      },
      clinicalFindings: visitData.clinicalFindings || 'ظˆط¶ط¹غŒطھ ظ…ط®ط§ط·ط§طھ ط·ط¨غŒط¹غŒطŒ ظ„ظ…ط³ ط´ع©ظ…غŒ ط¨ط¯ظˆظ† ط¯ط±ط¯.',
      diagnosis: visitData.diagnosis || 'ظ…ط¹ط§غŒظ†ظ‡ ط¨ط§ظ„غŒظ†غŒ ط¹ظ…ظˆظ…غŒ',
      prescription: visitData.prescription || [],
      procedures: visitData.procedures || ['ظ…ط¹ط§غŒظ†ظ‡ ط¨ط§ظ„غŒظ†غŒ'],
      serviceType: visitData.serviceType || 'general_exam',
      specializedType: visitData.specializedType || 'none',
      documentationStatus:
        visitData.specializedType && visitData.specializedType !== 'none' ? 'pending_docs' : 'none',
      documentReminderActive: visitData.specializedType && visitData.specializedType !== 'none',
      attachments: visitData.attachments || [],
      cost: cost,
      isPaid: false,
    };

    setVisits((prev) => [newVisit, ...prev]);

    // Save directly to persistent server storage
    apiClient.saveVisit(newVisit).catch((e) => console.error('API saveVisit error:', e));

    // Auto generate invoice
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-1403-${Math.floor(Math.random() * 8999 + 1000)}`,
      petId: pet.id,
      petName: pet.name,
      ownerId: pet.ownerId,
      ownerName: pet.ownerName,
      ownerPhone: pet.ownerPhone,
      date: new Date().toLocaleDateString('fa-IR'),
      items: [
        {
          id: `item-${Date.now()}`,
          title: visitData.procedures?.[0] || 'ظˆغŒط²غŒطھ ظˆ ط®ط¯ظ…ط§طھ ط¨ط§ظ„غŒظ†غŒ',
          category: 'visit',
          unitPrice: cost,
          quantity: 1,
          total: cost,
        },
      ],
      subtotal: cost,
      tax: 0,
      discount: 0,
      finalTotal: cost,
      paymentStatus: 'pending',
      paymentMethod: 'pos',
      cashierName: 'طµظ†ط¯ظˆظ‚ ع©ظ„غŒظ†غŒع©',
      notes: 'ط«ط¨طھ ط®ظˆط¯ع©ط§ط± ظپط§ع©طھظˆط± ط§ط² ظˆغŒط²غŒطھ',
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    apiClient.saveInvoice(newInvoice).catch((e) => console.error('API saveInvoice error:', e));

    // Update Pet's last visit & set status to in_exam
    setPets((prev) => {
      const next = prev.map((p) =>
        p.id === pet.id
          ? { ...p, lastVisitDate: 'ط§ظ…ط±ظˆط²', statusInClinic: 'in_exam' }
          : p
      );
      const updatedPet = next.find((p) => p.id === pet.id);
      if (updatedPet) {
        apiClient.savePatient(updatedPet).catch((e) => console.error('API update last visit failed:', e));
      }
      return next;
    });
  };

  // Record Vaccine via Voice or Quick Action
  const handleRecordVaccine = (petId: string, serviceTitle: string, cost: number = 450000) => {
    const targetPet = pets.find((p) => p.id === petId) || pets[0];

    handleRecordVisit(
      {
        petId: targetPet.id,
        petName: targetPet.name,
        ownerId: targetPet.ownerId,
        ownerName: targetPet.ownerName,
        chiefComplaint: serviceTitle,
        diagnosis: 'ظˆط§ع©ط³غŒظ†ط§ط³غŒظˆظ† ط¯ظˆط±ظ‡â€Œط§غŒ ظˆ ط§غŒظ…ظ†â€Œط³ط§ط²غŒ',
        serviceType: 'vaccination',
        procedures: [serviceTitle],
      },
      cost
    );

    const vaccination = {
      id: `vaccine-${Date.now()}`,
      patientId: targetPet.id,
      vaccineName: serviceTitle,
      date: new Date().toLocaleDateString('fa-IR'),
      nextDueDate: 'غŒع© ط³ط§ظ„ ط¨ط¹ط¯',
      price: cost,
      completed: true,
    };
    setVaccinations((prev) => [vaccination, ...prev]);
    apiClient.saveVaccination(vaccination).catch((e) => console.error('API saveVaccination error:', e));

    // Update pet vaccine dates
    setPets((prev) =>
      prev.map((p) =>
        p.id === targetPet.id
          ? {
              ...p,
              nextVaccineDate: 'غ±غ´غ°غ´/غ°غµ/غ²غ¸ (غ± ط³ط§ظ„ ط¨ط¹ط¯)',
              isVaccinated: true,
            }
          : p
      )
    );
  };

  // Admit Boarding
  const handleAdmitBoarding = (petId: string) => {
    const targetPet = pets.find((p) => p.id === petId) || pets[0];
    if (!targetPet) return;
    const newBoarding: BoardingRecord = {
      id: `brd-${Date.now()}`,
      petId: targetPet.id,
      petName: targetPet.name,
      petSpecies: targetPet.species,
      petBreed: targetPet.breed,
      ownerName: targetPet.ownerName,
      ownerPhone: targetPet.ownerPhone,
      cageNumber: `ط¨ط§ع©ط³ VIP ظ…ط±ط§ظ‚ط¨طھ ظˆغŒعکظ‡ ط´ظ…ط§ط±ظ‡ ${Math.floor(Math.random() * 20) + 1}`,
      admittedAt: 'ط§ظ…ط±ظˆط² غ±غ°:غ°غ°',
      dischargePlannedAt: 'غ±غ´غ°غ³/غ°غ¶/غ°غµ',
      condition: 'stable',
      assignedStaffId: currentUser.id,
      assignedStaffName: currentUser.name || 'ط¯ع©طھط± ع©غŒع©ط§ظˆظˆط³ ع©غŒط§ظ†غŒ',
      dietPlan: 'ط؛ط°ط§غŒ ط±عکغŒظ…غŒ ط±ظˆط²غŒ غ² ظˆط¹ط¯ظ‡',
      medicalCareNotes: 'ظ¾ط§غŒط´ ط¹ظ„ط§ط¦ظ… ط­غŒط§طھغŒ ظˆ ط³ظ„ط§ظ…طھ ط¹ظ…ظˆظ…غŒ',
      dailyCost: 750000,
      routineTasks: [
        {
          id: `tsk-${Date.now()}-1`,
          title: 'ظˆط¹ط¯ظ‡ ط§ظˆظ„ ط؛ط°ط§ ظˆ ط¢ط¨',
          type: 'food',
          scheduledTime: 'غ°غ¹:غ°غ°',
          isCompleted: false,
          instructions: 'ط؛ط°ط§غŒ ط±عکغŒظ…غŒ',
        },
        {
          id: `tsk-${Date.now()}-2`,
          title: 'ظ†ط¸ط§ظپطھ ط¨ط§ع©ط³ ظˆ طھظ‡ظˆغŒظ‡',
          type: 'hygiene',
          scheduledTime: 'غ±غ´:غ°غ°',
          isCompleted: false,
          instructions: 'ط¶ط¯ط¹ظپظˆظ†غŒ ط¨ط§ع©ط³',
        },
        {
          id: `tsk-${Date.now()}-3`,
          title: 'ظ¾غŒط§ط¯ظ‡â€Œط±ظˆغŒ ط¯ط± ظ…ط­ظˆط·ظ‡',
          type: 'walk',
          scheduledTime: 'غ±غ·:غ°غ°',
          isCompleted: false,
          instructions: 'ظ¾غŒط§ط¯ظ‡â€Œط±ظˆغŒ ط¢ط±ط§ظ…',
        },
      ],
    };

    setBoardingRecords((prev) => [newBoarding, ...prev]);
    apiClient.saveBoarding(newBoarding).catch((e) => console.error('Save boarding failed:', e));
    setPets((prev) =>
      prev.map((p) => (p.id === targetPet.id ? { ...p, statusInClinic: 'in_boarding' } : p))
    );
  };

  // Create Appointment
  const handleCreateAppointment = (appointment: Omit<Appointment, 'id' | 'createdAt'>) => {
    const newApt: Appointment = {
      ...appointment,
      id: `apt-${Date.now()}`,
      createdAt: new Date().toLocaleDateString('fa-IR'),
    };
    setAppointments((prev) => [newApt, ...prev]);
    apiClient.saveAppointment(newApt).catch((e) => console.error('Save appointment failed:', e));
  };

  // Delete Appointment
  const handleDeleteAppointment = (appointmentId: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
    apiClient.deleteAppointment(appointmentId).catch((e) => console.error('Delete appointment failed:', e));
  };

  // Approve Client Online Appointment Request
  const handleApproveOnlineRequest = (
    appointmentId: string,
    requiresDeposit: boolean,
    depositAmount: number
  ) => {
    const currentApt = appointments.find((a) => a.id === appointmentId);
    const updates = {
      operatorApprovalStatus: 'approved_queued' as const,
      requiresDeposit,
      depositAmount: requiresDeposit ? (depositAmount || 2000000) : 0,
      depositStatus: requiresDeposit ? ('pending_payment' as const) : ('none' as const),
      depositPaymentLink: requiresDeposit
        ? `https://pay.vetcloud.ir/dep/${currentApt?.queueCode || 'surg'}-${appointmentId}`
        : undefined,
    };

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId
          ? {
              ...a,
              ...updates,
            }
          : a
      )
    );
    apiClient.updateAppointmentStatus(appointmentId, updates).catch((e) => console.error('Update appointment status failed:', e));

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'ظ†ظˆط¨طھ ط¢ظ†ظ„ط§غŒظ† طھط§غŒغŒط¯ ط´ط¯ ظˆ ظ„غŒظ†ع© ط¨غŒط¹ط§ظ†ظ‡ طµط§ط¯ط± ع¯ط±ط¯غŒط¯',
      message: 'ظ„غŒظ†ع© ظ¾ط±ط¯ط§ط®طھ ط´ط§ظ¾ط±ع© ظˆ ط¨ظ„ظ‡ ط¨ط±ط§غŒ ط³ط±ظ¾ط±ط³طھ ط§ط±ط³ط§ظ„ ط´ط¯ ظˆ ظ†ظˆط¨طھ ط¯ط± طµظپ ظپط¹ط§ظ„ ظ‚ط±ط§ط± ع¯ط±ظپطھ.',
      createdAt: 'ظ‡ظ…â€Œط§ع©ظ†ظˆظ†',
      type: 'system',
      targetRole: 'all',
      isRead: false,
      requiresAction: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Confirm Deposit Payment
  const handleConfirmDepositPayment = (appointmentId: string, transactionRef?: string) => {
    const ref = transactionRef || `SHP-${Math.floor(10000000 + Math.random() * 90000000)}`;
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId
          ? {
              ...a,
              depositStatus: 'paid',
              depositTransactionRef: ref,
            }
          : a
      )
    );
    apiClient.updateAppointmentStatus(appointmentId, {
      depositStatus: 'paid',
      depositTransactionRef: ref,
    }).catch((e) => console.error('Confirm deposit payment failed:', e));
  };

  // Create & Update Queues
  const handleCreateQueue = (newQueue: Omit<ClinicQueueDefinition, 'id'>) => {
    const queueObj: ClinicQueueDefinition = {
      ...newQueue,
      id: `q-${Date.now()}`,
    };
    setQueues((prev) => [...prev, queueObj]);
    apiClient.saveQueue(queueObj).catch((e) => console.error('Save queue failed:', e));
  };

  const handleUpdateQueue = (queueId: string, updates: Partial<ClinicQueueDefinition>) => {
    setQueues((prev) => {
      const next = prev.map((q) => (q.id === queueId ? { ...q, ...updates } : q));
      const target = next.find((q) => q.id === queueId);
      if (target) {
        apiClient.saveQueue(target).catch((e) => console.error('Update queue failed:', e));
      }
      return next;
    });
  };

  // IT Developer IDE Handlers
  const handleSaveDevFile = (fileId: string, newContent: string) => {
    setDevFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, content: newContent } : f)));
    const newLog: DevScriptExecutionLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      type: 'success',
      source: 'FileSystem',
      message: `ظپط§غŒظ„ ${fileId} ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط¯ط± ظ…ط®ط²ظ† ع©ط¯ظ‡ط§غŒ ط³ط±ظˆط± ط¨ط§ط²ظ†ظˆغŒط³غŒ ظˆ ط°ط®غŒط±ظ‡ ط´ط¯.`,
    };
    setDevLogs((prev) => [newLog, ...prev]);
  };

  const handleCreateDevFile = (newFile: Omit<DevIdeFile, 'id'>) => {
    const fileObj: DevIdeFile = {
      ...newFile,
      id: `f-${Date.now()}`,
    };
    setDevFiles((prev) => [...prev, fileObj]);
  };

  const handleRunDevScript = (fileName: string) => {
    const newLog: DevScriptExecutionLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      type: 'success',
      source: fileName,
      message: `[Node.js Runner] ط§ط³ع©ط±غŒظ¾طھ آ«${fileName}آ» ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط§ط¬ط±ط§ ط´ط¯. ط®ط±ظˆط¬غŒ طھط³طھ: All unit tests passed in 42ms.`,
    };
    setDevLogs((prev) => [newLog, ...prev]);
  };

  const handleExecuteAIPrompt = (prompt: string, targetFileId: string) => {
    const targetFile = devFiles.find((f) => f.id === targetFileId);
    const newHistory: AICodingPromptHistory = {
      id: `prm-${Date.now()}`,
      prompt,
      generatedCode: `// Generated snippet for: ${prompt}\nconsole.log("Processed IT logic");`,
      explanation: 'ع©ط¯ طھظˆط³ط· ط¯ط³طھغŒط§ط± ظ‡ظˆط´ ظ…طµظ†ظˆط¹غŒ طھظˆط³ط¹ظ‡ طھظˆظ„غŒط¯ ظˆ ط¢ظ…ط§ط¯ظ‡ ط¨ط§ط²ط¨غŒظ†غŒ ط´ط¯.',
      targetFile: targetFile?.path || '/src/automation/index.ts',
      applied: true,
      timestamp: new Date().toLocaleTimeString('fa-IR'),
    };
    setPromptHistory((prev) => [newHistory, ...prev]);
  };

  const handleApplyAICodeToFile = (targetFileId: string, code: string) => {
    handleSaveDevFile(targetFileId, code);
  };

  const handleTestApiEndpoint = (apiTestId: string) => {
    const testItem = apiTests.find((t) => t.id === apiTestId);
    const newLog: DevScriptExecutionLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      type: 'success',
      source: 'HTTP Client',
      message: `[POST 200 OK] طھط³طھ ط§ظ†ط¯ظ¾ظˆغŒظ†طھ آ«${testItem?.endpoint || '/api'}آ» ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط§ظ†ط¬ط§ظ… ط´ط¯ ظˆ ظˆط¶ط¹غŒطھ ط´ط§ظ¾ط±ع© طھط§غŒغŒط¯ ع¯ط±ط¯غŒط¯.`,
    };
    setDevLogs((prev) => [newLog, ...prev]);
  };

  const handleClearDevLogs = () => {
    setDevLogs([]);
  };

  // IT Developer Suite Database Management Handlers
  const handleClearDatabase = () => {
    setPets([]);
    setOwners([]);
    setVisits([]);
    setAppointments([]);
    setInvoices([]);
    setBoardingRecords([]);
    setLoyaltyMembers([]);
    setProducts([]);
    setSuppliers([]);
    setSurgerySessions([]);
    setGroomingPortfolio([]);
    setAttendanceRecords([]);
    apiClient.wipeDatabase().catch((e) => console.error('Wipe DB failed:', e));
    const wipeLog: DevScriptExecutionLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      type: 'warn',
      source: 'DB_Manager',
      message: '[Wipe Action] ع©ظ„غŒظ‡ ط±ع©ظˆط±ط¯ظ‡ط§غŒ ط¢ط²ظ…ط§غŒط´غŒ ظˆ ط³ط§ط®طھع¯غŒ ط¨ط§ ظ…ظˆظپظ‚غŒطھ ظ¾ط§ع©ط³ط§ط²غŒ ط´ط¯. طھظ†ظ‡ط§ طھظ†ط¸غŒظ…ط§طھ ظ¾ط§غŒظ‡ ظˆ ط§ط·ظ„ط§ط¹ط§طھ ط´ظ†ط§ط³ظ†ط§ظ…ظ‡ ع©ظ„غŒظ†غŒع© ط­ظپط¸ ع¯ط±ط¯غŒط¯.',
    };
    setDevLogs((prev) => [wipeLog, ...prev]);
  };

  const handleSeedDatabase = () => {
    setPets(initialPets);
    setOwners(initialOwners);
    setVisits(initialVisits);
    setAppointments(initialAppointments);
    setInvoices(initialInvoices);
    setBoardingRecords(initialBoardingRecords);
    setLoyaltyMembers(initialLoyaltyMembers);
    setProducts(initialPetShopProducts);
    setSuppliers(initialPetShopSuppliers);
    setSurgerySessions(initialSurgeryOperations);
    setGroomingStyles(initialGroomingStyles);
    setGroomingPortfolio(initialGroomingPortfolio);
    setAttendanceRecords(initialStaffAttendance);

    // Sync seeds to server database
    initialPets.forEach((p) => apiClient.savePatient(p));
    initialVisits.forEach((v) => apiClient.saveVisit(v));
    initialInvoices.forEach((i) => apiClient.saveInvoice(i));
    initialAppointments.forEach((a) => apiClient.saveAppointment(a));
    initialClinicQueues.forEach((q) => apiClient.saveQueue(q));
    initialBoardingRecords.forEach((b) => apiClient.saveBoarding(b));
    initialStaffAttendance.forEach((att) => apiClient.clockIn(att));
    apiClient.savePetShopProductsBatch(initialPetShopProducts);
    apiClient.saveSuppliersBatch(initialPetShopSuppliers);
    apiClient.saveSurgerySessionsBatch(initialSurgeryOperations);
    apiClient.saveGroomingStylesBatch(initialGroomingStyles);
    apiClient.saveGroomingPortfolioBatch(initialGroomingPortfolio);
    apiClient.saveAccessMatrix(initialAccessMatrix);
    apiClient.saveClinicProfile(initialClinicProfile);

    const seedLog: DevScriptExecutionLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      type: 'success',
      source: 'DB_Manager',
      message: '[Seed Action] ط¯غŒطھط§ط¨غŒط³ ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط±ظˆغŒ ط³ط±ظˆط± ط¨ط§ ط±ع©ظˆط±ط¯ظ‡ط§غŒ ط؛ظ†غŒ ظˆ ظ¾ط§غŒط¯ط§ط± ظ…ظ‚ط¯ط§ط±ط¯ظ‡غŒ ط§ظˆظ„غŒظ‡ ط´ط¯.',
    };
    setDevLogs((prev) => [seedLog, ...prev]);
  };

  const handleSendToMigrationPipeline = (extractedJson: string) => {
    setMigrationJsonPayload(extractedJson);
    setActiveTab('cloud_migration');
    const migLog: DevScriptExecutionLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      type: 'info',
      source: 'MSSQL_Bridge',
      message: 'ط¯ط§ط¯ظ‡â€Œظ‡ط§غŒ ط§ط³طھط®ط±ط§ط¬â€Œط´ط¯ظ‡ ط§ط² SQL Server ط¨ظ‡ ظ¾ط§غŒظ¾â€Œظ„ط§غŒظ† ظ¾ط§ظ„ط§غŒط´ ط¯ط§ط¯ظ‡â€Œظ‡ط§ ظ…ظ†طھظ‚ظ„ ط´ط¯ظ†ط¯.',
    };
    setDevLogs((prev) => [migLog, ...prev]);
  };

  // Update Appointment Status
  const handleUpdateAppointmentStatus = (
    appointmentId: string,
    status: Appointment['status']
  ) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status } : a))
    );
    apiClient.updateAppointmentStatus(appointmentId, { status }).catch((e) => console.error('Update appointment status failed:', e));
  };

  // Toggle Boarding Routine Task
  const handleToggleBoardingTask = (
    recordId: string,
    taskId: string,
    photoProof?: string,
    voiceMemo?: string
  ) => {
    let taskUpdates: any = {};
    setBoardingRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== recordId) return rec;
        return {
          ...rec,
          routineTasks: rec.routineTasks.map((task) => {
            if (task.id !== taskId) return task;
            const newCompleted = !task.isCompleted;
            taskUpdates = {
              isCompleted: newCompleted,
              completedBy: newCompleted ? currentUser.name : undefined,
              completedAt: newCompleted
                ? new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
                : undefined,
              photoProofUrl: photoProof || task.photoProofUrl,
              voiceMemoText: voiceMemo || task.voiceMemoText,
            };
            return {
              ...task,
              ...taskUpdates,
            };
          }),
        };
      })
    );
    apiClient.updateBoardingTask(recordId, taskId, taskUpdates).catch((e) => console.error('Update boarding task failed:', e));
  };

  // Admit New Pet to Boarding
  const handleAdmitNewBoarding = (newRec: Omit<BoardingRecord, 'id'>) => {
    const record: BoardingRecord = {
      ...newRec,
      id: `brd-${Date.now()}`,
    };
    setBoardingRecords((prev) => [record, ...prev]);
    apiClient.saveBoarding(record).catch((e) => console.error('Save boarding failed:', e));
  };

  // Delete Boarding Record
  const handleDeleteBoarding = (recordId: string) => {
    setBoardingRecords((prev) => prev.filter((b) => b.id !== recordId));
    apiClient.deleteBoarding(recordId).catch((e) => console.error('Delete boarding failed:', e));
  };

  // Settle Invoice with POS / Cash
  const handleUpdateInvoicePayment = (
    invoiceId: string,
    method: Invoice['paymentMethod'],
    notes?: string
  ) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              paymentStatus: 'paid',
              paymentMethod: method,
              notes: notes || inv.notes,
            }
          : inv
      )
    );
    apiClient.payInvoice(invoiceId, { paymentMethod: method, notes }).catch((e) => console.error('Pay invoice failed:', e));
  };

  // Delete Invoice
  const handleDeleteInvoice = (invoiceId: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
    apiClient.deleteInvoice(invoiceId).catch((e) => console.error('Delete invoice failed:', e));
  };

  // Staff Clock in / Clock out
  const handleClockIn = (staffName: string, role: User['role']) => {
    const newAtt: StaffAttendance = {
      id: `att-${Date.now()}`,
      staffId: currentUser.id,
      staffName,
      role,
      date: 'ط§ظ…ط±ظˆط²',
      clockInTime: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      connectionMethod: 'wifi_auto',
      wifiSsid: 'VetClinic_Staff_5G',
      totalHours: 0,
      overtimeHours: 0,
      status: 'present',
      monthlyLeaveBalanceHours: 20,
    };
    setAttendanceRecords((prev) => [newAtt, ...prev]);
    apiClient.clockIn(newAtt).catch((e) => console.error('Clock in failed:', e));
  };

  const handleClockOut = (recordId: string) => {
    const clockOutTime = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    setAttendanceRecords((prev) =>
      prev.map((att) =>
        att.id === recordId
          ? {
              ...att,
              clockOutTime,
              status: 'present',
            }
          : att
      )
    );
    apiClient.clockOut(recordId, clockOutTime).catch((e) => console.error('Clock out failed:', e));
  };

  // Pet Shop Products Update
  const handleUpdateProducts = (updatedProducts: PetShopProduct[]) => {
    setProducts(updatedProducts);
    apiClient.savePetShopProductsBatch(updatedProducts).catch((e) => console.error('Save petshop products failed:', e));
  };

  // Pet Shop Suppliers Update
  const handleUpdateSuppliers = (updatedSuppliers: PetShopSupplier[]) => {
    setSuppliers(updatedSuppliers);
    apiClient.saveSuppliersBatch(updatedSuppliers).catch((e) => console.error('Save suppliers failed:', e));
  };

  // Surgery Sessions Update
  const handleUpdateSurgerySessions = (newSessions: SurgeryOperationSession[]) => {
    setSurgerySessions(newSessions);
    apiClient.saveSurgerySessionsBatch(newSessions).catch((e) => console.error('Save surgery sessions failed:', e));
  };

  // Grooming Styles Update
  const handleUpdateGroomingStyles = (newStyles: GroomingStyleModel[]) => {
    setGroomingStyles(newStyles);
    apiClient.saveGroomingStylesBatch(newStyles).catch((e) => console.error('Save grooming styles failed:', e));
  };

  // Grooming Portfolio Update
  const handleUpdateGroomingPortfolio = (newPortfolio: GroomingPortfolioItem[]) => {
    setGroomingPortfolio(newPortfolio);
    apiClient.saveGroomingPortfolioBatch(newPortfolio).catch((e) => console.error('Save grooming portfolio failed:', e));
  };

  // Access Matrix Update
  const handleUpdateAccessMatrix = (newMatrix: RoleAccessMatrix) => {
    setAccessMatrix(newMatrix);
    apiClient.saveAccessMatrix(newMatrix).catch((e) => console.error('Save access matrix failed:', e));
  };

  // Clinic Profile Update
  const handleUpdateClinicProfile = (updatedProfile: ClinicProfileConfig) => {
    setClinicProfile(updatedProfile);
    apiClient.saveClinicProfile(updatedProfile).catch((e) => console.error('Save clinic profile failed:', e));
  };

  // Print Passport Handler
  const handlePrintPassport = (pet: Pet) => {
    const passportTemplate =
      printTemplates.find((t) => t.code === 'PASSPORT' || t.id === 'tmpl-1') || printTemplates[0];
    const rendered = (passportTemplate?.contentHtml || '')
      .replace(/{{pet_name}}/g, pet.name)
      .replace(/{{species}}/g, pet.species)
      .replace(/{{breed}}/g, pet.breed)
      .replace(/{{color}}/g, pet.color)
      .replace(/{{birth_date}}/g, pet.birthDate)
      .replace(/{{microchip}}/g, pet.microchipNumber)
      .replace(/{{owner_name}}/g, pet.ownerName)
      .replace(/{{owner_phone}}/g, pet.ownerPhone)
      .replace(/{{clinic_name}}/g, 'ع©ظ„غŒظ†غŒع© ط¯ط§ظ…ظ¾ط²ط´ع©غŒ ظ‡ظˆط´ظ…ظ†ط¯ ظ…ظ‡ط±ع¯ط§ظ†')
      .replace(/{{date}}/g, new Date().toLocaleDateString('fa-IR'))
      .replace(/{{issue_date}}/g, new Date().toLocaleDateString('fa-IR'))
      .replace(/{{rabies_date}}/g, 'غ±غ´غ°غ³/غ°غµ/غ°غ±')
      .replace(/{{national_id}}/g, 'غ°غ°غ±غ¹غ¸غ·غ¶غµغ´غ³')
      .replace(/{{passport_no}}/g, 'N12345678')
      .replace(/{{destination}}/g, 'Frankfurt (FRA)')
      .replace(/{{vet_name}}/g, currentUser.name || 'ط¯ع©طھط± ط§ظ…غŒظ† ط¨غŒط§طھغŒ (ط¬ط±ط§ط­)');

    setPrintModalData({
      isOpen: true,
      title: `ط´ظ†ط§ط³ظ†ط§ظ…ظ‡ ط¨ظ‡ط¯ط§ط´طھغŒ ظˆ ع©ط§ط±طھ ظˆط§ع©ط³غŒظ†ط§ط³غŒظˆظ† (${pet.name})`,
      htmlContent: rendered,
    });
  };

  // Print Invoice Handler
  const handlePrintInvoice = (invoice: Invoice, format: 'a4' | 'thermal') => {
    const templateCode = format === 'thermal' ? 'THERMAL_RECEIPT' : 'INVOICE_A4';
    const tmpl =
      printTemplates.find((t) => t.code === templateCode) || printTemplates[1] || printTemplates[0];

    const rendered = (tmpl?.contentHtml || '')
      .replace(/{{invoice_number}}/g, invoice.invoiceNumber)
      .replace(/{{pet_name}}/g, invoice.petName)
      .replace(/{{owner_name}}/g, invoice.ownerName)
      .replace(/{{date}}/g, invoice.date)
      .replace(/{{final_total}}/g, `${invoice.finalTotal.toLocaleString('fa-IR')} طھظˆظ…ط§ظ†`)
      .replace(/{{subtotal}}/g, `${invoice.subtotal.toLocaleString('fa-IR')} طھظˆظ…ط§ظ†`)
      .replace(/{{clinic_name}}/g, 'ع©ظ„غŒظ†غŒع© ط¯ط§ظ…ظ¾ط²ط´ع©غŒ ظ‡ظˆط´ظ…ظ†ط¯ ظ…ظ‡ط±ع¯ط§ظ†')
      .replace(/{{vet_name}}/g, invoice.cashierName || currentUser.name);

    setPrintModalData({
      isOpen: true,
      title: `ظپط§ع©طھظˆط± ظپط±ظˆط´ ${invoice.invoiceNumber} (${format === 'thermal' ? 'ظپغŒط´ ط­ط±ط§ط±طھغŒ غ¸غ°mm' : 'ط¨ط±ع¯ظ‡ A4'})`,
      htmlContent: rendered,
    });
  };

  // Notification Collaborative Action
  const handleUpdateNotificationAction = async (
    notifId: string,
    status: 'done_by_me' | 'done_by_other'
  ) => {
    try {
      await apiClient.updateNotificationAction(notifId, status, currentUser.name);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notifId
            ? {
                ...n,
                actionStatus: status,
                isRead: true,
                actionTakenBy: status === 'done_by_me' ? currentUser.name : n.actionTakenBy,
              }
            : n
        )
      );
    } catch (err) {
      console.error('Update notification action failed:', err);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.isRead);
      await Promise.all(unread.map((n) => apiClient.markNotificationRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Mark all notifications read failed:', err);
    }
  };

  // Stats calculation for Navbar & Sidebar
  const unreadNotifsCount = (notifications || []).filter((n) => !n?.isRead).length;
  // Only explicitly checked-in patients belong to the lobby queue. Historical records
  // without a status must never inflate the live waiting count.
  const clinicPresenceCount = (pets || []).filter((p) => p?.statusInClinic === 'waiting' || p?.statusInClinic === 'in_exam').length;
  const pendingBoardingTasks = (boardingRecords || []).reduce(
    (acc, r) => acc + ((r?.routineTasks || []).filter((t) => !t?.isCompleted).length),
    0
  );

  if (!isAuthenticated) {
    if (inviteToken) return <InviteSetupPage token={inviteToken} />;
    return (
      <PublicLandingPage
        onLoginSuccess={(user) => {
          setCurrentUser(user as User);
          setIsAuthenticated(true);
        }}
        activeClinicProfile={clinicProfile}
      />
    );
  }

  if (isHydrating) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#F7F8F3] flex items-center justify-center text-[#2D3A27]">
        <div className="rounded-3xl bg-white border border-[#E6E9DF] px-8 py-6 text-center shadow-lg">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#D4E0CD] border-t-[#4A6741]" />
          <div className="font-black">ط¯ط± ط­ط§ظ„ ط¯ط±غŒط§ظپطھ ط§ط·ظ„ط§ط¹ط§طھ ظˆط§ظ‚ط¹غŒ ع©ظ„غŒظ†غŒع©â€¦</div>
          <div className="mt-1 text-xs text-[#5C7457]">ظ„ط·ظپط§ظ‹ طھط§ ط§طھطµط§ظ„ ع©ط§ظ…ظ„ ط¨ظ‡ ظ¾ط§غŒع¯ط§ظ‡ ط¯ط§ط¯ظ‡ طµط¨ط± ع©ظ†غŒط¯.</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F7F8F3] flex flex-col text-[#2D3A27] font-sans selection:bg-[#4A6741] selection:text-white"
      dir="rtl"
    >
      {/* App Navbar */}
      <Navbar
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        onOpenVoiceSecretary={() => setIsVoiceSecretaryOpen(true)}
        onOpenVisitorCamera={() => setIsVisitorCameraOpen(true)}
        onToggleNotifications={() => setIsNotificationsOpen(true)}
        unreadNotifsCount={unreadNotifsCount}
        clinicPresenceCount={clinicPresenceCount}
        recordCount={(pets || []).length}
        onOpenClinicProfile={() => setIsClinicProfileOpen(true)}
        onOpenAccessMatrix={() => setIsAccessMatrixOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenMobileConnect={() => setIsMobileConnectOpen(true)}
        onLogout={handleLogout}
        onOpenUserProfile={() => setIsUserProfileOpen(true)}
        onOpenInviteUser={['admin', 'it_developer'].includes(currentUser.role) ? () => setIsInviteUserOpen(true) : undefined}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Hydration Error Banner */}
      {hydrationError && (
        <div className="mx-auto max-w-7xl px-4 py-2 bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between">
          <span>âڑ  {hydrationError}</span>
          <button onClick={() => { setHydrationError(null); refreshAllServerData(); }} className="ml-4 text-amber-700 hover:text-amber-900 font-bold text-sm px-2 py-1 rounded border border-amber-300">طھظ„ط§ط´ ظ…ط¬ط¯ط¯</button>
        </div>
      )}

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }}
          userRole={currentUser.role}
          pendingBoardingTasks={pendingBoardingTasks}
          waitingPetsCount={clinicPresenceCount}
          unreadAlertsCount={unreadNotifsCount}
          onLogout={handleLogout}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic Content Area */}
        <main className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 overflow-y-auto w-full min-w-0 max-w-full lg:max-w-5xl pb-24 lg:pb-8">
          {activeTab === 'dashboard' && (
            <SeniorManagerPanel
              username={currentUser.username}
              creatorName={currentUser.name}
              isManager={
                currentUser.role === 'admin' ||
                currentUser.role === 'it_developer' ||
                currentUser.role === 'senior_veterinarian' ||
                currentUser.username === 'admin' ||
                currentUser.username === 'dr.amin.bayati' ||
                currentUser.username === 'dr.bayati'
              }
              onOpenFullTasks={() => setActiveTab('staff_tasks')}
            />
          )}

          {activeTab === 'staff_tasks' && (
            <StaffTasksDelegationTab
              currentUser={currentUser}
              isManager={
                currentUser.role === 'admin' ||
                currentUser.role === 'it_developer' ||
                currentUser.role === 'senior_veterinarian' ||
                currentUser.username === 'admin' ||
                currentUser.username === 'dr.amin.bayati' ||
                currentUser.username === 'dr.bayati'
              }
            />
          )}

          {activeTab === 'internal_messenger' && (
            <InternalMessengerTab
              currentUser={currentUser}
              isManager={
                currentUser.role === 'admin' ||
                currentUser.role === 'it_developer' ||
                currentUser.role === 'senior_veterinarian' ||
                currentUser.username === 'admin' ||
                currentUser.username === 'dr.amin.bayati' ||
                currentUser.username === 'dr.bayati'
              }
              initialRoomId={messengerInitialRoomId}
            />
          )}
          {activeTab === 'dashboard' && (
            <DashboardTab
              pets={pets}
              appointments={appointments}
              boardingRecords={boardingRecords}
              visits={visits}
              invoices={invoices}
              attendance={attendanceRecords}
              userRole={currentUser.role}
              onOpenVoiceSecretary={() => setIsVoiceSecretaryOpen(true)}
              onOpenVisitorCamera={() => setIsVisitorCameraOpen(true)}
              onNavigateToTab={setActiveTab}
              onSelectPet={(p) => {
                setSelectedPetForDrawer(p);
                setActiveTab('medical_records');
              }}
              onCheckOutPet={(id) => handleCheckInPet(id, 'not_present')}
            />
          )}

          {activeTab === 'surgery_suite' && !HIDDEN_TABS.has('surgery_suite') && (
            <SurgerySuiteTab
              operations={surgerySessions}
              onUpdateOperations={handleUpdateSurgerySessions}
              emergencyProtocols={initialSurgeryEmergencyProtocols}
              onDirectRecordVisit={(visitData, cost) => handleRecordVisit(visitData, cost)}
              userRole={currentUser.role}
            />
          )}

          {activeTab === 'grooming_suite' && !HIDDEN_TABS.has('grooming_suite') && (
            <GroomingSuiteTab
              styles={groomingStyles}
              onUpdateStyles={handleUpdateGroomingStyles}
              portfolio={groomingPortfolio}
              onUpdatePortfolio={handleUpdateGroomingPortfolio}
              pets={pets}
              owners={owners}
              onAddTipLedger={(entry) => setStaffTipLedger((prev) => [entry, ...prev])}
            />
          )}

          {activeTab === 'voice_secretary' && (
            <div className="space-y-6">
              <div className="group bg-white p-6 rounded-[28px] border border-[#E6E9DF] shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-[#2D3A27]">ظ…ط§عکظˆظ„ ظ…ظ†ط´غŒ طµظˆطھغŒ ظ‡ظˆط´ظ…ظ†ط¯ (VetNLP Core)</h2>
                  <p data-hover-description className="text-xs text-[#5C7457]">
                    طھط´ط®غŒطµ ع¯ظپطھط§ط± ظ…ط­ظ„غŒ ظˆ ط§ط¨ط±غŒطŒ طھط·ط¨غŒظ‚ ط¨ط§ ط­غŒظˆط§ظ†ط§طھ ط­ط§ط¶ط± ط¯ط± ظ„ط§ط¨غŒ ظˆ ط«ط¨طھ ط¨ط¯ظˆظ† ظ„ظ…ط³ ع©غŒط¨ظˆط±ط¯
                  </p>
                </div>
                <button
                  onClick={() => setIsVoiceSecretaryOpen(true)}
                  className="bg-[#4A6741] hover:bg-[#3D5535] text-white font-black text-xs px-5 py-2.5 rounded-2xl shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  ط¨ط§ط² ع©ط±ط¯ظ† ظ¾ظ†ط¬ط±ظ‡ طµظˆطھغŒ
                </button>
              </div>
              <DashboardTab
                pets={pets}
                appointments={appointments}
                boardingRecords={boardingRecords}
                visits={visits}
                invoices={invoices}
                attendance={attendanceRecords}
                userRole={currentUser.role}
                onOpenVoiceSecretary={() => setIsVoiceSecretaryOpen(true)}
                onOpenVisitorCamera={() => setIsVisitorCameraOpen(true)}
                onNavigateToTab={setActiveTab}
                onSelectPet={(p) => {
                  setSelectedPetForDrawer(p);
                  setActiveTab('reception_pets');
                }}
                onCheckOutPet={(id) => handleCheckInPet(id, 'not_present')}
              />
            </div>
          )}

          {activeTab === 'pet_shop' && !HIDDEN_TABS.has('pet_shop') && (
            <PetShopMdiTab
              products={products}
              onUpdateProducts={handleUpdateProducts}
              suppliers={suppliers}
              onUpdateSuppliers={handleUpdateSuppliers}
              staffPrivileges={staffPurchasePrivileges}
              onUpdateStaffPrivileges={setStaffPurchasePrivileges}
              pets={pets}
              owners={owners}
            />
          )}

          {activeTab === 'reception_pets' && (
            <ReceptionPetsTab
              pets={pets}
              owners={owners}
              onAddPet={handleAddPet}
              onUpdatePet={(updated) => {
                setPets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                apiClient.savePatient(updated).catch((e) => console.error('Save pet failed:', e));
              }}
              onDeletePet={handleDeletePet}
              onCheckInPet={handleCheckInPet}
              onPrintPassport={handlePrintPassport}
              selectedPetForDrawer={selectedPetForDrawer}
              onNavigateToMedicalRecords={(pet) => {
                setSelectedPetForDrawer(pet);
                setActiveTab('medical_records');
              }}
              onNavigateToCashier={() => setActiveTab('cashier_finance')}
            />
          )}

          {activeTab === 'appointments' && (
            <AppointmentsTab
              appointments={appointments}
              pets={pets}
              queues={queues}
              onAddAppointment={handleCreateAppointment}
              onUpdateStatus={handleUpdateAppointmentStatus}
              onDeleteAppointment={handleDeleteAppointment}
              onApproveOnlineRequest={handleApproveOnlineRequest}
              onConfirmDepositPayment={handleConfirmDepositPayment}
              onCreateQueue={handleCreateQueue}
              onUpdateQueue={handleUpdateQueue}
              onToggleReminder={(aptId) => {
                setAppointments((prev) =>
                  prev.map((a) => (a.id === aptId ? { ...a, reminder24hSent: true } : a))
                );
              }}
              onDirectRecordImmediateService={(petId, serviceTitle, cost) => {
                const targetPet = pets.find((p) => p.id === petId) || pets[0];
                handleRecordVisit(
                  {
                    petId: targetPet.id,
                    petName: targetPet.name,
                    ownerId: targetPet.ownerId,
                    ownerName: targetPet.ownerName,
                    chiefComplaint: serviceTitle,
                    diagnosis: `ط§ط±ط§ط¦ظ‡ ط®ط¯ظ…طھ ظپظˆط±غŒ ظˆ ظ…ط³طھظ‚غŒظ…: ${serviceTitle}`,
                    serviceType: 'general_exam',
                    procedures: [serviceTitle],
                  },
                  cost
                );
              }}
            />
          )}

          {activeTab === 'it_dev_ide' && !HIDDEN_TABS.has('it_dev_ide') && (
            <ItDeveloperIdeTab
              files={devFiles}
              logs={devLogs}
              promptHistory={promptHistory}
              apiTests={apiTests}
              onSaveFile={handleSaveDevFile}
              onCreateFile={handleCreateDevFile}
              onRunScript={handleRunDevScript}
              onExecuteAIPrompt={handleExecuteAIPrompt}
              onApplyAICodeToFile={handleApplyAICodeToFile}
              onTestApiEndpoint={handleTestApiEndpoint}
              onClearLogs={handleClearDevLogs}
              onClearDatabase={handleClearDatabase}
              onSeedDatabase={handleSeedDatabase}
              onSendToMigrationPipeline={handleSendToMigrationPipeline}
            />
          )}

          {activeTab === 'medical_records' && (
            <MedicalRecordsTab
              visits={visits}
              pets={pets}
              vaccinations={vaccinations}
              onAddVisit={handleRecordVisit}
              onRecordVaccine={handleRecordVaccine}
              onUploadAttachment={(visId: string, att: MedicalAttachment) => {
                setVisits((prev) =>
                  prev.map((v) =>
                    v.id === visId
                      ? {
                          ...v,
                          attachments: [att, ...v.attachments],
                          documentationStatus: 'uploaded',
                          documentReminderActive: false,
                        }
                      : v
                  )
                );
                apiClient.addAttachmentToVisit(visId, att).catch((e) => console.error('Attachment upload failed:', e));
              }}
              onDeleteVisit={handleDeleteVisit}
              initialSelectedPetId={selectedPetForDrawer?.id}
              onNavigateToCashier={() => setActiveTab('cashier_finance')}
            />
          )}

          {activeTab === 'boarding' && !HIDDEN_TABS.has('boarding') && (
            <BoardingTab
              boardingRecords={boardingRecords}
              pets={pets}
              onToggleTask={handleToggleBoardingTask}
              onAdmitNewPet={handleAdmitNewBoarding}
              onDeleteBoarding={handleDeleteBoarding}
            />
          )}

          {activeTab === 'cashier' && !HIDDEN_TABS.has('cashier') && (
            <CashierFinanceTab
              invoices={invoices}
              onUpdateInvoicePayment={handleUpdateInvoicePayment}
              onDeleteInvoice={handleDeleteInvoice}
              onPrintInvoice={handlePrintInvoice}
            />
          )}

          {activeTab === 'voice_secretary' && !HIDDEN_TABS.has('voice_secretary') && (
            <TelephonySecretaryTab
              pets={pets}
              onAddAppointment={handleCreateAppointment}
              onOpenVoiceModal={() => setIsVoiceSecretaryOpen(true)}
            />
          )}

          {activeTab === 'attendance' && !HIDDEN_TABS.has('attendance') && (
            <AttendanceTab
              attendanceRecords={attendanceRecords}
              onClockIn={handleClockIn}
              onClockOut={handleClockOut}
            />
          )}

          {activeTab === 'visitor_camera' && !HIDDEN_TABS.has('visitor_camera') && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[28px] border border-[#E6E9DF] shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-[#2D3A27]">ط¯ظˆط±ط¨غŒظ† ظˆط±ظˆط¯غŒ ظˆ طھط´ط®غŒطµ ظ‡ظˆغŒطھ ظ…ط±ط§ط¬ط¹غŒظ† (AI Vision)</h2>
                  <p className="text-xs text-[#5C7457]">
                    ظ¾ط±ط¯ط§ط²ط´ طھطµظˆغŒط±غŒ ع†ظ‡ط±ظ‡ ظˆ ظ†عکط§ط¯ ط­غŒظˆط§ظ† ط¨ط§ ظ…ط¯ظ„ ع†ظ†ط¯ظˆط¬ظ‡غŒ Gemini Vision
                  </p>
                </div>
                <button
                  onClick={() => setIsVisitorCameraOpen(true)}
                  className="bg-[#4A6741] hover:bg-[#3D5535] text-white font-black text-xs px-5 py-2.5 rounded-2xl shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  ط§ط¬ط±ط§غŒ ط§ط³ع©ظ†ط± ط¯ظˆط±ط¨غŒظ† ظˆط±ظˆط¯غŒ
                </button>
              </div>
              <DashboardTab
                pets={pets}
                appointments={appointments}
                boardingRecords={boardingRecords}
                visits={visits}
                invoices={invoices}
                attendance={attendanceRecords}
                userRole={currentUser.role}
                onOpenVoiceSecretary={() => setIsVoiceSecretaryOpen(true)}
                onOpenVisitorCamera={() => setIsVisitorCameraOpen(true)}
                onNavigateToTab={setActiveTab}
                onSelectPet={(p) => {
                  setSelectedPetForDrawer(p);
                  setActiveTab('reception_pets');
                }}
                onCheckOutPet={(id) => handleCheckInPet(id, 'not_present')}
              />
            </div>
          )}

          {activeTab === 'print_templates' && !HIDDEN_TABS.has('print_templates') && (
            <PrintTemplatesTab
              templates={printTemplates}
              pets={pets}
              onUpdateTemplate={(tmpl) =>
                setPrintTemplates((prev) => prev.map((t) => (t.id === tmpl.id ? tmpl : t)))
              }
            />
          )}

          {activeTab === 'ai_vet_assistant' && !HIDDEN_TABS.has('ai_vet_assistant') && <AiVetAssistantTab pets={pets} />}

          {activeTab === 'dvr_cctv' && !HIDDEN_TABS.has('dvr_cctv') && <DvrCctvTab />}

          {activeTab === 'cloud_migration' && !HIDDEN_TABS.has('cloud_migration') && (
            <CloudSyncMigrationTab
              syncQueue={syncQueue}
              pets={pets}
              visits={visits}
              externalJsonPayload={migrationJsonPayload}
              initialTab={migrationJsonPayload ? 'migration' : 'sync'}
              onTriggerSyncNow={() =>
                setSyncQueue((prev) => prev.map((item) => ({ ...item, status: 'synced' })))
              }
              onMigrationCommitted={refreshAllServerData}
            />
          )}
        </main>
      </div>

      {/* Flagship Voice Secretary Modal */}
      <VoiceSecretaryModal
        isOpen={isVoiceSecretaryOpen}
        onClose={() => setIsVoiceSecretaryOpen(false)}
        allPets={pets}
        currentUserRole={currentUser.role}
        onRecordVisit={handleRecordVisit}
        onRecordVaccine={handleRecordVaccine}
        onAdmitBoarding={handleAdmitBoarding}
        onCreateAppointment={(petId, title) =>
          handleCreateAppointment({
            petId,
            petName: pets.find((p) => p.id === petId)?.name || 'ظ¾طھ',
            petBreed: pets.find((p) => p.id === petId)?.breed || 'ظ†عکط§ط¯',
            ownerId: pets.find((p) => p.id === petId)?.ownerId || 'own-1',
            ownerName: pets.find((p) => p.id === petId)?.ownerName || 'ط³ط±ظ¾ط±ط³طھ',
            ownerPhone: pets.find((p) => p.id === petId)?.ownerPhone || '09120000000',
            date: 'ط§ظ…ط±ظˆط²',
            timeSlot: 'غ±غ¸:غ°غ° - غ±غ¸:غ³غ°',
            serviceType: title,
            vetId: 'u-1',
            vetName: 'ط¯ع©طھط± ط§ظ…غŒظ† ط¨غŒط§طھغŒ',
            status: 'scheduled',
            appointmentType: 'future_appointment',
            requiresDeposit: false,
            depositAmount: 0,
            depositStatus: 'none',
            reminder24hSent: false,
            notes: 'ط«ط¨طھ ط´ط¯ظ‡ طھظˆط³ط· ظ…ظ†ط´غŒ طµظˆطھغŒ ظ‡ظˆط´ظ…ظ†ط¯ ع©ظ„غŒظ†غŒع©',
          })
        }
      />

      {/* Visitor Entrance Camera AI Modal */}
      <VisitorCameraModal
        isOpen={isVisitorCameraOpen}
        onClose={() => setIsVisitorCameraOpen(false)}
        allPets={pets}
        onSelectPetForReception={(matchedPet) => {
          handleCheckInPet(matchedPet.id, 'waiting');
          setSelectedPetForDrawer(matchedPet);
          setActiveTab('reception_pets');
        }}
        onRegisterQuickVisitor={(desc, tempId) => {
          const quickPet: Pet = {
            id: `pet-quick-${Date.now()}`,
            name: `ظ…ط±ط§ط¬ط¹ ط¬ط¯غŒط¯ (${tempId})`,
            species: 'ط³ع¯',
            breed: 'ظ¾ط§ظ…ط±ط§ظ†غŒظ† (طھط´ط®غŒطµ ط¯ظˆط±ط¨غŒظ†)',
            gender: 'ظ†ط±',
            birthDate: 'غ±غ´غ°غ²/غ°غ±/غ°غ±',
            ageText: 'طھظ‚ط±غŒط¨غŒ غ² ط³ط§ظ„',
            weightKg: 4.0,
            color: 'ع©ط±ظ…',
            microchipNumber: `CHIP-TEMP-${Math.floor(Math.random() * 89999 + 10000)}`,
            photoUrl:
              'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&auto=format&fit=crop&q=80',
            ownerId: `own-quick-${Date.now()}`,
            ownerName: 'ظ…ط±ط§ط¬ط¹ظ‡â€Œع©ظ†ظ†ط¯ظ‡ ظˆط±ظˆط¯غŒ ظ„ط§ط¨غŒ',
            ownerPhone: '09120000000',
            statusInClinic: 'waiting',
            checkInTime: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            lastVisitDate: 'ط§ظ…ط±ظˆط² (طھط´ع©غŒظ„ ظ¾ط±ظˆظ†ط¯ظ‡ ظ…ظˆظ‚طھ)',
            nextVaccineDate: 'غ±غ´غ°غ´/غ°غ±/غ°غ±',
            nextParasiteDate: 'غ±غ´غ°غ³/غ°غ·/غ°غ±',
            allergies: [],
            isVaccinated: false,
            notes: desc,
          };
          handleAddPet(quickPet);
          setSelectedPetForDrawer(quickPet);
          setActiveTab('reception_pets');
        }}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        currentUserRole={currentUser.role}
        currentUserName={currentUser.name}
        onUpdateActionStatus={handleUpdateNotificationAction}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
      />

      {/* Snapp Pet Taxi Dispatch Modal */}
      <SnappPetTaxiModal
        isOpen={isSnappTaxiOpen}
        onClose={() => setIsSnappTaxiOpen(false)}
        pets={pets}
        owners={owners}
        clinicProfile={clinicProfile}
      />

      {/* Clinic Profile & Identity Settings Modal */}
      <ClinicProfileSettingsModal
        isOpen={isClinicProfileOpen}
        onClose={() => setIsClinicProfileOpen(false)}
        profile={clinicProfile}
        clinicProfile={clinicProfile}
        onSaveProfile={handleUpdateClinicProfile}
        onUpdateProfile={handleUpdateClinicProfile}
        currentRole={currentUser.role}
      />

      {/* Access Matrix & RBAC Management Modal */}
      <AccessMatrixManagementModal
        isOpen={isAccessMatrixOpen}
        onClose={() => setIsAccessMatrixOpen(false)}
        rolePermissions={accessMatrix?.rules || []}
        onUpdateRolePermissions={handleUpdateAccessMatrix}
        securityAlerts={accessMatrix?.alerts || []}
        onUpdateSecurityAlerts={(alerts) => setAccessMatrix(prev => ({ ...prev, alerts }))}
        currentRole={currentUser.role}
        currentUserName={currentUser.name}
      />

      {/* Keyboard Shortcuts Guide Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Mobile, Tablet & Multi-Client Connect Modal */}
      <MobileTabletConnectModal
        isOpen={isMobileConnectOpen}
        onClose={() => setIsMobileConnectOpen(false)}
      />

      {isUserProfileOpen && (
        <UserProfileModal
          user={currentUser}
          onClose={() => setIsUserProfileOpen(false)}
          onSaved={(user) => setCurrentUser(user)}
        />
      )}

      <InviteUserModal
        isOpen={isInviteUserOpen}
        onClose={() => setIsInviteUserOpen(false)}
        onCreated={() => undefined}
      />

      {/* Direct Print Document Modal */}
      {printModalData.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3A27]/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white text-[#2D3A27] w-full max-w-2xl rounded-[28px] shadow-2xl border border-[#E6E9DF] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#E6E9DF] flex items-center justify-between bg-[#F7F8F3]">
              <h3 className="text-base font-extrabold text-[#2D3A27]">{printModalData.title}</h3>
              <button
                onClick={() => setPrintModalData({ ...printModalData, isOpen: false })}
                className="p-1.5 text-[#5C7457] hover:text-[#2D3A27] rounded-lg cursor-pointer"
              >
                âœ•
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-[#F7F8F3] flex justify-center">
              <div
                className="bg-white p-8 rounded-2xl shadow-sm border border-[#E6E9DF] w-full max-w-xl text-[#2D3A27]"
                dangerouslySetInnerHTML={{ __html: printModalData.htmlContent }}
              />
            </div>

            <div className="p-4 bg-[#F7F8F3] border-t border-[#E6E9DF] flex items-center justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => setPrintModalData({ ...printModalData, isOpen: false })}
                className="px-4 py-2 bg-[#E6E9DF] hover:bg-[#D4E0CD] text-[#2D3A27] rounded-xl cursor-pointer transition-colors"
              >
                ط¨ط³طھظ†
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-[#4A6741] hover:bg-[#3D5535] text-white rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
              >
                ع†ط§ظ¾ ظ†ظ‡ط§غŒغŒ / ط§ط±ط³ط§ظ„ ط¨ظ‡ ظ¾ط±غŒظ†طھط±
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Emergency Summon Alert Modal (Admin Force Attendance) */}
      <EmergencySummonModal
        currentUser={currentUser}
        onJoinRoom={(roomId) => {
          setMessengerInitialRoomId(roomId);
          setActiveTab('internal_messenger');
        }}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        onToggleMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        isMenuOpen={isMobileMenuOpen}
        waitingPetsCount={clinicPresenceCount}
        unreadAlertsCount={unreadNotifsCount}
      />
    </div>
  );
}

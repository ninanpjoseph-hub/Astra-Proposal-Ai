import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Calendar, CheckSquare, Square, Users, Mail, ShieldAlert, 
  BarChart3, Activity, Bell, Lock, Unlock, LogOut, Check, ChevronDown, 
  Clock, RefreshCw, AlertCircle, TrendingUp, Sparkles, UserCheck, UserX,
  FileText, Shield, Sparkle, Coins, DollarSign, Wallet, CreditCard
} from 'lucide-react';
import { Proposal, User, UserRole, ProposalStatus, Reminder, ActivityLog } from '../types';
import { formatQAR, generateId, triggerAutomatedFollowUp } from '../proposalUtils';

interface AdminPortalProps {
  proposals: Proposal[];
  onUpdateProposals: (updatedList: Proposal[]) => void;
  currentUser: User | null;
  onLoginUser: (user: User | null) => void;
  onViewProposalDetail?: (proposal: Proposal, tab?: 'document' | 'history' | 'payment') => void;
}

const DEFAULT_USERS: User[] = [
  { id: 'user_ninan', name: 'Ninan P Joseph', email: 'ninanpjoseph@gmail.com', role: UserRole.ADMIN, isActive: true },
  { id: 'user_sarah', name: 'Sarah Ahmed', email: 'sarah@astra.tech', role: UserRole.MANAGER, isActive: true },
  { id: 'user_carlos', name: 'Carlos Ruiz', email: 'carlos@astra.tech', role: UserRole.SALES, isActive: true },
  { id: 'user_lina', name: 'Lina Vance', email: 'lina@astra.tech', role: UserRole.DESIGNER, isActive: true },
];

export default function AdminPortal({ proposals, onUpdateProposals, currentUser, onLoginUser, onViewProposalDetail }: AdminPortalProps) {
  // Systems States
  const [users, setUsers] = useState<User[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Daily automated email reminder simulation states
  const [dailyEmailLogs, setDailyEmailLogs] = useState<{
    id: string;
    timestamp: string;
    proposalId: string;
    clientName: string;
    projectName: string;
    creatorName: string;
    creatorEmail: string;
    subject: string;
    body: string;
  }[]>([]);

  const [dailyRunHistory, setDailyRunHistory] = useState<{
    date: string;
    countSent: number;
    timestamp: string;
  }[]>([]);

  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

  // SMTP Sender outbound settings derived dynamically from backend environment/secrets
  const [smtpFromEmail, setSmtpFromEmail] = useState<string>('ninan@technoastra.com');
  const [smtpFromName, setSmtpFromName] = useState<string>('Astra Automated Delivery');

  // Local UI States
  const [activeTab, setActiveTab] = useState<'overview' | 'proposals' | 'users' | 'reminders' | 'logs' | 'payments'>('overview');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  
  // Login credentials mock state
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginErr, setLoginErr] = useState<string>('');

  // User form states
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.SALES);
  const [newUserPassword, setNewUserPassword] = useState<string>('');

  // Editing existing user profile/credentials states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState<string>('');
  const [editingUserEmail, setEditingUserEmail] = useState<string>('');
  const [editingUserRole, setEditingUserRole] = useState<UserRole>(UserRole.SALES);
  const [editingUserPassword, setEditingUserPassword] = useState<string>('');

  // Status updates states
  const [editingPropId, setEditingPropId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ProposalStatus>(ProposalStatus.DRAFT);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [selectedSharedUserIds, setSelectedSharedUserIds] = useState<string[]>([]);

  // Reminder form states
  const [newReminderTitle, setNewReminderTitle] = useState<string>('');
  const [newReminderDate, setNewReminderDate] = useState<string>('');
  const [newReminderNotes, setNewReminderNotes] = useState<string>('');
  const [reminderProposalId, setReminderProposalId] = useState<string>('');

  // Payment Tracker tab states
  const [payFilter, setPayFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [paySort, setPaySort] = useState<'latest' | 'value' | 'pendingAmount'>('latest');

  // Search & Filters in Admin space
  const [adminSearch, setAdminSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');

  // Load backend systems on startup from local storage or defaults
  useEffect(() => {
    async function loadDataFromDb() {
      // 0. Fetch outgoing SMTP system configurations
      try {
        const configRes = await fetch('/api/config');
        if (configRes.ok) {
          const configObj = await configRes.json();
          if (configObj.smtpFromEmail) setSmtpFromEmail(configObj.smtpFromEmail);
          if (configObj.smtpFromName) setSmtpFromName(configObj.smtpFromName);
        }
      } catch (err: any) {
        console.warn("Could not retrieve dynamic system configuration secrets:", err.message);
      }

      // 1. Users list sync
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const rawUsers = await res.json();
          if (Array.isArray(rawUsers) && rawUsers.length > 0) {
            const packedUsers = rawUsers.map((u: any) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              isActive: u.is_active === 1,
              password: u.password || undefined
            }));
            setUsers(packedUsers);
            localStorage.setItem('prowess_admin_users', JSON.stringify(packedUsers));
          } else {
            const cachedUsers = localStorage.getItem('prowess_admin_users');
            if (cachedUsers) setUsers(JSON.parse(cachedUsers));
            else {
              setUsers(DEFAULT_USERS);
              localStorage.setItem('prowess_admin_users', JSON.stringify(DEFAULT_USERS));
            }
          }
        } else {
          throw new Error("HTTP failure");
        }
      } catch (err) {
        console.warn("Could not retrieve users from database, using cached backup:", err);
        const cachedUsers = localStorage.getItem('prowess_admin_users');
        if (cachedUsers) {
          try { setUsers(JSON.parse(cachedUsers)); } catch { setUsers(DEFAULT_USERS); }
        } else {
          setUsers(DEFAULT_USERS);
          localStorage.setItem('prowess_admin_users', JSON.stringify(DEFAULT_USERS));
        }
      }

      // 2. Activity Logs sync
      try {
        const res = await fetch('/api/activity-logs');
        if (res.ok) {
          const rawLogs = await res.json();
          if (Array.isArray(rawLogs) && rawLogs.length > 0) {
            const packedLogs = rawLogs.map((l: any) => ({
              id: l.id,
              timestamp: l.timestamp,
              userId: l.user_id,
              userName: l.user_name,
              userRole: l.user_role,
              action: l.action,
              details: l.details
            }));
            setActivityLogs(packedLogs);
            localStorage.setItem('prowess_admin_logs', JSON.stringify(packedLogs));
          } else {
            const cachedLogs = localStorage.getItem('prowess_admin_logs');
            if (cachedLogs) {
              try { setActivityLogs(JSON.parse(cachedLogs)); } catch { setActivityLogs([]); }
            }
          }
        }
      } catch (err) {
        console.warn("Could not retrieve logs from database, using cached backup:", err);
        const cachedLogs = localStorage.getItem('prowess_admin_logs');
        if (cachedLogs) {
          try { setActivityLogs(JSON.parse(cachedLogs)); } catch { setActivityLogs([]); }
        }
      }
    }

    loadDataFromDb();

    // 3. Reminders System Loads
    const cachedReminders = localStorage.getItem('prowess_admin_reminders');
    if (cachedReminders) {
      try {
        setReminders(JSON.parse(cachedReminders));
      } catch {
        setReminders([]);
      }
    }

    // 4. Daily email reminders logs and run histories
    const cachedEmlLogs = localStorage.getItem('prowess_daily_email_logs');
    if (cachedEmlLogs) {
      try {
        setDailyEmailLogs(JSON.parse(cachedEmlLogs));
      } catch {
        setDailyEmailLogs([]);
      }
    }
    const cachedRunHistory = localStorage.getItem('prowess_daily_run_history');
    if (cachedRunHistory) {
      try {
        setDailyRunHistory(JSON.parse(cachedRunHistory));
      } catch {
        setDailyRunHistory([]);
      }
    }

    // Read current session from localStorage if already saved
    const activeSession = localStorage.getItem('prowess_session_user');
    if (activeSession) {
      try {
        onLoginUser(JSON.parse(activeSession));
      } catch {
        // Safe standard fall-through
      }
    }
  }, []);

  // Sync reminders dynamically to support automated additions anywhere in the app
  useEffect(() => {
    const handleSyncReminders = () => {
      const latest = localStorage.getItem('prowess_admin_reminders');
      if (latest) {
        try {
          const parsed = JSON.parse(latest);
          setReminders(parsed);
        } catch (e) {
          console.error("Failed to sync automated reminders", e);
        }
      }
    };

    window.addEventListener('storage', handleSyncReminders);
    window.addEventListener('reminders_updated' as any, handleSyncReminders);

    // Also poll occasionally as fallback
    const syncInterval = setInterval(handleSyncReminders, 1200);

    return () => {
      window.removeEventListener('storage', handleSyncReminders);
      window.removeEventListener('reminders_updated' as any, handleSyncReminders);
      clearInterval(syncInterval);
    };
  }, []);

  // Tab access reset if user role changes or is not admin
  useEffect(() => {
    if (currentUser?.role !== UserRole.ADMIN && (activeTab === 'users' || activeTab === 'logs')) {
      setActiveTab('overview');
    }
  }, [currentUser, activeTab]);

  // Save changes helper
  const saveUsers = (updated: User[]) => {
    setUsers(updated);
    localStorage.setItem('prowess_admin_users', JSON.stringify(updated));
  };

  const saveReminders = (updated: Reminder[]) => {
    setReminders(updated);
    localStorage.setItem('prowess_admin_reminders', JSON.stringify(updated));
  };

  const saveLogs = (updated: ActivityLog[]) => {
    setActivityLogs(updated);
    localStorage.setItem('prowess_admin_logs', JSON.stringify(updated));
  };

  // Log action helper
  const addLog = async (action: string, details: string) => {
    const actor = currentUser || { id: 'system', name: 'Anonymous User', role: UserRole.SALES };
    const newEntry: ActivityLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 10),
      timestamp: new Date().toISOString(),
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action,
      details
    };
    const updated = [newEntry, ...activityLogs];
    saveLogs(updated);

    try {
      await fetch('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      });
    } catch (err: any) {
      console.warn("Could not push administrative activity log, staying local:", err.message);
    }
  };

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr('');

    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      alert('Permission Denied: Only administrators are authorized to switch user sessions.');
      return;
    }
    
    // Simple email matching bypass passwords for prototype usability
    const found = users.find(u => u.email.toLowerCase().trim() === loginEmail.toLowerCase().trim());
    if (!found) {
      setLoginErr('Email handle not registered');
      return;
    }
    if (!found.isActive) {
      setLoginErr('This user account is currently deactivated');
      return;
    }

    onLoginUser(found);
    localStorage.setItem('prowess_session_user', JSON.stringify(found));
    setShowLoginModal(false);
    
    // Log Activity
    const actor = found;
    const newEntry: ActivityLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 10),
      timestamp: new Date().toISOString(),
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action: 'User Login',
      details: `${actor.name} (${actor.role}) logged directly into the workspace admin console.`
    };
    saveLogs([newEntry, ...activityLogs]);
  };

  const handleLogout = () => {
    if (currentUser) {
      addLog('User Logout', `${currentUser.name} signed out.`);
    }
    onLoginUser(null);
    localStorage.removeItem('prowess_session_user');
  };

  // User CRUD operations
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    if (users.find(u => u.email.toLowerCase() === newUserEmail.toLowerCase().trim())) {
      alert('Email handles must be unique. This email is already registered.');
      return;
    }

    const customPass = newUserPassword.trim();

    const newUser: User = {
      id: 'user_' + Math.random().toString(36).substring(2, 10),
      name: newUserName.trim(),
      email: newUserEmail.toLowerCase().trim(),
      role: newUserRole,
      isActive: true,
      password: customPass || undefined
    };

    const updated = [...users, newUser];
    saveUsers(updated);
    addLog('Create User', `Registered user "${newUser.name}" with role "${newUser.role}". Password was ${customPass ? 'set manually' : 'determined by role default'}.`);

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });
    } catch (err: any) {
      console.warn("Could not save new user to database server:", err.message);
    }
    
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
  };

  const handleStartEditUser = (u: User) => {
    setEditingUserId(u.id);
    setEditingUserName(u.name);
    setEditingUserEmail(u.email);
    setEditingUserRole(u.role);
    const currentPass = u.password || (
      u.id === 'user_ninan' ? 'admin' :
      u.id === 'user_sarah' ? 'manager' :
      u.id === 'user_carlos' ? 'sales' :
      u.id === 'user_lina' ? 'designer' :
      u.role === UserRole.ADMIN ? 'admin123' :
      u.role === UserRole.MANAGER ? 'manager123' :
      u.role === UserRole.SALES ? 'sales123' :
      u.role === UserRole.DESIGNER ? 'designer123' :
      'prowess2026'
    );
    setEditingUserPassword(currentPass);
  };

  const handleEditUserSave = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!editingUserId || !editingUserName.trim() || !editingUserEmail.trim()) return;

    if (users.some(u => u.id !== editingUserId && u.email.toLowerCase() === editingUserEmail.toLowerCase().trim())) {
      alert('Email handles must be unique. This email is already registered.');
      return;
    }

    const updated = users.map(u => {
      if (u.id === editingUserId) {
        return {
          ...u,
          name: editingUserName.trim(),
          email: editingUserEmail.toLowerCase().trim(),
          role: editingUserRole,
          password: editingUserPassword.trim() || undefined
        };
      }
      return u;
    });

    saveUsers(updated);
    addLog('Update User Profile', `Admin updated profile/password for "${editingUserName}".`);

    const editedUser = updated.find(u => u.id === editingUserId);
    if (editedUser) {
      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(editedUser)
        });
      } catch (err: any) {
        console.warn("Could not edit user on database server:", err.message);
      }
    }
    
    // Clear state
    setEditingUserId(null);
    setEditingUserName('');
    setEditingUserEmail('');
    setEditingUserPassword('');
  };

  const handleToggleUserActive = async (userId: string) => {
    const userToEdit = users.find(u => u.id === userId);
    if (!userToEdit) return;
    if (userId === currentUser?.id) {
      alert('You cannot deactivate your own active session.');
      return;
    }

    const updated = users.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u);
    saveUsers(updated);
    addLog('User Account Status', `Toggled activation status for ${userToEdit.name} (Now: ${!userToEdit.isActive ? 'Inactive' : 'Active'})`);

    const editedUser = updated.find(u => u.id === userId);
    if (editedUser) {
      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(editedUser)
        });
      } catch (err: any) {
        console.warn("Could not toggle user active state on database server:", err.message);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDel = users.find(u => u.id === userId);
    if (!userToDel) return;
    if (userId === currentUser?.id) {
      alert('You cannot permanently remove your own active login.');
      return;
    }

    if (confirm(`Remove custom user "${userToDel.name}" permanently?`)) {
      const updated = users.filter(u => u.id !== userId);
      saveUsers(updated);
      addLog('Remove User', `Permanently removed account ${userToDel.name}.`);

      try {
        await fetch(`/api/users/${userId}`, {
          method: 'DELETE'
        });
      } catch (err: any) {
        console.warn("Could not delete user from database server:", err.message);
      }
    }
  };

  // Status and Team Assignment updates
  const handleOpenStatusEdit = (prop: Proposal) => {
    setEditingPropId(prop.id);
    setSelectedStatus(prop.status || ProposalStatus.DRAFT);
    setSelectedAssigneeId(prop.assignedUserId || '');
    setSelectedSharedUserIds(prop.sharedUserIds || []);
  };

  const handleSaveStatusUpdate = (propId: string) => {
    const prop = proposals.find(p => p.id === propId);
    if (!prop) return;

    const selectedAssignee = users.find(u => u.id === selectedAssigneeId);

    const updatedList = proposals.map(p => {
      if (p.id === propId) {
        return {
          ...p,
          status: selectedStatus,
          assignedUserId: selectedAssigneeId || undefined,
          assignedUserName: selectedAssignee ? selectedAssignee.name : undefined,
          sharedUserIds: selectedSharedUserIds,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    onUpdateProposals(updatedList);

    if (selectedStatus === ProposalStatus.COMPLETED) {
      triggerAutomatedFollowUp({
        ...prop,
        status: selectedStatus,
      });
    }
    
    // Formulate activity log
    const statusChangeText = prop.status !== selectedStatus ? `Status: ${prop.status || 'Draft'} \u2192 ${selectedStatus}` : '';
    const assignmentText = prop.assignedUserId !== selectedAssigneeId ? `Assigned: ${selectedAssignee?.name || 'Unassigned'}` : '';
    const shareCountChanged = (prop.sharedUserIds || []).length !== selectedSharedUserIds.length ? `Sharing authorizations updated` : '';
    const changesJoin = [statusChangeText, assignmentText, shareCountChanged].filter(Boolean).join(' | ');

    addLog('Update Proposal Controls', `Updated details for client ${prop.clientName}: ${changesJoin || 'No variables changed'}`);
    setEditingPropId(null);
  };

  // Follow up Reminders creation
  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim() || !newReminderDate || !reminderProposalId) {
      alert('Please fill out all reminder parameters.');
      return;
    }

    const linkedProp = proposals.find(p => p.id === reminderProposalId);
    if (!linkedProp) return;

    const newRem: Reminder = {
      id: 'rem_' + Math.random().toString(36).substring(2, 10),
      proposalId: reminderProposalId,
      proposalClient: linkedProp.clientName,
      title: newReminderTitle.trim(),
      dueDate: newReminderDate,
      notes: newReminderNotes.trim(),
      isCompleted: false,
      createdAt: new Date().toISOString()
    };

    const updated = [newRem, ...reminders];
    saveReminders(updated);
    addLog('Add Follow-up Reminder', `Scheduled reminder "${newRem.title}" for ${newRem.proposalClient} on ${newRem.dueDate}`);
    
    setNewReminderTitle('');
    setNewReminderDate('');
    setNewReminderNotes('');
    setReminderProposalId('');
  };

  const handleToggleReminderDone = (remId: string) => {
    const updated = reminders.map(r => {
      if (r.id === remId) {
        const flag = !r.isCompleted;
        addLog('Update Reminder Status', `${flag ? 'Completed' : 'Reopened'} follow-up reminder to "${r.title}" for ${r.proposalClient}`);
        return { ...r, isCompleted: flag };
      }
      return r;
    });
    saveReminders(updated);
  };

  const handleDeleteReminder = (remId: string) => {
    const rem = reminders.find(r => r.id === remId);
    if (!rem) return;
    const updated = reminders.filter(r => r.id !== remId);
    saveReminders(updated);
    addLog('Delete Reminder', `Removed follow-up reminder "${rem.title}" for ${rem.proposalClient}`);
  };

  const handleRunDailyEmailReminders = () => {
    // Open statuses: anything other than Won, Lost, and Closed
    const openProps = proposals.filter(p => {
      const currentStatus = p.status || ProposalStatus.DRAFT;
      return currentStatus !== ProposalStatus.WON &&
             currentStatus !== ProposalStatus.LOST &&
             currentStatus !== ProposalStatus.CLOSED;
    });

    if (openProps.length === 0) {
      alert("No active open opportunities found! Please ensure there are proposals whose status is NOT Closed, Won, or Lost.");
      return;
    }

    const timestamp = new Date().toISOString();
    const newLogs: any[] = [];

    openProps.forEach(p => {
      let creatorName = p.preparedByName || "Ninan P Joseph";
      let creatorEmail = "ninanpjoseph@gmail.com";

      if (p.preparedByUserId) {
        const u = users.find(user => user.id === p.preparedByUserId);
        if (u) {
          creatorName = u.name;
          creatorEmail = u.email;
        }
      } else if (p.assignedUserId) {
        const u = users.find(user => user.id === p.assignedUserId);
        if (u) {
          creatorName = u.name;
          creatorEmail = u.email;
        }
      }

      const projectName = p.companyName || p.clientName || "Astra Project";
      const subject = `[Daily Follow-up Alert] Active Opportunity: ${projectName}`;
      const body = `Dear ${creatorName},\n\n` +
        `This is your automated daily follow-up summary alert for the active opportunity "${projectName}" (Client: ${p.clientName}).\n\n` +
        `Project Summary & Current Parameters:\n` +
        `- Current Pipeline Status: ${p.status || "Draft"}\n` +
        `- Estimated Deal Contract Value: QAR ${p.totalCost.toLocaleString()}\n` +
        `- Last Record Update Timestamp: ${new Date(p.updatedAt || p.createdAt).toLocaleString()}\n\n` +
        `Action Item Required:\n` +
        `Please perform consistent touchpoint checks with your contact person to maintain momentum and progression down the sales funnel.\n\n` +
        `*Alert Cycle Lifetime: This system reminder dispatches scheduled messages every 24 hours. Emails will continue to be sent daily until this opportunity's pipeline status is officially updated to a closed state (Won, Lost, or Closed).`;

      // Calculate how many times we've reminded this proposal before
      const existingSentCount = dailyEmailLogs.filter(log => log.proposalId === p.id).length;

      newLogs.push({
        id: 'eml_' + Math.random().toString(36).substring(2, 10),
        timestamp,
        proposalId: p.id,
        clientName: p.clientName,
        projectName,
        creatorName,
        creatorEmail,
        subject,
        body,
        sentIndex: existingSentCount + 1
      });
    });

    const updatedLogs = [...newLogs, ...dailyEmailLogs];
    setDailyEmailLogs(updatedLogs);
    localStorage.setItem('prowess_daily_email_logs', JSON.stringify(updatedLogs));

    const todayStr = new Date().toISOString().split('T')[0];
    const newRun = {
      date: todayStr,
      countSent: openProps.length,
      timestamp
    };
    const updatedRuns = [newRun, ...dailyRunHistory];
    setDailyRunHistory(updatedRuns);
    localStorage.setItem('prowess_daily_run_history', JSON.stringify(updatedRuns));

    addLog("Daily Email Automation", `Auto-checked pipeline and simulated daily follow-up alerts to ${openProps.length} deal creators.`);
    alert(`Daily automated emails compiled and dispatched successfully!\n\nEmail follow-ups sent to ${openProps.length} active deal creators.`);
  };

  const handleClearDailyEmailLogs = () => {
    if (confirm("Are you sure you want to completely clear the simulated daily automated email reminder history from memory?")) {
      setDailyEmailLogs([]);
      setDailyRunHistory([]);
      localStorage.removeItem('prowess_daily_email_logs');
      localStorage.removeItem('prowess_daily_run_history');
      addLog("Daily Email Automation", "Cleared daily follow-up reminder logs and simulation run histories.");
    }
  };

  // Delete proposal via Admin permission bypass
  const handleAdminDeleteProposal = (id: string, clientName: string) => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      alert("Permission Denied: Only administrators are authorized to delete proposals.");
      return;
    }
    if (confirm(`ADMIN FORCE RESET: Authenticate deletion on proposal for "${clientName}" permanently?`)) {
      const updated = proposals.filter(p => p.id !== id);
      onUpdateProposals(updated);
      addLog('Admin Delete Proposal', `Permanently deleted proposal ID ${id} for client: ${clientName}`);
    }
  };

  // Filter core proposals for standard user roles
  const visibleProposals = proposals.filter(p => {
    if (!currentUser) return true;
    if (currentUser.role === UserRole.ADMIN) return true;

    const isPreparedBy = p.preparedByUserId === currentUser.id;
    const isAssignedTo = p.assignedUserId === currentUser.id;
    const isShared = p.sharedUserIds && p.sharedUserIds.includes(currentUser.id);

    return isPreparedBy || isAssignedTo || isShared;
  });

  // Report statistics and aggregate metrics
  const getPerformanceMetrics = () => {
    const total = visibleProposals.length;
    if (total === 0) return { conversionPercent: 0, pipelineSum: 0, avgVal: 0, countByStatus: {} };

    const completed = visibleProposals.filter(p => p.status === ProposalStatus.COMPLETED).length;
    const pipelineSum = visibleProposals.reduce((acc, curr) => acc + curr.totalCost, 0);
    const avgVal = pipelineSum / total;

    const countByStatus = visibleProposals.reduce((acc, curr) => {
      const stat = curr.status || ProposalStatus.DRAFT;
      acc[stat] = (acc[stat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      conversionPercent: Math.round((completed / total) * 100),
      pipelineSum,
      avgVal,
      countByStatus
    };
  };

  const metrics = getPerformanceMetrics();

  // Filters admin proposal listings based on active search inputs
  const getFilteredAdminProps = () => {
    return visibleProposals.filter(p => {
      const matchSearch = 
        p.clientName.toLowerCase().includes(adminSearch.toLowerCase()) ||
        p.companyName.toLowerCase().includes(adminSearch.toLowerCase()) ||
        p.id.toLowerCase().includes(adminSearch.toLowerCase());
      
      const matchStatus = statusFilter === 'ALL' || (p.status || ProposalStatus.DRAFT) === statusFilter;
      const matchAssignee = assigneeFilter === 'ALL' || p.assignedUserId === assigneeFilter;

      return matchSearch && matchStatus && matchAssignee;
    });
  };

  const filteredAdminProps = getFilteredAdminProps();

  // Filter reminders based on role access
  const visibleReminders = reminders.filter(r => {
    if (!currentUser || currentUser.role === UserRole.ADMIN) return true;
    return proposals.some(p => p.id === r.proposalId);
  });

  // Alarm notices on upcoming or overdue deadlines
  const getNotificationAlarms = () => {
    const notices: { id: string; type: 'overdue' | 'warning' | 'info'; message: string; sub: string }[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    // Check active reminders
    visibleReminders.forEach(r => {
      if (!r.isCompleted) {
        if (r.dueDate < todayStr) {
          notices.push({
            id: r.id + '_notice',
            type: 'overdue',
            message: `OVERDUE ACTION: Follow up on "${r.title}" for ${r.proposalClient}`,
            sub: `Was scheduled on ${r.dueDate}`
          });
        } else if (r.dueDate === todayStr) {
          notices.push({
            id: r.id + '_notice',
            type: 'warning',
            message: `DEADLINE TODAY: "${r.title}" for client ${r.proposalClient}`,
            sub: `Action required before end of day`
          });
        }
      }
    });

    // Check stagnant proposals (Under Review & Awaiting feedback aging > 7 days)
    proposals.forEach(p => {
      const state = p.status || ProposalStatus.DRAFT;
      if (state === ProposalStatus.AWAITING_CLIENT_FEEDBACK || state === ProposalStatus.UNDER_REVIEW) {
        const updateSecs = new Date(p.updatedAt || p.createdAt).getTime();
        const diffDays = Math.floor((Date.now() - updateSecs) / (1000 * 60 * 60 * 24));
        if (diffDays >= 7) {
          notices.push({
            id: p.id + '_stagnant_notice',
            type: 'info',
            message: `STAGNANT PIPELINE: ${p.clientName} has been in "${state}" for ${diffDays} days`,
            sub: `Consider scheduling a follow-up session`
          });
        }
      }
    });

    return notices;
  };

  const noticeAlarms = getNotificationAlarms();

  // Payments helper functions
  const getDeliveryStage = (status: ProposalStatus | undefined) => {
    switch (status) {
      case ProposalStatus.DRAFT: return "Preparation";
      case ProposalStatus.UNDER_REVIEW: return "Design Stage";
      case ProposalStatus.UNDER_PROCESS: return "Development";
      case ProposalStatus.AWAITING_CLIENT_FEEDBACK: return "Testing & Feedback";
      case ProposalStatus.COMPLETED: return "Delivered & Live";
      case ProposalStatus.CLOSED: return "Archived";
      case ProposalStatus.CANCELLED: return "Cancelled";
      default: return "Design Stage";
    }
  };

  const getProposalPaymentsAndBalances = (p: Proposal) => {
    const list = p.paymentEntries || [];
    const totalPaid = list.reduce((sum, pay) => sum + Number(pay.amount), 0);
    const totalCost = p.totalCost || 0;
    const pendingBalance = Math.max(0, totalCost - totalPaid);
    const paidPercent = totalCost > 0 ? Math.min(100, Math.round((totalPaid / totalCost) * 100)) : 0;
    
    // Payment stages
    const hasAdvance = list.some(pay => pay.type === 'Advance');
    const hasSecond = list.some(pay => pay.type === 'Second');
    const hasFinal = list.some(pay => pay.type === 'Final');
    
    return {
      totalPaid,
      pendingBalance,
      paidPercent,
      hasAdvance,
      hasSecond,
      hasFinal
    };
  };

  // Color mappings for proposal status badges
  const getStatusBadgeStyles = (status: ProposalStatus) => {
    switch (status) {
      case ProposalStatus.DRAFT:
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case ProposalStatus.UNDER_REVIEW:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case ProposalStatus.UNDER_PROCESS:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case ProposalStatus.AWAITING_CLIENT_FEEDBACK:
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case ProposalStatus.COMPLETED:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case ProposalStatus.CANCELLED:
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case ProposalStatus.CLOSED:
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div id="admin-collaboration-space" className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden font-sans">
      
      {/* Top Controller Ribbon */}
      <div className="bg-slate-900 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/10 text-blue-400 p-2 rounded-xl border border-blue-500/20">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-white text-sm font-semibold tracking-tight uppercase font-serif">
              Astra Team Hub & Admin Portal
            </h3>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">
              Secure administrative controller & collaborative logging systems
            </p>
          </div>
        </div>

        <div className="flex self-start md:self-auto items-center gap-2.5">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-[11px] text-white font-semibold font-sans">{currentUser.name}</span>
                <span className="text-[9px] font-mono font-bold tracking-wider text-blue-400 uppercase bg-blue-900/40 px-1.5 py-0.5 rounded border border-blue-800/30 mt-0.5">
                  {currentUser.role}
                </span>
              </div>
              
              <div className="flex gap-1.5">
                {currentUser?.role === UserRole.ADMIN && (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-2.5 py-1.5 border border-slate-700 rounded-lg hover:border-slate-500 hover:bg-slate-800 text-[10px] text-slate-300 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Switched
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="p-1.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-lg transition-colors cursor-pointer"
                  title="Sign out of portal"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowLoginModal(true);
                setLoginErr('');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="h-3.5 w-3.5" /> Direct Team Authentication
            </button>
          )}
        </div>
      </div>

      {/* Internal Tabs controller */}
      <div className="bg-slate-50/80 border-b border-slate-200/80 px-6 py-2 flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg text-xs leading-none font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'overview' 
              ? 'bg-white border border-slate-200 text-slate-900 shadow-xs' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" /> Operational Overview
        </button>

        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-3 py-1.5 rounded-lg text-xs leading-none font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'proposals' 
              ? 'bg-white border border-slate-200 text-slate-900 shadow-xs' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="h-3.5 w-3.5" /> Pipeline Controller
        </button>

        {currentUser?.role === UserRole.ADMIN && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs leading-none font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users' 
                ? 'bg-white border border-slate-200 text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="h-3.5 w-3.5" /> Identity & Users
          </button>
        )}

        <button
          onClick={() => setActiveTab('reminders')}
          className={`px-3 py-1.5 rounded-lg text-xs leading-none font-semibold transition-all cursor-pointer flex items-center gap-1.5 relative ${
            activeTab === 'reminders' 
              ? 'bg-white border border-slate-200 text-slate-900 shadow-xs' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="h-3.5 w-3.5" /> Follow-ups
          {visibleReminders.filter(r => !r.isCompleted).length > 0 && (
            <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[8px] h-4 w-4 rounded-full flex items-center justify-center font-bold">
              {visibleReminders.filter(r => !r.isCompleted).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3 py-1.5 rounded-lg text-xs leading-none font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'payments' 
              ? 'bg-white border border-slate-200 text-slate-900 shadow-xs' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Coins className="h-3.5 w-3.5 font-bold" /> Payment Tracker
        </button>
      </div>

      {/* Primary Display Center */}
      <div className="p-6">
        
        {/* TAB 1: OVERVIEW & ANALYTICS REPORTS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Alarms alerts section */}
            {noticeAlarms.length > 0 && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <strong className="text-xs font-bold text-rose-900">Immediate Administrative Action Required ({noticeAlarms.length})</strong>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {noticeAlarms.map((n, idx) => (
                    <div key={idx} className="bg-white border border-rose-100 rounded-lg p-2.5 flex items-start justify-between">
                      <div>
                        <span className={`text-[8px] font-bold font-mono tracking-wider uppercase px-1.5 py-0.5 rounded leading-none mr-1.5 ${
                          n.type === 'overdue' ? 'bg-rose-100 text-rose-700' : n.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {n.type}
                        </span>
                        <strong className="text-[10px] font-sans text-slate-800 leading-tight block mt-1">{n.message}</strong>
                        <span className="text-[9px] text-slate-400 font-mono italic block mt-0.5">{n.sub}</span>
                      </div>
                      <button 
                        onClick={() => {
                          if (n.id.includes('_notice')) {
                            const remId = n.id.replace('_notice', '');
                            handleToggleReminderDone(remId);
                          } else {
                            // Stagnant notice dismiss
                            alert('This system notice is computed dynamically based on the proposal modified date. Plan a calendar update.');
                          }
                        }}
                        className="p-1 hover:bg-slate-50 border border-slate-200 rounded text-slate-500 hover:text-slate-800 transition-shadow text-[8px] cursor-pointer"
                        title="Acknowledge or Mark Complete"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reports graphics, charts on proposal metrics */}
            <div className={`grid grid-cols-1 ${
              (currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER) 
                ? 'lg:grid-cols-3' 
                : 'lg:grid-cols-2'
            } gap-6`}>
              
              {/* Analytics report block */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold tracking-tight text-slate-700 uppercase font-mono mb-2 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-600" /> Executive Analytics Summary
                  </h4>
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-slate-500 text-xs font-sans">Corporate Conversion Rate</span>
                      <strong className="text-sm font-bold text-slate-800">{metrics.conversionPercent}% Completed</strong>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-slate-500 text-xs font-sans">Total Managed Pipeline</span>
                      <strong className="text-sm font-bold text-slate-800">{formatQAR(metrics.pipelineSum)} QAR</strong>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-slate-500 text-xs font-sans">Average Proposal Value</span>
                      <strong className="text-sm font-bold text-slate-800">{formatQAR(metrics.avgVal)} QAR</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-5 bg-white border border-slate-200 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span>Conversion Milestone Goal</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase font-mono">Status: 75% Target</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                    <div className="bg-amber-500 h-full transition-all" style={{ width: `${Math.min(100, metrics.conversionPercent)}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Status Volume distributions - Custom Render Layout */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h4 className="text-xs font-bold tracking-tight text-slate-700 uppercase font-mono mb-2">
                  Proposal Distribution by Pipeline Status
                </h4>
                
                <div className="mt-4 space-y-2.5">
                  {Object.values(ProposalStatus).map(status => {
                    const count = metrics.countByStatus[status] || 0;
                    const percent = proposals.length > 0 ? Math.round((count / proposals.length) * 100) : 0;
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-semibold text-slate-700">{status}</span>
                          <span className="text-slate-400 font-mono font-bold">{count} ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              status === ProposalStatus.COMPLETED ? 'bg-emerald-500' :
                              status === ProposalStatus.CANCELLED ? 'bg-rose-500' :
                              status === ProposalStatus.CLOSED ? 'bg-red-500' :
                              status === ProposalStatus.UNDER_PROCESS ? 'bg-blue-500' :
                              status === ProposalStatus.UNDER_REVIEW ? 'bg-amber-500' :
                              status === ProposalStatus.AWAITING_CLIENT_FEEDBACK ? 'bg-pink-500' :
                              'bg-slate-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Collaborative assignments report */}
              {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER) && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold tracking-tight text-slate-700 uppercase font-mono mb-2">
                      Operational Team Allocations
                    </h4>
                    <div className="mt-3 divide-y divide-slate-200/80">
                      {users.map(u => {
                        const count = proposals.filter(p => p.assignedUserId === u.id || p.preparedByUserId === u.id).length;
                        return (
                          <div key={u.id} className="flex justify-between items-center py-2">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-slate-200 font-bold text-[9px] flex items-center justify-center text-slate-600">
                                {u.name.split(' ').map(n=>n[0]).join('')}
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-800">{u.name}</p>
                                <p className="text-[8px] font-mono text-slate-400 leading-none">{u.role}</p>
                              </div>
                            </div>
                            <span className="bg-white border border-slate-200 rounded px-2 py-0.5 font-mono text-[9px] text-slate-600 font-bold">
                              {count} {count === 1 ? 'project' : 'projects'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 text-center">
                    <span className="text-[9px] font-mono text-slate-400 italic block">
                      All updates feed to our collaborative logging registry in real-time.
                    </span>
                  </div>
                </div>
              )}

            </div>

            {/* Quick guide alerts */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5 text-blue-600" />
              <div>
                <strong className="text-xs font-bold block">Collaboration Protocol & Accountability</strong>
                <p className="text-[10px] text-blue-700 leading-normal mt-0.5 font-sans">
                  The dashboard operates on shared storage memory mimicking a true organizational ledger. Any changes to status, assignee parameters, scheduling follow-ups, or deletes are cataloged with the operator's active identity for clear accountability logs. Customize permissions quickly under your role handles.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: PROPOSAL PIPELINE CONTROLLER */}
        {activeTab === 'proposals' && (
          <div className="space-y-4">
            
            {/* Search & filters ribbon */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-3 px-4 border border-slate-200 bg-slate-50/50 rounded-xl">
              <div className="relative flex-grow max-w-md">
                <input
                  type="text"
                  placeholder="Key search filter: client, agency or code..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-xs leading-5 font-sans focus:outline-hidden bg-white"
                />
                {adminSearch && (
                  <button onClick={() => setAdminSearch('')} className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600">×</button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 font-mono uppercase shrink-0">Status:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg py-1 px-2.5 text-xs font-sans text-slate-700 focus:outline-hidden"
                  >
                    <option value="ALL">All Statuses</option>
                    {Object.values(ProposalStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 font-mono uppercase shrink-0">Assignee:</label>
                  <select
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg py-1 px-2.5 text-xs font-sans text-slate-700 focus:outline-hidden"
                  >
                    <option value="ALL">All Team</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* List Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-mono text-[9px] uppercase font-bold tracking-wider">
                      <th className="py-3.5 px-4 font-bold">Proposal Code</th>
                      <th className="py-3.5 px-4 font-bold">Client / Company Target</th>
                      <th className="py-3.5 px-4 font-bold">Value</th>
                      <th className="py-3.5 px-4 font-bold">Active Status</th>
                      <th className="py-3.5 px-4 font-bold">Account Lead</th>
                      <th className="py-3.5 px-4 text-right pr-6 font-bold">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredAdminProps.length > 0 ? (
                      filteredAdminProps.map((p) => {
                        const isEditing = editingPropId === p.id;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-4">
                              <span className="font-mono text-xs font-bold text-slate-400">{p.id}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <span className="font-sans font-bold text-xs text-slate-800">{p.clientName}</span>
                                <span className="text-[11px] text-slate-500 block leading-tight">{p.companyName}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 font-sans font-semibold text-xs text-blue-700">
                              {formatQAR(p.totalCost)} QAR
                            </td>
                            <td className="py-4 px-4">
                              {isEditing ? (
                                <select
                                  value={selectedStatus}
                                  onChange={(e) => setSelectedStatus(e.target.value as ProposalStatus)}
                                  className="bg-white border border-slate-300 rounded-lg p-1 text-xs font-sans text-slate-700"
                                >
                                  {Object.values(ProposalStatus).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeStyles(p.status || ProposalStatus.DRAFT)}`}>
                                  {p.status || ProposalStatus.DRAFT}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {isEditing ? (
                                <div className="space-y-1 mt-1.5">
                                  <select
                                    value={selectedAssigneeId}
                                    onChange={(e) => setSelectedAssigneeId(e.target.value)}
                                    className="bg-white border border-slate-300 rounded-lg p-1 text-xs font-sans text-slate-700 w-full"
                                  >
                                    <option value="">Unassigned</option>
                                    {users.map(u => (
                                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))}
                                  </select>
                                  
                                  {currentUser?.role === UserRole.ADMIN && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 w-full max-w-[220px] text-left">
                                      <span className="text-[9px] font-bold text-slate-400 font-mono uppercase block mb-1">
                                        Explicit Share Access:
                                      </span>
                                      <div className="max-h-24 overflow-y-auto space-y-1">
                                        {users.filter(u => u.id !== currentUser?.id).map(u => {
                                          const isChecked = selectedSharedUserIds.includes(u.id);
                                          return (
                                            <label key={u.id} className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-600 hover:text-slate-900 leading-none">
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => {
                                                  if (isChecked) {
                                                    setSelectedSharedUserIds(prev => prev.filter(uid => uid !== u.id));
                                                  } else {
                                                    setSelectedSharedUserIds(prev => [...prev, u.id]);
                                                  }
                                                }}
                                                className="h-3 w-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                              />
                                              <span className="truncate">{u.name}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-600 font-sans">
                                  {p.assignedUserName || <span className="text-slate-300 italic">None selected</span>}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right pr-6">
                              {isEditing ? (
                                <div className="flex gap-1.5 justify-end">
                                  <button
                                    onClick={() => handleSaveStatusUpdate(p.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold transition-colors cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => setEditingPropId(null)}
                                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                                  >
                                    Revert
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-2 justify-end items-center">
                                  <button
                                    onClick={() => handleOpenStatusEdit(p)}
                                    className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-[10px] text-slate-600 hover:text-slate-900 shadow-3xs cursor-pointer flex items-center gap-1.5"
                                  >
                                    Manage
                                  </button>
                                  {currentUser?.role === UserRole.ADMIN && (
                                    <button
                                      onClick={() => handleAdminDeleteProposal(p.id, p.clientName)}
                                      className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded transition-colors"
                                      title="Administrative deletion overrides"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                          No pipeline proposals found matching active search indices.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: USER COLLABORATION & INTEGRITY */}
        {activeTab === 'users' && currentUser?.role === UserRole.ADMIN && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Register account panel */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 block">
                <h4 className="text-xs font-bold tracking-tight text-slate-700 uppercase font-mono mb-4 flex items-center gap-1.5">
                  Register User Accounts
                </h4>
                
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ninan P Joseph"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-normal font-sans focus:outline-hidden bg-white"
                      id="input_admin_username"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. ninan@astra.tech"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-normal font-sans focus:outline-hidden bg-white"
                      id="input_admin_useremail"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Role Designation</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-xs leading-normal font-sans focus:outline-hidden"
                    >
                      {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Access Password</label>
                    <input
                      type="text"
                      placeholder="e.g. securePass123 (Optional)"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-normal font-sans focus:outline-hidden bg-white"
                      id="input_admin_userpassword"
                    />
                    <span className="text-[9.5px] text-slate-400">If left blank, role-default (e.g., "sales123") is active.</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Add Team Member
                  </button>
                </form>
              </div>

              {/* Right Column: Users List database */}
              <div className="lg:col-span-2 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-mono text-[9px] uppercase font-bold tracking-wider">
                      <th className="py-3 px-4 font-bold">Team Member</th>
                      <th className="py-3 px-4 font-bold">Email handle</th>
                      <th className="py-3 px-4 font-bold">Role & Password</th>
                      <th className="py-3 px-4 font-bold">Allocated Projects</th>
                      <th className="py-3 px-4 font-bold">Admin Status</th>
                      <th className="py-3 px-4 text-right pr-6 font-bold">Manage Tools</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {users.map(u => {
                      const isEditing = editingUserId === u.id;
                      if (isEditing) {
                        return (
                          <tr key={u.id} className="bg-blue-50/25">
                            <td className="py-3 px-3">
                              <input
                                type="text"
                                value={editingUserName}
                                onChange={(e) => setEditingUserName(e.target.value)}
                                required
                                className="w-full px-2 py-1.5 border border-slate-300 rounded font-sans font-bold text-xs bg-white focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-3 px-3">
                              <input
                                type="email"
                                value={editingUserEmail}
                                onChange={(e) => setEditingUserEmail(e.target.value)}
                                required
                                className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono text-[11px] bg-white focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-3 px-3 space-y-2">
                              <select
                                value={editingUserRole}
                                onChange={(e) => setEditingUserRole(e.target.value as UserRole)}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded font-sans text-xs bg-white focus:ring-1 focus:ring-blue-500"
                              >
                                {Object.values(UserRole).map(role => (
                                  <option key={role} value={role}>{role}</option>
                                ))}
                              </select>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[8px] font-mono uppercase text-slate-400">Set Password</span>
                                <input
                                  type="text"
                                  value={editingUserPassword}
                                  onChange={(e) => setEditingUserPassword(e.target.value)}
                                  placeholder="Password"
                                  className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-xs bg-white focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </td>
                            <td colSpan={2} className="py-3 px-3 text-xs text-slate-400 italic">
                              Editing Profile...
                            </td>
                            <td className="py-3 px-3 text-right pr-6">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={handleEditUserSave}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] rounded transition-colors cursor-pointer"
                                  title="Save Edits"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingUserId(null)}
                                  className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 font-semibold text-[10px] rounded transition-colors cursor-pointer"
                                  title="Cancel Editing"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      // Standard row:
                      const resolvedPass = u.password || (
                        u.id === 'user_ninan' ? 'admin' :
                        u.id === 'user_sarah' ? 'manager' :
                        u.id === 'user_carlos' ? 'sales' :
                        u.id === 'user_lina' ? 'designer' :
                        u.role === UserRole.ADMIN ? 'admin123' :
                        u.role === UserRole.MANAGER ? 'manager123' :
                        u.role === UserRole.SALES ? 'sales123' :
                        u.role === UserRole.DESIGNER ? 'designer123' :
                        'prowess2026'
                      );

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/20">
                          <td className="py-4 px-4 font-sans font-bold text-xs text-slate-800">
                            {u.name} {currentUser?.id === u.id && <span className="ml-1.5 text-[8px] tracking-wider text-blue-500 bg-blue-50 font-mono font-bold leading-normal px-1 py-0.5 border border-blue-200/50 rounded uppercase">Active session</span>}
                          </td>
                          <td className="py-4 px-4 font-mono text-slate-500 text-[11px]">
                            {u.email}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1 align-top items-start">
                              <span className="text-[10px] font-sans font-bold bg-slate-100 text-slate-700 px-2 py-0.5 border border-slate-200 rounded">
                                {u.role}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1 py-0.5 border border-slate-100 rounded">
                                Key: <span className="text-blue-600 font-bold">{resolvedPass}</span>
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-mono text-xs">
                            {(() => {
                              const count = proposals.filter(p => p.assignedUserId === u.id || p.preparedByUserId === u.id).length;
                              return (
                                <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-1 border border-slate-200 rounded font-mono text-[9px] tracking-wide uppercase">
                                  {count} {count === 1 ? 'project' : 'projects'}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => handleToggleUserActive(u.id)}
                              className={`px-2 py-1 rounded text-[9px] tracking-wider font-bold transition-all cursor-pointer font-sans leading-none border uppercase ${
                                u.isActive 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200' 
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                              }`}
                              title="Deactivate / Reactivate account"
                            >
                              {u.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="py-4 px-4 text-right pr-6">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleStartEditUser(u)}
                                className="px-2.5 py-1 text-[10px] font-semibold font-sans border border-slate-200 rounded-md text-slate-500 hover:text-blue-600 hover:border-blue-200 cursor-pointer"
                                title="Edit profile and update password"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-200 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title="Delete user record"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: FOLLOW-UPS & ALERTS */}
        {activeTab === 'reminders' && (
          <div className="space-y-6">
            
            {/* NEW MODULE: AUTOMATED DAILY EMAIL REMINDER CENTRAL */}
            <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-6 space-y-6 overflow-hidden relative shadow-md">
              <div className="absolute top-0 right-0 p-8 opacity-5 select-none pointer-events-none">
                <Mail className="h-56 w-56 text-blue-500" />
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-805 pb-5">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-500/10 text-amber-400 p-2.5 rounded-xl border border-amber-500/20 mt-1">
                    <Mail className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-bold tracking-tight uppercase font-serif flex items-center gap-2">
                      Automated Daily Follow-Up Email System
                      <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 border border-emerald-500/20 rounded-full flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        Status: Armed & Active
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-sans mt-1 leading-normal max-w-2xl">
                      Ensures no prospect or active commercial interest is overlooked. The system scans the active ledger every 24 hours at 08:30 AM AST and dispatches targeted follow-up reminders to the respective deal creators for <strong className="text-slate-300">all open opportunities</strong>. Emails are continuously dispatched daily until the pipeline status is updated to <strong className="text-slate-300">Won, Lost, or Closed</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    onClick={handleRunDailyEmailReminders}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" /> Trigger Simulated Daily Run Now
                  </button>
                  <button
                    onClick={handleClearDailyEmailLogs}
                    disabled={dailyEmailLogs.length === 0}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-750 disabled:opacity-45 disabled:pointer-events-none text-slate-300 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear Logs
                  </button>
                </div>
              </div>

              {/* Stats Counters Block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-mono uppercase font-bold block">Open Opportunities Tracked</span>
                  <span className="text-xl font-bold text-amber-400 mt-1 block">
                    {proposals.filter(p => {
                      const s = p.status || ProposalStatus.DRAFT;
                      return s !== ProposalStatus.WON && s !== ProposalStatus.LOST && s !== ProposalStatus.CLOSED;
                    }).length} Active Deals
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-1 leading-none">Receiving alerts daily</span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-mono uppercase font-bold block">Closed / Terminated Deals</span>
                  <span className="text-xl font-bold text-slate-300 mt-1 block">
                    {proposals.filter(p => {
                      const s = p.status || ProposalStatus.DRAFT;
                      return s === ProposalStatus.WON || s === ProposalStatus.LOST || s === ProposalStatus.CLOSED;
                    }).length} Opportunities
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-1 leading-none">Status: Won, Lost, or Closed</span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-mono uppercase font-bold block">Daily Reminders Sent Today</span>
                  <span className="text-xl font-bold text-blue-400 mt-1 block">
                    {dailyRunHistory.length > 0 && dailyRunHistory[0].date === new Date().toISOString().split('T')[0] 
                      ? dailyRunHistory[0].countSent 
                      : 0} Emails
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-1 leading-none font-sans">
                    {dailyRunHistory.length > 0 && dailyRunHistory[0].date === new Date().toISOString().split('T')[0] 
                      ? `Last run at ${new Date(dailyRunHistory[0].timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` 
                      : 'Not run yet today'}
                  </span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-mono uppercase font-bold block">Cumulative Emails Dispatched</span>
                  <span className="text-xl font-bold text-emerald-400 mt-1 block">
                    {dailyEmailLogs.length} Delivery Actions
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-1 leading-none font-sans">Logged in active system ledger</span>
                </div>
              </div>

              {/* List Grid: Open Deals (Alert targets) vs Simulated Outbox Logs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                
                {/* Panel row 1: Target checklist */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                    <strong className="text-[10px] font-mono font-bold text-amber-400 tracking-wider uppercase block">
                      CURRENT OPEN OPPORTUNITIES (EMAIL TARGET LIST)
                    </strong>
                    <span className="text-[9px] text-slate-400 font-mono">Status check</span>
                  </div>
                  
                  <div className="bg-slate-950/20 border border-slate-800 rounded-xl overflow-hidden max-h-[280px] overflow-y-auto divide-y divide-slate-800/60">
                    {proposals.filter(p => {
                      const s = p.status || ProposalStatus.DRAFT;
                      return s !== ProposalStatus.WON && s !== ProposalStatus.LOST && s !== ProposalStatus.CLOSED;
                    }).length > 0 ? (
                      proposals.filter(p => {
                        const s = p.status || ProposalStatus.DRAFT;
                        return s !== ProposalStatus.WON && s !== ProposalStatus.LOST && s !== ProposalStatus.CLOSED;
                      }).map(p => {
                        // Find creator
                        let creatorName = p.preparedByName || "Ninan P Joseph";
                        let creatorEmail = "ninanpjoseph@gmail.com";
                        if (p.preparedByUserId) {
                          const u = users.find(user => user.id === p.preparedByUserId);
                          if (u) { creatorName = u.name; creatorEmail = u.email; }
                        } else if (p.assignedUserId) {
                          const u = users.find(user => user.id === p.assignedUserId);
                          if (u) { creatorName = u.name; creatorEmail = u.email; }
                        }
                        
                        const remindedCount = dailyEmailLogs.filter(log => log.proposalId === p.id).length;

                        return (
                          <div key={p.id} className="p-3 hover:bg-slate-800/25 transition-colors flex justify-between items-center gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[9px] text-slate-500 font-bold">{p.id}</span>
                                <strong className="text-white text-xs truncate max-w-[160px] block">{p.companyName || p.clientName}</strong>
                                <span className="bg-amber-400/15 text-amber-300 text-[8px] font-mono uppercase px-1.5 py-0.5 border border-amber-400/10 rounded leading-none">
                                  {p.status || "Draft"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[10px] text-slate-300 font-sans">{creatorName}</span>
                                <span className="text-slate-500 font-sans text-[9px]">({creatorEmail})</span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold font-mono text-blue-400 block">{formatQAR(p.totalCost)}</span>
                              <div className="text-[9px] text-slate-400 font-mono mt-0.5 flex items-center justify-end gap-1">
                                <Mail className="h-2.5 w-2.5 text-slate-500" /> Dispatched: <span className="text-slate-200 font-semibold">{remindedCount}x</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-500 italic font-mono">
                        No active open opportunities resident in system database. All opportunities won, lost, or closed.
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel row 2: Real-time simulation log */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                    <strong className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider uppercase block">
                      OUTBOX SIMULATOR & DISPATCHED EMAIL LOGS ({dailyEmailLogs.length})
                    </strong>
                    <span className="text-[9px] text-slate-400 font-mono">Click to preview</span>
                  </div>

                  <div className="bg-slate-950/20 border border-slate-800 rounded-xl overflow-hidden max-h-[280px] overflow-y-auto divide-y divide-slate-800/60">
                    {dailyEmailLogs.length > 0 ? (
                      dailyEmailLogs.map(log => {
                        const isSelected = selectedEmail?.id === log.id;
                        return (
                          <button
                            key={log.id}
                            onClick={() => setSelectedEmail(isSelected ? null : log)}
                            className={`w-full p-3 hover:bg-slate-800/30 transition-colors text-left flex justify-between items-center gap-4 border-0 block cursor-pointer ${
                              isSelected ? 'bg-slate-800/50 border-l-2 border-emerald-400' : ''
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-500/20 leading-none">
                                  DAILY REMINDER SENT
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono leading-none">
                                  {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                                </span>
                              </div>
                              <strong className="text-white text-xs mt-1 block truncate max-w-[240px] font-sans">{log.projectName}</strong>
                              <span className="text-[10px] text-slate-400 font-sans block mt-0.5 truncate">
                                To: {log.creatorName} &lt;{log.creatorEmail}&gt;
                              </span>
                            </div>

                            <span className="text-[9px] font-mono text-slate-500 shrink-0 self-start mt-1">
                              {new Date(log.timestamp).toLocaleDateString()}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-500 italic font-sans">
                        No automated daily alert runs captured yet. Click "Trigger Simulated Daily Run" above to execute a run.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Floating detail message card of selected email */}
              {selectedEmail && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3.5 relative anim-fade-in text-left">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-white text-xs font-bold leading-normal font-sans">
                        Simulated Electronic Mail Delivery Header Log
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Delivered successfully through Astra SMTP Mail Servers
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedEmail(null)}
                      className="text-slate-400 hover:text-white text-[10px] bg-slate-800 hover:bg-slate-750 px-2.5 py-1 rounded-lg border border-slate-800 transition-colors cursor-pointer font-sans font-semibold"
                    >
                      Close Preview
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono border-b border-slate-800 pb-3 text-slate-400">
                    <div>
                      <strong className="text-slate-500 font-bold uppercase">SMTP From:</strong> <span className="text-slate-350">{smtpFromName} &lt;{smtpFromEmail}&gt;</span>
                    </div>
                    <div>
                      <strong className="text-slate-500 font-bold uppercase">To Destination:</strong> <span className="text-emerald-400 font-bold">{selectedEmail.creatorEmail}</span>
                    </div>
                    <div>
                      <strong className="text-slate-500 font-bold uppercase">Recipient Owner:</strong> <span className="text-slate-300">{selectedEmail.creatorName}</span>
                    </div>
                    <div>
                      <strong className="text-slate-500 font-bold uppercase">Timestamp Sent:</strong> <span className="text-slate-300">{new Date(selectedEmail.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="md:col-span-2 mt-1">
                      <strong className="text-slate-500 font-bold uppercase">E-Mail Subject:</strong> <span className="text-white font-bold">{selectedEmail.subject}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg max-h-48 overflow-y-auto">
                    <pre className="text-[10.5px] font-mono leading-relaxed text-slate-300 whitespace-pre-wrap text-left">
                      {selectedEmail.body}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Create follow up reminder */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 block">
                <h4 className="text-xs font-bold tracking-tight text-slate-700 uppercase font-mono mb-4">
                  Schedule Follow-Up Reminder
                </h4>

                <form onSubmit={handleAddReminder} className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Target Proposal</label>
                    <select
                      value={reminderProposalId}
                      onChange={(e) => setReminderProposalId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-xs leading-normal font-sans focus:outline-hidden"
                    >
                      <option value="">Select proposal...</option>
                      {proposals.map(p => (
                        <option key={p.id} value={p.id}>{p.clientName} (Code: {p.id})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Reminder Topic</label>
                    <input
                      type="text"
                      placeholder="e.g. Negotiation follow-up call"
                      value={newReminderTitle}
                      onChange={(e) => setNewReminderTitle(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-normal font-sans focus:outline-hidden bg-white"
                      id="input_rem_title"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Trigger Date</label>
                    <input
                      type="date"
                      value={newReminderDate}
                      onChange={(e) => setNewReminderDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-normal font-sans focus:outline-hidden bg-white"
                      id="input_rem_date"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Additional Notes</label>
                    <textarea
                      placeholder="Discussion pointers or criteria..."
                      value={newReminderNotes}
                      rows={2}
                      onChange={(e) => setNewReminderNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-normal font-sans focus:outline-hidden bg-white resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Add Follow-up Trigger
                  </button>
                </form>
              </div>

              {/* Right Column: Reminders registry list */}
              <div className="lg:col-span-2 space-y-4">
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                    <strong className="text-[10px] font-mono font-bold text-slate-400 uppercase">ACTIVE ALERTS DIRECTORY</strong>
                  </div>
                  
                  <div className="divide-y divide-slate-200">
                    {visibleReminders.length > 0 ? (
                      visibleReminders.map(r => (
                        <div key={r.id} className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                          r.isCompleted ? 'bg-slate-50/50 opacity-60' : 'bg-white'
                        }`}>
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleToggleReminderDone(r.id)}
                              className="mt-1 text-slate-400 hover:text-blue-500 transition-colors"
                            >
                              {r.isCompleted ? (
                                <CheckSquare className="h-4.5 w-4.5 text-blue-600" />
                              ) : (
                                <Square className="h-4.5 w-4.5" />
                              )}
                            </button>

                            <div>
                              <div className="flex items-center gap-2">
                                <strong className={`text-xs font-sans font-bold leading-none ${
                                  r.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'
                                }`}>
                                  {r.title}
                                </strong>
                                <span className="bg-blue-50 text-blue-700 text-[8px] font-mono uppercase font-bold px-1.5 py-0.5 border border-blue-200/50 rounded">
                                  {r.proposalClient}
                                </span>
                              </div>
                              
                              <p className="text-[10px] text-slate-500 font-sans mt-1.5 leading-normal">
                                {r.notes || "No additional directives logged."}
                              </p>

                              <div className="flex items-center gap-3 mt-2 font-mono text-[9px] text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" /> Due: {r.dueDate}
                                </span>
                                <span>•</span>
                                <span>Trigger: Scheduled in system</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteReminder(r.id)}
                            className="p-1 text-slate-350 hover:text-rose-600 rounded transition-colors"
                            title="Delete reminder alarm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400 italic">
                        No follow-up reminders registered yet. Use the scheduler panel on the left.
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 5: PAYMENT TRACKER PAGE */}
        {activeTab === 'payments' && (() => {
          const activeProposalsForStats = proposals.filter(p => p.status !== ProposalStatus.CANCELLED);
          let totalContractValueSum = 0;
          let totalCollectedSum = 0;
          let totalPendingSum = 0;
          let fullyPaidCount = 0;

          activeProposalsForStats.forEach(p => {
            totalContractValueSum += (p.totalCost || 0);
            const paymentsList = p.paymentEntries || [];
            const collectedForProp = paymentsList.reduce((sum, item) => sum + Number(item.amount), 0);
            totalCollectedSum += collectedForProp;
            const pendingForProp = Math.max(0, (p.totalCost || 0) - collectedForProp);
            totalPendingSum += pendingForProp;
            if (pendingForProp === 0 && (p.totalCost || 0) > 0) {
              fullyPaidCount += 1;
            }
          });

          const filteredPayProps = proposals.filter(p => {
            if (p.status === ProposalStatus.CANCELLED) return false;
            
            // Calculate stats inline
            const list = p.paymentEntries || [];
            const totalPaid = list.reduce((sum, pay) => sum + Number(pay.amount), 0);
            const totalCost = p.totalCost || 0;
            const pendingBalance = Math.max(0, totalCost - totalPaid);
            
            if (payFilter === 'pending') {
              return pendingBalance > 0;
            }
            if (payFilter === 'paid') {
              return pendingBalance === 0;
            }
            if (payFilter === 'overdue') {
              const pDate = new Date(p.proposalDate || p.createdAt);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - pDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return pendingBalance > 0 && diffDays > 30;
            }
            return true;
          });

          const sortedPayProps = [...filteredPayProps].sort((a, b) => {
            const listA = a.paymentEntries || [];
            const totalPaidA = listA.reduce((sum, pay) => sum + Number(pay.amount), 0);
            const pendingBalanceA = Math.max(0, (a.totalCost || 0) - totalPaidA);

            const listB = b.paymentEntries || [];
            const totalPaidB = listB.reduce((sum, pay) => sum + Number(pay.amount), 0);
            const pendingBalanceB = Math.max(0, (b.totalCost || 0) - totalPaidB);
            
            if (paySort === 'value') {
              return (b.totalCost || 0) - (a.totalCost || 0);
            }
            if (paySort === 'pendingAmount') {
              return pendingBalanceB - pendingBalanceA;
            }
            // Default 'latest'
            const dateA = new Date(a.proposalDate || a.createdAt).getTime();
            const dateB = new Date(b.proposalDate || b.createdAt).getTime();
            return dateB - dateA;
          });

          return (
            <div className="space-y-6">
              
              {/* Header info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h2 className="text-slate-800 font-serif font-bold text-lg leading-tight">Payment Tracker & Financial Overviews</h2>
                <p className="text-xs text-slate-500 font-sans mt-1">
                  Track active contracts value, pending customer balances, incoming transactions and milestone schedule completions in QAR.
                </p>
              </div>

              {/* 4 Stat Cards Summary Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total Contract Value */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-3xs">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-450 block mb-1 font-bold">Total Contract Value</span>
                  <strong className="text-lg font-bold text-slate-800 font-sans">{formatQAR(totalContractValueSum)} QAR</strong>
                  <span className="text-[9px] text-slate-400 mt-1 block">All {activeProposalsForStats.length} active projects combined</span>
                </div>

                {/* Card 2: Total Collected */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex flex-col justify-between shadow-3xs">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-750 block mb-1 font-bold">Total Collected (Received)</span>
                  <strong className="text-lg font-bold text-emerald-600 font-sans">{formatQAR(totalCollectedSum)} QAR</strong>
                  <span className="text-[9px] text-emerald-600/80 mt-1 block">Sum of all transaction ledger entries</span>
                </div>

                {/* Card 3: Total Pending */}
                <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 flex flex-col justify-between shadow-3xs">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-rose-700 block mb-1 font-bold">Total Pending Balances</span>
                  <strong className="text-lg font-bold text-rose-600 font-sans">{formatQAR(totalPendingSum)} QAR</strong>
                  <span className="text-[9px] text-rose-600/80 mt-1 block font-semibold font-sans">Outstanding customer balance</span>
                </div>

                {/* Card 4: Fully Paid Projects */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col justify-between shadow-3xs">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-blue-750 block mb-1 font-bold">Fully Paid Projects</span>
                  <strong className="text-lg font-bold text-blue-700 font-sans">{fullyPaidCount} Active Projects</strong>
                  <span className="text-[9px] text-blue-600/85 mt-1 block">100% financial settlement rate</span>
                </div>
              </div>

              {/* Filters and sorting strip */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-3 px-4 border border-slate-200 bg-slate-50/50 rounded-xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Filter SOWs:</span>
                  <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                    <button
                      onClick={() => setPayFilter('all')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-all ${
                        payFilter === 'all' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      All Projects
                    </button>
                    <button
                      onClick={() => setPayFilter('pending')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-all ${
                        payFilter === 'pending' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Pending Payment
                    </button>
                    <button
                      onClick={() => setPayFilter('paid')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-all ${
                        payFilter === 'paid' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Fully Paid
                    </button>
                    <button
                      onClick={() => setPayFilter('overdue')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-all ${
                        payFilter === 'overdue' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {"Overdue (>30d)"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Sort List:</span>
                  <select
                    value={paySort}
                    onChange={(e) => setPaySort(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs font-sans text-slate-750 focus:outline-hidden"
                  >
                    <option value="latest">Latest First</option>
                    <option value="value">Highest Contract Value</option>
                    <option value="pendingAmount">Most Pending Amount</option>
                  </select>
                </div>
              </div>

              {/* SOW Project Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedPayProps.map(p => {
                  const { totalPaid, pendingBalance, paidPercent, hasAdvance, hasSecond, hasFinal } = getProposalPaymentsAndBalances(p);
                  const isBranding = p.type === 'branding';
                  const deliveryStage = getDeliveryStage(p.status);
                  
                  return (
                    <div key={p.id} className="bg-white border border-slate-200/80 hover:border-blue-300 rounded-2xl p-5 shadow-3xs hover:shadow-xs transition-all flex flex-col justify-between">
                      <div>
                        {/* Top line with code and stage */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="font-mono text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded">
                            {p.id}
                          </span>
                          <span className="text-[9.5px] font-sans font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {deliveryStage}
                          </span>
                        </div>

                        {/* Client & Company */}
                        <div className="mb-4">
                          <strong className="font-serif text-slate-800 text-sm block leading-tight">{p.clientName}</strong>
                          <span className="text-[11px] text-slate-500 font-sans block mt-0.5">{p.companyName}</span>
                          <span className="text-[10px] text-slate-400 font-mono block mt-1.5 font-semibold">
                            {isBranding ? 'Branding & Identity SOW' : 'Website Development SOW'}
                          </span>
                        </div>

                        {/* Financial Highlights */}
                        <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-dashed border-slate-100 mb-4 bg-slate-50/50 px-2.5 rounded-xl">
                          <div>
                            <span className="text-[8px] text-slate-450 font-mono uppercase tracking-wider block font-bold">Total Contract</span>
                            <strong className="text-xs font-bold text-slate-800 font-sans">{formatQAR(p.totalCost)}</strong>
                          </div>
                          <div>
                            <span className="text-[8px] text-emerald-600 font-mono uppercase tracking-wider block font-bold">Received (Green)</span>
                            <strong className="text-xs font-bold text-emerald-600 font-sans">{formatQAR(totalPaid)}</strong>
                          </div>
                          <div>
                            <span className="text-[8px] text-rose-500 font-mono uppercase tracking-wider block font-extrabold">Pending (Red)</span>
                            <strong className="text-xs font-extrabold text-rose-650 font-sans">{formatQAR(pendingBalance)}</strong>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 mb-4">
                          <div className="flex justify-between items-center text-[10px] font-semibold text-slate-650">
                            <span>Payment Completion Progress</span>
                            <span className="text-slate-800 font-mono font-bold">{paidPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                paidPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                              }`} 
                              style={{ width: `${paidPercent}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Payment Stages Indicators */}
                        <div className="space-y-1.5 mb-5 bg-slate-50/30 p-2.5 rounded-lg border border-slate-150">
                          <span className="text-[8.5px] uppercase font-mono tracking-wider text-slate-400 block font-bold mb-1">Payment Stage Gates:</span>
                          
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 flex items-center gap-1">
                              <Check className={`h-3 w-3 ${hasAdvance ? 'text-emerald-500 font-extrabold' : 'text-slate-300'}`} />
                              <span>Advance payment (typically 50%)</span>
                            </span>
                            <span className={`text-[9px] font-bold uppercase font-mono ${hasAdvance ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {hasAdvance ? '✓ Paid' : 'Pending'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] border-t border-slate-100/60 pt-1">
                            <span className="text-slate-500 flex items-center gap-1">
                              <Check className={`h-3 w-3 ${hasSecond ? 'text-emerald-500 font-extrabold' : 'text-slate-300'}`} />
                              <span>Second payment (typically 25%)</span>
                            </span>
                            <span className={`text-[9px] font-bold uppercase font-mono ${hasSecond ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {hasSecond ? '✓ Paid' : 'Pending'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] border-t border-slate-100/60 pt-1">
                            <span className="text-slate-500 flex items-center gap-1">
                              <Check className={`h-3 w-3 ${hasFinal ? 'text-emerald-500 font-extrabold' : 'text-slate-300'}`} />
                              <span>Final delivery balance (typically 25%)</span>
                            </span>
                            <span className={`text-[9px] font-bold uppercase font-mono ${hasFinal ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {hasFinal ? '✓ Paid' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => {
                          if (onViewProposalDetail) {
                            onViewProposalDetail(p, 'payment');
                          } else {
                            alert(`Please navigate to raw details view manually for proposal ${p.id}.`);
                          }
                        }}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow-sm transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CreditCard className="h-3.5 w-3.5" /> View Details & Breakdown
                      </button>
                    </div>
                  );
                })}
              </div>

              {sortedPayProps.length === 0 && (
                <div className="p-12 border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl text-center">
                  <Coins className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <strong className="text-xs text-slate-650 block">No matching projects found</strong>
                  <span className="text-3xs text-slate-400 block mt-0.5">Try altering the filter query values.</span>
                </div>
              )}

            </div>
          );
        })()}

      </div>

      {/* SECURE AUTH LOGIN POPUP MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-950 p-5 text-white flex justify-between items-center">
              <div>
                <strong className="text-sm font-serif font-bold uppercase tracking-tight block">Secure Identity Switcher</strong>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-0.5 block">Mock organization collaborator access</span>
              </div>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold leading-normal focus:outline-hidden"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4 font-sans">
              
              {/* Simple accounts switch buttons */}
              {(!currentUser || currentUser.role === UserRole.ADMIN) && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase block mb-1">Interactive User Profiles:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          if (currentUser && currentUser.role !== UserRole.ADMIN) {
                            alert('Permission Denied: Only administrators are authorized to switch user sessions.');
                            return;
                          }
                          setLoginEmail(u.email);
                          setLoginPassword('sandbox123');
                          setLoginErr('');
                        }}
                        className="px-3 py-2 border border-slate-200 hover:border-blue-300 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-all text-xs cursor-pointer flex flex-col justify-between"
                      >
                        <strong className="text-slate-800 block text-[11px] leading-tight font-sans truncate">{u.name}</strong>
                        <span className="text-[9px] font-mono text-blue-600 block mt-1 uppercase font-bold">{u.role}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={`border-t border-slate-100 ${(!currentUser || currentUser.role === UserRole.ADMIN) ? 'pt-4' : ''}`}>
                <form onSubmit={handleLogin} className="space-y-4">
                  {loginErr && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{loginErr}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">User Handle Email</label>
                    <input
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      placeholder="e.g. ninanpjoseph@gmail.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-normal bg-white"
                      id="input_modal_email"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-500 font-mono uppercase">Authentication Key</label>
                      <span className="text-[9px] text-slate-400 italic">Pre-filled bypass enabled</span>
                    </div>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-normal bg-slate-100/50 cursor-not-allowed"
                      readOnly
                      placeholder="••••••••••••"
                      id="input_modal_password"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowLoginModal(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      Bypasses
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-md transition-colors cursor-pointer"
                    >
                      Grant Access
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

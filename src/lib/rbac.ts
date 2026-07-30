import { Proposal, User, UserRole, ProposalStatus } from '../types';

export const DEFAULT_USERS: User[] = [
  { id: 'user_ninan', name: 'Ninan P Joseph', email: 'ninanpjoseph@gmail.com', role: UserRole.ADMIN, isActive: true },
  { id: 'user_shamlan', name: 'Shamlan CT', email: 'shamlan@technoastra.com', role: UserRole.MANAGER, isActive: true },
  { id: 'user_carlos', name: 'Carlos Mendoza', email: 'carlos@technoastra.com', role: UserRole.SALES, isActive: true },
  { id: 'user_shareef', name: 'Shareef', email: 'shareef@technoastra.com', role: UserRole.DESIGNER, isActive: true },
];

/**
 * Returns HTTP authentication headers reflecting active session identity
 */
export function getAuthHeaders(currentUser: User | null): Record<string, string> {
  if (!currentUser) return {};
  return {
    'x-user-id': currentUser.id,
    'x-user-name': currentUser.name,
    'x-user-role': currentUser.role,
  };
}

/**
 * Helper to determine the creator's role for a proposal
 */
export function getProposalCreatorRole(proposal: Proposal, allUsers: User[] = []): UserRole {
  if (proposal.preparedByUserId) {
    const matched = allUsers.find(u => u.id === proposal.preparedByUserId);
    if (matched) return matched.role;
  }

  if (proposal.preparedByName) {
    const matched = allUsers.find(u => u.name.toLowerCase() === proposal.preparedByName.toLowerCase());
    if (matched) return matched.role;
  }

  const nameLower = (proposal.preparedByName || '').toLowerCase();
  const titleLower = (proposal.preparedByTitle || '').toLowerCase();

  if (nameLower.includes('ninan') || titleLower.includes('admin') || titleLower.includes('executive director')) {
    return UserRole.ADMIN;
  }
  if (nameLower.includes('shamlan') || titleLower.includes('manager')) {
    return UserRole.MANAGER;
  }
  if (nameLower.includes('shareef') || titleLower.includes('designer')) {
    return UserRole.DESIGNER;
  }

  return UserRole.SALES;
}

/**
 * RBAC Data Visibility Check:
 * - Admin: Sees ALL proposals, invoices, and clients.
 * - Manager: Sees proposals and invoices created by Sales Executive and Designer. Admin data is COMPLETELY HIDDEN.
 * - Sales Executive: Sees ONLY their own created proposals, invoices, and clients.
 * - Designer: Sees ONLY their own created proposals, invoices, and clients.
 */
export function canUserViewProposal(
  proposal: Proposal,
  currentUser: User | null,
  allUsers: User[] = []
): boolean {
  if (!currentUser) return false; // Privacy by default

  // 1. Admin Permissions (Unrestricted Full Access)
  if (currentUser.role === UserRole.ADMIN) {
    return true;
  }

  const creatorRole = getProposalCreatorRole(proposal, allUsers);
  const isOwnProposal = 
    (proposal.preparedByUserId && proposal.preparedByUserId === currentUser.id) ||
    (proposal.assignedUserId && proposal.assignedUserId === currentUser.id) ||
    (proposal.preparedByName && proposal.preparedByName.toLowerCase() === currentUser.name.toLowerCase());

  // 2. Manager Permissions
  if (currentUser.role === UserRole.MANAGER) {
    // Admin proposals MUST be completely hidden from Manager
    if (creatorRole === UserRole.ADMIN) {
      return false;
    }
    // If created by another Manager, hide unless it's the Manager's own proposal
    if (creatorRole === UserRole.MANAGER) {
      return isOwnProposal;
    }
    // View proposals created by Sales Executive and Designer
    return true;
  }

  // 3. Standard User Permissions (Sales Executive & Designer - Own Work Only)
  return isOwnProposal;
}

/**
 * Checks if a user has permissions to edit a proposal
 */
export function canUserEditProposal(proposal: Proposal, currentUser: User | null, allUsers: User[] = []): boolean {
  if (!currentUser) return false;

  if (currentUser.role === UserRole.ADMIN) {
    return true;
  }

  const creatorRole = getProposalCreatorRole(proposal, allUsers);

  if (currentUser.role === UserRole.MANAGER) {
    // Manager cannot edit Admin proposals
    if (creatorRole === UserRole.ADMIN) return false;
    // Manager can edit / review Sales Executive & Designer proposals
    return true;
  }

  if (currentUser.role === UserRole.SALES || currentUser.role === UserRole.DESIGNER) {
    const isOwn = 
      (proposal.preparedByUserId && proposal.preparedByUserId === currentUser.id) ||
      (proposal.assignedUserId && proposal.assignedUserId === currentUser.id) ||
      (proposal.preparedByName && proposal.preparedByName.toLowerCase() === currentUser.name.toLowerCase());

    if (!isOwn) return false;

    // Locked if completed/approved/closed
    const isLocked = [
      ProposalStatus.COMPLETED,
      ProposalStatus.WON,
      ProposalStatus.CLOSED,
      ProposalStatus.CANCELLED
    ].includes(proposal.status);

    return !isLocked;
  }

  return false;
}

/**
 * Checks if a user has permissions to delete a proposal (Admin only)
 */
export function canUserDeleteProposal(currentUser: User | null): boolean {
  return currentUser?.role === UserRole.ADMIN;
}

/**
 * Checks if a user has access to User Management (Admin only)
 */
export function canUserManageUsers(currentUser: User | null): boolean {
  return currentUser?.role === UserRole.ADMIN;
}

/**
 * Checks if a user has access to complete Audit Logs (Admin only)
 */
export function canUserViewAuditLogs(currentUser: User | null): boolean {
  return currentUser?.role === UserRole.ADMIN;
}

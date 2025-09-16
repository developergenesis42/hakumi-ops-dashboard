import { Session } from '@/types';

export interface SessionConflict {
  sessionId: string;
  localSession: Session;
  remoteSession: Session;
  conflictFields: string[];
  timestamp: Date;
}

/**
 * Detect conflicts between local and remote session data
 */
export function detectSessionConflicts(
  localSessions: Session[],
  remoteSessions: Session[]
): SessionConflict[] {
  const conflicts: SessionConflict[] = [];
  
  for (const localSession of localSessions) {
    const remoteSession = remoteSessions.find(rs => rs.id === localSession.id);
    
    if (!remoteSession) continue;
    
    const conflictFields: string[] = [];
    
    // Check for conflicts in key fields
    if (localSession.status !== remoteSession.status) {
      conflictFields.push('status');
    }
    
    if (localSession.sessionStartTime?.getTime() !== remoteSession.sessionStartTime?.getTime()) {
      conflictFields.push('sessionStartTime');
    }
    
    if (localSession.actualEndTime?.getTime() !== remoteSession.actualEndTime?.getTime()) {
      conflictFields.push('actualEndTime');
    }
    
    if (localSession.actualDuration !== remoteSession.actualDuration) {
      conflictFields.push('actualDuration');
    }
    
    if (localSession.isInPrepPhase !== remoteSession.isInPrepPhase) {
      conflictFields.push('isInPrepPhase');
    }
    
    if (localSession.totalPrice !== remoteSession.totalPrice) {
      conflictFields.push('totalPrice');
    }
    
    if (localSession.discount !== remoteSession.discount) {
      conflictFields.push('discount');
    }
    
    if (conflictFields.length > 0) {
      conflicts.push({
        sessionId: localSession.id,
        localSession,
        remoteSession,
        conflictFields,
        timestamp: new Date()
      });
    }
  }
  
  return conflicts;
}

/**
 * Merge sessions with conflict resolution
 */
export function mergeSessionsWithConflictResolution(
  localSessions: Session[],
  remoteSessions: Session[],
  conflictResolution: 'local' | 'remote' | 'newest' = 'newest'
): Session[] {
  const conflicts = detectSessionConflicts(localSessions, remoteSessions);
  
  // Create a map of all sessions (local + remote)
  const allSessions = new Map<string, Session>();
  
  // Add local sessions
  localSessions.forEach(session => {
    allSessions.set(session.id, session);
  });
  
  // Add/update with remote sessions
  remoteSessions.forEach(remoteSession => {
    const localSession = allSessions.get(remoteSession.id);
    
    if (!localSession) {
      // New session from remote
      allSessions.set(remoteSession.id, remoteSession);
    } else {
      // Check for conflicts
      const conflict = conflicts.find(c => c.sessionId === remoteSession.id);
      
      if (conflict) {
        // Resolve conflict based on strategy
        let resolvedSession: Session;
        
        switch (conflictResolution) {
          case 'local':
            resolvedSession = localSession;
            break;
          case 'remote':
            resolvedSession = remoteSession;
            break;
          case 'newest':
          default: {
            // Use the session with the most recent update
            const localUpdateTime = new Date(localSession.startTime).getTime();
            const remoteUpdateTime = new Date(remoteSession.startTime).getTime();
            resolvedSession = remoteUpdateTime > localUpdateTime ? remoteSession : localSession;
            break;
          }
        }
        
        allSessions.set(remoteSession.id, resolvedSession);
      } else {
        // No conflict, use remote session (it's more up-to-date)
        allSessions.set(remoteSession.id, remoteSession);
      }
    }
  });
  
  // Convert map to array and sort
  const result = Array.from(allSessions.values());
  result.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  return result;
}

/**
 * Validate session data integrity
 */
export function validateSessionIntegrity(sessions: Session[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for duplicate IDs
  const sessionIds = new Set<string>();
  const duplicates: string[] = [];
  
  sessions.forEach(session => {
    if (sessionIds.has(session.id)) {
      duplicates.push(session.id);
    } else {
      sessionIds.add(session.id);
    }
  });
  
  if (duplicates.length > 0) {
    errors.push(`Duplicate session IDs found: ${duplicates.join(', ')}`);
  }
  
  // Check for invalid session states
  sessions.forEach(session => {
    if (session.status === 'in_progress' && !session.isInPrepPhase && !session.sessionStartTime) {
      warnings.push(`Session ${session.id} is active but has no session start time`);
    }
    
    if (session.status === 'completed' && !session.actualEndTime) {
      warnings.push(`Session ${session.id} is completed but has no actual end time`);
    }
    
    if (session.sessionStartTime && session.actualEndTime) {
      const duration = session.actualEndTime.getTime() - session.sessionStartTime.getTime();
      if (duration < 0) {
        errors.push(`Session ${session.id} has invalid timing: end time before start time`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Log session sync status for debugging
 */
export function logSessionSyncStatus(
  localCount: number,
  remoteCount: number,
  conflicts: SessionConflict[],
  mergedCount: number
): void {
  console.log('🔄 Session Sync Status:', {
    localSessions: localCount,
    remoteSessions: remoteCount,
    conflicts: conflicts.length,
    mergedSessions: mergedCount,
    hasConflicts: conflicts.length > 0
  });
  
  if (conflicts.length > 0) {
    console.warn('⚠️ Session conflicts detected:', conflicts.map(c => ({
      sessionId: c.sessionId,
      fields: c.conflictFields
    })));
  }
}

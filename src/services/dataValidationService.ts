import type { Session, Therapist, WalkOut, Room, Service } from '@/types';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  value?: unknown;
}

export class DataValidationService {
  private static instance: DataValidationService;

  static getInstance(): DataValidationService {
    if (!DataValidationService.instance) {
      DataValidationService.instance = new DataValidationService();
    }
    return DataValidationService.instance;
  }

  /**
   * Validate session data
   */
  validateSession(session: Session): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!session.id) {
      errors.push({
        field: 'id',
        message: 'Session ID is required',
        severity: 'error'
      });
    }

    if (!session.therapistIds || session.therapistIds.length === 0) {
      errors.push({
        field: 'therapistIds',
        message: 'Therapist IDs are required',
        severity: 'error'
      });
    }

    if (!session.service || !session.service.id) {
      errors.push({
        field: 'service',
        message: 'Service is required',
        severity: 'error'
      });
    }

    if (!session.roomId) {
      errors.push({
        field: 'roomId',
        message: 'Room ID is required',
        severity: 'error'
      });
    }

    // Date validation
    if (!session.startTime) {
      errors.push({
        field: 'startTime',
        message: 'Start time is required',
        severity: 'error'
      });
    } else {
      const startTime = new Date(session.startTime);
      if (isNaN(startTime.getTime())) {
        errors.push({
          field: 'startTime',
          message: 'Invalid start time format',
          value: session.startTime,
          severity: 'error'
        });
      }
    }

    if (session.endTime) {
      const endTime = new Date(session.endTime);
      const startTime = new Date(session.startTime);
      
      if (isNaN(endTime.getTime())) {
        errors.push({
          field: 'endTime',
          message: 'Invalid end time format',
          value: session.endTime,
          severity: 'error'
        });
      } else if (endTime <= startTime) {
        errors.push({
          field: 'endTime',
          message: 'End time must be after start time',
          value: session.endTime,
          severity: 'error'
        });
      }
    }

    // Price validation
    if (session.totalPrice < 0) {
      errors.push({
        field: 'totalPrice',
        message: 'Total price cannot be negative',
        value: session.totalPrice,
        severity: 'error'
      });
    }

    if (session.discount < 0) {
      errors.push({
        field: 'discount',
        message: 'Discount cannot be negative',
        value: session.discount,
        severity: 'error'
      });
    }

    if (session.discount > session.service?.price) {
      errors.push({
        field: 'discount',
        message: 'Discount cannot exceed service price',
        value: session.discount,
        severity: 'error'
      });
    }

    // Status validation
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'];
    if (session.status && !validStatuses.includes(session.status)) {
      errors.push({
        field: 'status',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        value: session.status,
        severity: 'error'
      });
    }

    // Business logic validation
    if (session.service) {
      const expectedTotalPrice = session.service.price - session.discount;
      if (Math.abs(session.totalPrice - expectedTotalPrice) > 0.01) {
        warnings.push({
          field: 'totalPrice',
          message: `Total price (${session.totalPrice}) doesn't match calculated price (${expectedTotalPrice})`,
          value: session.totalPrice
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate therapist data
   */
  validateTherapist(therapist: Therapist): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!therapist.id) {
      errors.push({
        field: 'id',
        message: 'Therapist ID is required',
        severity: 'error'
      });
    }

    if (!therapist.name || therapist.name.trim() === '') {
      errors.push({
        field: 'name',
        message: 'Therapist name is required',
        severity: 'error'
      });
    }

    // Status validation
    const validStatuses = ['available', 'busy', 'off', 'break'];
    if (therapist.status && !validStatuses.includes(therapist.status)) {
      errors.push({
        field: 'status',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        value: therapist.status,
        severity: 'error'
      });
    }

    // Earnings validation
    if (therapist.totalEarnings < 0) {
      errors.push({
        field: 'totalEarnings',
        message: 'Total earnings cannot be negative',
        value: therapist.totalEarnings,
        severity: 'error'
      });
    }

    // Expenses validation
    if (therapist.expenses) {
      const totalExpenses = therapist.expenses.reduce((sum, expense) => sum + expense.amount, 0);
      if (totalExpenses < 0) {
        errors.push({
          field: 'expenses',
          message: 'Total expenses cannot be negative',
          value: totalExpenses,
          severity: 'error'
        });
      }

      // Validate individual expenses
      therapist.expenses.forEach((expense, index) => {
        if (!expense.description || expense.description.trim() === '') {
          errors.push({
            field: `expenses[${index}].description`,
            message: 'Expense description is required',
            severity: 'error'
          });
        }

        if (expense.amount < 0) {
          errors.push({
            field: `expenses[${index}].amount`,
            message: 'Expense amount cannot be negative',
            value: expense.amount,
            severity: 'error'
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate walkout data
   */
  validateWalkOut(walkOut: WalkOut): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!walkOut.id) {
      errors.push({
        field: 'id',
        message: 'WalkOut ID is required',
        severity: 'error'
      });
    }

    if (!walkOut.therapistIds || walkOut.therapistIds.length === 0) {
      errors.push({
        field: 'therapistIds',
        message: 'Therapist IDs are required',
        severity: 'error'
      });
    }

    if (!walkOut.reason || walkOut.reason.trim() === '') {
      errors.push({
        field: 'reason',
        message: 'WalkOut reason is required',
        severity: 'error'
      });
    }

    // Count validation
    if (walkOut.count && walkOut.count < 1) {
      errors.push({
        field: 'count',
        message: 'WalkOut count must be at least 1',
        value: walkOut.count,
        severity: 'error'
      });
    }

    // Date validation
    if (!walkOut.timestamp) {
      errors.push({
        field: 'timestamp',
        message: 'WalkOut timestamp is required',
        severity: 'error'
      });
    } else {
      const timestamp = new Date(walkOut.timestamp);
      if (isNaN(timestamp.getTime())) {
        errors.push({
          field: 'timestamp',
          message: 'Invalid timestamp format',
          value: walkOut.timestamp,
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate room data
   */
  validateRoom(room: Room): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!room.id) {
      errors.push({
        field: 'id',
        message: 'Room ID is required',
        severity: 'error'
      });
    }

    if (!room.name || room.name.trim() === '') {
      errors.push({
        field: 'name',
        message: 'Room name is required',
        severity: 'error'
      });
    }

    if (!room.type) {
      errors.push({
        field: 'type',
        message: 'Room type is required',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate service data
   */
  validateService(service: Service): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!service.id) {
      errors.push({
        field: 'id',
        message: 'Service ID is required',
        severity: 'error'
      });
    }

    if (!service.description || service.description.trim() === '') {
      errors.push({
        field: 'description',
        message: 'Service description is required',
        severity: 'error'
      });
    }

    if (service.price < 0) {
      errors.push({
        field: 'price',
        message: 'Service price cannot be negative',
        value: service.price,
        severity: 'error'
      });
    }

    if (service.ladyPayout < 0) {
      errors.push({
        field: 'ladyPayout',
        message: 'Lady payout cannot be negative',
        value: service.ladyPayout,
        severity: 'error'
      });
    }

    if (service.shopRevenue < 0) {
      errors.push({
        field: 'shopRevenue',
        message: 'Shop revenue cannot be negative',
        value: service.shopRevenue,
        severity: 'error'
      });
    }

    // Business logic validation
    if (service.ladyPayout + service.shopRevenue > service.price) {
      warnings.push({
        field: 'payouts',
        message: `Total payouts (${service.ladyPayout + service.shopRevenue}) exceed service price (${service.price})`,
        value: { ladyPayout: service.ladyPayout, shopRevenue: service.shopRevenue, price: service.price }
      });
    }

    if (service.duration <= 0) {
      errors.push({
        field: 'duration',
        message: 'Service duration must be positive',
        value: service.duration,
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate data consistency across related entities
   */
  validateDataConsistency(sessions: Session[], therapists: Therapist[], rooms: Room[], services: Service[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for orphaned sessions
    const therapistIds = new Set(therapists.map(t => t.id));
    const roomIds = new Set(rooms.map(r => r.id));
    const serviceIds = new Set(services.map(s => s.id));

    sessions.forEach((session, index) => {
      session.therapistIds.forEach((therapistId, therapistIndex) => {
        if (!therapistIds.has(therapistId)) {
          errors.push({
            field: `sessions[${index}].therapistIds[${therapistIndex}]`,
            message: `Session references non-existent therapist: ${therapistId}`,
            value: therapistId,
            severity: 'error'
          });
        }
      });

      if (!roomIds.has(session.roomId)) {
        errors.push({
          field: `sessions[${index}].roomId`,
          message: `Session references non-existent room: ${session.roomId}`,
          value: session.roomId,
          severity: 'error'
        });
      }

      if (!serviceIds.has(session.service.id)) {
        errors.push({
          field: `sessions[${index}].service.id`,
          message: `Session references non-existent service: ${session.service.id}`,
          value: session.service.id,
          severity: 'error'
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export const dataValidationService = DataValidationService.getInstance();

import { describe, it, expect } from 'vitest';
import { roleLabel } from './useAuth';

describe('roleLabel', () => {
  it('returns Administrator for admin role', () => {
    expect(roleLabel('admin')).toBe('Administrator');
  });

  it('returns Doctor for doctor role', () => {
    expect(roleLabel('doctor')).toBe('Doctor');
  });

  it('returns Receptionist for receptionist role', () => {
    expect(roleLabel('receptionist')).toBe('Receptionist');
  });

  it('returns Patient for patient role', () => {
    expect(roleLabel('patient')).toBe('Patient');
  });
});

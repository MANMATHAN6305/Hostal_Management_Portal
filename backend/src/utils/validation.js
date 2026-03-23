const DEPARTMENT_OPTIONS = ['CSE', 'CSBS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];

const normalizeDepartment = (value) => String(value || '').trim().toUpperCase();

const isValidDepartment = (value) => DEPARTMENT_OPTIONS.includes(normalizeDepartment(value));

const sanitizePhoneNumber = (value) => String(value || '').replace(/\D/g, '');

const isValidPhoneNumber = (value) => /^\d{10}$/.test(String(value || ''));

module.exports = {
  DEPARTMENT_OPTIONS,
  normalizeDepartment,
  isValidDepartment,
  sanitizePhoneNumber,
  isValidPhoneNumber
};

export const DEPARTMENT_OPTIONS = [
  { value: 'CSE', label: 'Computer Science Engineering (CSE)' },
  { value: 'CSBS', label: 'Computer Science and Business Systems (CSBS)' },
  { value: 'ECE', label: 'Electronics and Communication Engineering (ECE)' },
  { value: 'EEE', label: 'Electrical and Electronics Engineering (EEE)' },
  { value: 'MECH', label: 'Mechanical Engineering (MECH)' },
  { value: 'CIVIL', label: 'Civil Engineering (CIVIL)' },
  { value: 'IT', label: 'Information Technology (IT)' }
] as const;

export const DEPARTMENT_VALUES = DEPARTMENT_OPTIONS.map((option) => option.value);

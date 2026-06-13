export const ERROR_CODES = {
  'ERR-001': { label: 'Wrong product packed', messageKey: 'error_wrong_product' },
  'ERR-002': { label: 'Wrong quantity', messageKey: 'error_wrong_qty' },
  'ERR-003': { label: 'Damaged item', messageKey: 'error_damaged' },
  'ERR-004': { label: 'Missing item', messageKey: 'error_missing_item' },
  'ERR-005': { label: 'Wrong label / bag', messageKey: 'error_wrong_label' },
  'ERR-006': { label: 'Packaging issue', messageKey: 'error_packaging' },
  CUSTOM: { label: 'Other', messageKey: null },
};

export const LANGUAGES = ['english', 'tamil', 'malayalam', 'hindi'];

export const STAFF_ROLES = ['manager', 'admin'];

export const ROLE_LABELS = {
  worker: 'Worker',
  manager: 'Manager',
  admin: 'Admin',
};

export const ORDER_STATUSES = ['PENDING', 'ASSIGNED', 'PACKING', 'PACKED', 'ERROR'];

export const WEIGHT_SPLIT_THRESHOLD_KG = 150;
export const OVERFLOW_THRESHOLD_KG = 3;
export const ACCURACY_ALERT_THRESHOLD = 0.95;

export const PRODUCT_ID_PATTERN = /^[A-Z]{2,6}-\d{3}$/;

const FIELD_LABELS = {
  id: 'ID',
  search: 'Search text',
  name: 'Name',
  phone: 'Phone number',
  email: 'Email address',
  gender: 'Gender',
  dob: 'Date of birth',
  address: 'Address',
  notes: 'Notes',
  role: 'Role',
  specialties: 'Specialties',
  salary: 'Salary',
  joinDate: 'Join date',
  isActive: 'Active status',
  workingDays: 'Working days',
  'workingHours.start': 'Working hour start time',
  'workingHours.end': 'Working hour end time',
  customer: 'Customer',
  customerId: 'Customer',
  staff: 'Staff member',
  staffId: 'Staff member',
  services: 'Services',
  date: 'Date',
  timeSlot: 'Time slot',
  status: 'Status',
  totalAmount: 'Total amount',
  discount: 'Discount',
  finalAmount: 'Final amount',
  paymentStatus: 'Payment status',
  paymentMethod: 'Payment method',
  category: 'Category',
  price: 'Price',
  duration: 'Duration',
  description: 'Description',
  password: 'Password'
};

const DATE_FIELDS = new Set(['date', 'dob', 'joinDate']);
const TIME_FIELDS = new Set(['timeSlot', 'workingHours.start', 'workingHours.end']);

const toTitleCase = (value = '') =>
  value
    .replace(/\[\d+\]/g, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[._]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (ch) => ch.toUpperCase());

const toFieldKey = (path = []) =>
  path
    .map((part) => (typeof part === 'number' ? `[${part}]` : String(part)))
    .join('.')
    .replace(/\.\[/g, '[');

const normalizeFieldKey = (fieldKey = '') => fieldKey.replace(/\[\d+\]/g, '');

const getFieldLabel = (path = []) => {
  const rawKey = toFieldKey(path);
  const key = normalizeFieldKey(rawKey);
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];

  const rootKey = key.split('.')[0];
  if (FIELD_LABELS[rootKey]) return FIELD_LABELS[rootKey];

  return toTitleCase(key || 'field');
};

const joinAllowedValues = (valids = []) =>
  valids
    .filter((value) => value !== undefined && value !== null && value !== '')
    .map((value) => String(value))
    .join(', ');

const buildObjectMissingMessage = (peers = []) => {
  const peerSet = new Set(peers);
  if (peerSet.has('customer') || peerSet.has('customerId')) {
    return 'Please select a customer.';
  }
  if (peerSet.has('staff') || peerSet.has('staffId')) {
    return 'Please select a staff member.';
  }
  return 'Required fields are missing.';
};

const buildPatternMessage = (fieldLabel, fieldKey) => {
  if (fieldKey.endsWith('phone') || fieldKey === 'phone') {
    return 'Phone number must contain exactly 10 digits.';
  }
  if (DATE_FIELDS.has(fieldKey)) {
    return `${fieldLabel} must be in YYYY-MM-DD format.`;
  }
  if (TIME_FIELDS.has(fieldKey)) {
    return `${fieldLabel} must be in HH:mm format.`;
  }
  return `${fieldLabel} format is invalid.`;
};

const formatJoiDetail = (detail) => {
  const fieldKey = normalizeFieldKey(toFieldKey(detail.path));
  const fieldLabel = getFieldLabel(detail.path);
  const context = detail.context || {};

  switch (detail.type) {
    case 'any.required':
    case 'string.empty':
      return `${fieldLabel} is required.`;
    case 'string.base':
      return `${fieldLabel} must be text.`;
    case 'string.email':
      return 'Please enter a valid email address.';
    case 'string.min':
      return `${fieldLabel} must be at least ${context.limit} characters long.`;
    case 'string.max':
      return `${fieldLabel} must be at most ${context.limit} characters long.`;
    case 'string.pattern.base':
      return buildPatternMessage(fieldLabel, fieldKey);
    case 'number.base':
      return `${fieldLabel} must be a number.`;
    case 'number.integer':
      return `${fieldLabel} must be a whole number.`;
    case 'number.positive':
      return `${fieldLabel} must be greater than 0.`;
    case 'number.min':
      return `${fieldLabel} must be at least ${context.limit}.`;
    case 'number.max':
      return `${fieldLabel} must be at most ${context.limit}.`;
    case 'boolean.base':
      return `${fieldLabel} must be true or false.`;
    case 'array.base':
      return `${fieldLabel} must be a list.`;
    case 'array.min':
      return `${fieldLabel} must have at least ${context.limit} item${context.limit === 1 ? '' : 's'}.`;
    case 'array.max':
      return `${fieldLabel} can have at most ${context.limit} item${context.limit === 1 ? '' : 's'}.`;
    case 'any.only': {
      const allowedValues = joinAllowedValues(context.valids || []);
      return allowedValues
        ? `${fieldLabel} must be one of: ${allowedValues}.`
        : `${fieldLabel} has an invalid value.`;
    }
    case 'object.min':
      return 'Please provide at least one field to update.';
    case 'object.missing':
      return buildObjectMissingMessage(context.peers);
    case 'object.unknown':
    case 'any.unknown':
      return `${fieldLabel} is not allowed.`;
    default:
      return detail.message.replace(/"/g, '');
  }
};

const formatJoiValidationError = (error) => {
  if (!error?.isJoi) return null;

  const errors = error.details.map((detail) => ({
    field: normalizeFieldKey(toFieldKey(detail.path)),
    message: formatJoiDetail(detail)
  }));

  return {
    statusCode: 400,
    message: errors.map((item) => item.message).join(' '),
    errors
  };
};

module.exports = { formatJoiValidationError };

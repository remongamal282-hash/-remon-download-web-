export const registerSchema = {
  body: {
    type: 'object', additionalProperties: false, required: ['email', 'password'],
    properties: {
      email: { type: 'string', minLength: 3, maxLength: 254, format: 'email' },
      password: { type: 'string', minLength: 8, maxLength: 128 },
      passwordConfirmation: { type: 'string', minLength: 8, maxLength: 128 },
      displayName: { type: 'string', minLength: 1, maxLength: 100 },
    },
  },
} as const;

export const loginSchema = {
  body: {
    type: 'object', additionalProperties: false, required: ['email', 'password'],
    properties: {
      email: { type: 'string', minLength: 3, maxLength: 254, format: 'email' },
      password: { type: 'string', minLength: 1, maxLength: 128 },
    },
  },
} as const;
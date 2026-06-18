/** Veil DLP policy packs — server-side catalog (mirrors portal/policy-packs.js). */

export const POLICY_PACKS = Object.freeze({
  observational: {
    id: 'observational',
    label: 'Observational',
    description: 'Copilot suggests actions; no automatic blocks.',
    dlp: {
      version: 1,
      enabled: false,
      defaultAction: 'warn',
      categories: {},
      aiSurfaces: { defaultAction: 'block', categories: {} },
    },
  },
  finance: {
    id: 'finance',
    label: 'Finance',
    description: 'Block cards, bank details, tax IDs, and API keys.',
    dlp: {
      version: 1,
      enabled: true,
      defaultAction: 'warn',
      categories: {
        credit_card: { action: 'block', minSeverity: 'medium' },
        bank_account: { action: 'block', minSeverity: 'high' },
        iban: { action: 'block', minSeverity: 'high' },
        ssn: { action: 'block', minSeverity: 'high' },
        national_id: { action: 'block', minSeverity: 'high' },
        api_key: { action: 'block', minSeverity: 'high' },
        jwt: { action: 'block', minSeverity: 'high' },
      },
      aiSurfaces: {
        defaultAction: 'block',
        categories: {
          credit_card: { action: 'block' },
          api_key: { action: 'block' },
          jwt: { action: 'block' },
        },
      },
    },
  },
  healthcare: {
    id: 'healthcare',
    label: 'Healthcare',
    description: 'Block MRNs, SSNs, and payment data.',
    dlp: {
      version: 1,
      enabled: true,
      defaultAction: 'warn',
      categories: {
        medical_record_number: { action: 'block', minSeverity: 'high' },
        ssn: { action: 'block', minSeverity: 'high' },
        credit_card: { action: 'block', minSeverity: 'high' },
        national_id: { action: 'block', minSeverity: 'high' },
        passport: { action: 'block', minSeverity: 'high' },
        email: { action: 'warn', minSeverity: 'high' },
        phone: { action: 'warn', minSeverity: 'high' },
      },
      aiSurfaces: {
        defaultAction: 'block',
        categories: {
          medical_record_number: { action: 'block' },
          ssn: { action: 'block' },
          credit_card: { action: 'block' },
        },
      },
    },
  },
  engineering: {
    id: 'engineering',
    label: 'Engineering',
    description: 'Block secrets and tokens; warn on internal references.',
    dlp: {
      version: 1,
      enabled: true,
      defaultAction: 'warn',
      categories: {
        api_key: { action: 'block', minSeverity: 'high' },
        jwt: { action: 'block', minSeverity: 'high' },
        password: { action: 'warn', minSeverity: 'medium' },
        internal_company_reference: { action: 'warn', minSeverity: 'medium' },
      },
      aiSurfaces: {
        defaultAction: 'block',
        categories: {
          api_key: { action: 'block' },
          jwt: { action: 'block' },
          password: { action: 'warn' },
        },
      },
    },
  },
});

export function listPolicyPacks() {
  return Object.values(POLICY_PACKS);
}

export function getPolicyPack(id) {
  return POLICY_PACKS[String(id || '').trim()] || null;
}

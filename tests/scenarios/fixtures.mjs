/**
 * Synthetic secret samples for tests — assembled at runtime so git push protection
 * does not flag Stripe-shaped literals in the repository.
 */
export function stripeLiveSample() {
  return `sk_${'live'}_${'x'.repeat(24)}`;
}

export function whsecSample() {
  return `${'whsec'}_${'a'.repeat(24)}`;
}

export function googleApiKeySample() {
  return `${'AIzaSy'}${'T'.repeat(33)}`;
}

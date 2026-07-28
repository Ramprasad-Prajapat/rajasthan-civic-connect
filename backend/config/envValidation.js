/**
 * Environment Variables Validation Module for Backend Infrastructure
 */
export function validateEnvironment() {
  const isProd = process.env.NODE_ENV === 'production';
  const requiredInProd = ['PORT', 'FRONTEND_URL'];
  const warnings = [];

  for (const envVar of requiredInProd) {
    if (!process.env[envVar]) {
      warnings.push(`Missing Environment Variable: ${envVar}`);
    }
  }

  if (!process.env.FIREBASE_PRIVATE_KEY && !process.env.FIREBASE_CLIENT_EMAIL) {
    warnings.push('Firebase Service Account variables not set. Server running in local DB fallback mode.');
  }

  if (warnings.length > 0) {
    console.warn('----------------------------------------------------');
    console.warn('⚠️  ENVIRONMENT CONFIGURATION WARNINGS:');
    warnings.forEach(w => console.warn(`   - ${w}`));
    console.warn('----------------------------------------------------');
  } else {
    console.log('✅ Environment configuration validated successfully.');
  }
}

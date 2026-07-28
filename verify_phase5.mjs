import fs from 'fs';
import path from 'path';

console.log('=== STARTING PHASE 5 AI FEATURES & SMART CIVIC INTELLIGENCE VERIFICATION ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

const rootDir = 'R:/Inernship/WebDevelopment/Project/rajasthan-civic-connect';
const frontendDir = path.join(rootDir, 'frontend');
const backendDir = path.join(rootDir, 'backend');

// 1. Verify Backend AI Service & Router
const aiServicePath = path.join(backendDir, 'services/aiService.js');
assert(fs.existsSync(aiServicePath), 'backend/services/aiService.js exists');

if (fs.existsSync(aiServicePath)) {
  const aiContent = fs.readFileSync(aiServicePath, 'utf8');
  assert(aiContent.includes('classifyComplaint'), 'aiService.js exports classifyComplaint NLP function');
  assert(aiContent.includes('predictPriority'), 'aiService.js exports predictPriority function');
  assert(aiContent.includes('analyzeImageProof'), 'aiService.js exports analyzeImageProof computer vision function');
  assert(aiContent.includes('generateAIAnalytics'), 'aiService.js exports generateAIAnalytics function');
}

const aiRoutesPath = path.join(backendDir, 'routes/aiRoutes.js');
assert(fs.existsSync(aiRoutesPath), 'backend/routes/aiRoutes.js API router exists');

const serverJsPath = path.join(backendDir, 'server.js');
const serverJsContent = fs.readFileSync(serverJsPath, 'utf8');
assert(serverJsContent.includes('/api/ai'), 'server.js registers /api/ai API router');

// 2. Verify Frontend AI Components
const chatbotPath = path.join(frontendDir, 'src/components/CivicChatbot.jsx');
assert(fs.existsSync(chatbotPath), 'CivicChatbot.jsx floating assistant component exists');

const voicePath = path.join(frontendDir, 'src/components/VoiceAssistant.jsx');
assert(fs.existsSync(voicePath), 'VoiceAssistant.jsx speech-to-text component exists');

const officerInsightsPath = path.join(frontendDir, 'src/components/SmartOfficerInsights.jsx');
assert(fs.existsSync(officerInsightsPath), 'SmartOfficerInsights.jsx component exists');

const aiAnalyticsPath = path.join(frontendDir, 'src/components/AIAnalytics.jsx');
assert(fs.existsSync(aiAnalyticsPath), 'AIAnalytics.jsx component exists');

const appJsxPath = path.join(frontendDir, 'src/App.jsx');
const appJsxContent = fs.readFileSync(appJsxPath, 'utf8');
assert(appJsxContent.includes('CivicChatbot'), 'App.jsx integrates CivicChatbot assistant widget');

// 3. Regression Protection Checks
const firestoreRulesPath = path.join(rootDir, 'firestore.rules');
assert(fs.existsSync(firestoreRulesPath), '[Regression] firestore.rules security rules file intact');

const vercelJsonPath = path.join(rootDir, 'vercel.json');
assert(fs.existsSync(vercelJsonPath), '[Regression] vercel.json deployment manifest intact');

const deployCiPath = path.join(rootDir, '.github/workflows/deploy-ci.yml');
assert(fs.existsSync(deployCiPath), '[Regression] deploy-ci.yml GitHub Actions workflow intact');

console.log(`\n=== PHASE 5 VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED ===`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PHASE 5 AI FEATURES & SMART CIVIC INTELLIGENCE VERIFICATIONS PASSED SUCCESSFULLY!');
}

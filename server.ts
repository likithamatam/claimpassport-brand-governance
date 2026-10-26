/**
 * Claim Passport - Full-Stack Express Server with Gemini API & Rules Engine
 */
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini SDK if API key is provided
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Server Health endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    appName: 'Claim Passport',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

import { INITIAL_FACTS, INITIAL_GUIDELINES, INITIAL_SUBMISSIONS, INITIAL_AUDIT_LOGS } from './src/data/seedData';
import { runDeterministicVerification } from './src/services/rulesEngine';

// In-memory backend repository (seeded with initial data)
let serverFacts = [...INITIAL_FACTS];
let serverGuidelines = [...INITIAL_GUIDELINES];
let serverSubmissions = [...INITIAL_SUBMISSIONS];
let serverAuditLogs = [...INITIAL_AUDIT_LOGS];

// REST Endpoints
app.get('/api/facts', (_req: Request, res: Response) => {
  res.json({ success: true, count: serverFacts.length, data: serverFacts });
});

app.post('/api/facts', (req: Request, res: Response) => {
  const newFact = req.body;
  if (!newFact || !newFact.claim) {
    res.status(400).json({ error: 'Fact claim is required' });
    return;
  }
  const existingIdx = serverFacts.findIndex(f => f.id === newFact.id);
  if (existingIdx >= 0) {
    serverFacts[existingIdx] = newFact;
  } else {
    serverFacts.unshift(newFact);
  }
  res.json({ success: true, data: newFact });
});

app.get('/api/guidelines', (_req: Request, res: Response) => {
  res.json({ success: true, count: serverGuidelines.length, data: serverGuidelines });
});

app.get('/api/submissions', (_req: Request, res: Response) => {
  res.json({ success: true, count: serverSubmissions.length, data: serverSubmissions });
});

app.post('/api/submissions', (req: Request, res: Response) => {
  const sub = req.body;
  if (!sub || !sub.title || !sub.content) {
    res.status(400).json({ error: 'Submission title and content are required' });
    return;
  }
  const existingIdx = serverSubmissions.findIndex(s => s.id === sub.id);
  if (existingIdx >= 0) {
    serverSubmissions[existingIdx] = sub;
  } else {
    serverSubmissions.unshift(sub);
  }
  res.json({ success: true, data: sub });
});

app.get('/api/audit-logs', (_req: Request, res: Response) => {
  res.json({ success: true, count: serverAuditLogs.length, data: serverAuditLogs });
});

// AI Verification Endpoint using Gemini 3.8 Flash with Deterministic Guarantee
app.post('/api/verify', async (req: Request, res: Response) => {
  try {
    const { title, content, intent, contentType, targetAudience, activeFacts, brandGuidelines } = req.body;

    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'Content text is required.' });
      return;
    }

    const factsToUse = (activeFacts && activeFacts.length > 0) ? activeFacts : serverFacts;
    const guidelinesToUse = (brandGuidelines && brandGuidelines.length > 0) ? brandGuidelines : serverGuidelines;
    const resolvedIntent = intent || 'Promote product benefits and consumer safety';

    // If Gemini client is available, attempt live semantic verification
    if (aiClient && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are the AI verification core for Claim Passport, an enterprise brand governance platform.
Analyze the following marketing content against the provided Living Fact Registry and Brand Guidelines.

CURRENT DATE FOR EVALUATING EXPIRY: October 26, 2026.

CONTENT TITLE: ${title || 'Untitled'}
CONTENT INTENT (INTENT LOCK): "${resolvedIntent}"
CONTENT TYPE: ${contentType || 'Marketing Copy'}
TARGET AUDIENCE: ${targetAudience || 'General Audience'}

CONTENT TO EVALUATE:
"""
${content}
"""

APPROVED LIVING FACTS (Database):
${JSON.stringify(factsToUse, null, 2)}

BRAND GUIDELINES:
${JSON.stringify(guidelinesToUse, null, 2)}

RULES FOR EVALUATION:
1. Extract every factual claim from the content.
2. Check claims against the provided Living Facts.
3. If a claim matches a fact whose expiryDate is on or before 2026-10-26, it is a "Stale Fact" (High severity).
4. If a claim makes an objective assertion (like "100% safe", "guaranteed results", "market leader") and has NO matching fact in the registry, flag it as "Needs Evidence" (Critical or High severity). DO NOT declare it false; mark as "Needs Human Review".
5. Check against Brand Guidelines for banned terminology (e.g. absolute claims like "100% safe", superlatives, unapproved product names).
6. Provide an "Intent Lock" compliant rewrite: preserve the original purpose ("${resolvedIntent}") without adding new unverified claims, using only verified facts.
7. Return strictly valid JSON with this schema:
{
  "extractedClaims": [
    { "text": string, "type": string }
  ],
  "findings": [
    {
      "id": string,
      "category": "Stale Fact" | "Needs Evidence" | "Banned Terminology" | "Voice & Tone" | "Missing Disclaimer" | "Naming Inconsistency",
      "flaggedText": string,
      "severity": "Critical" | "High" | "Medium" | "Low",
      "confidence": number,
      "explanation": string,
      "evidenceSource": string,
      "evidenceId": string,
      "factOwner": string,
      "expiryDate": string,
      "suggestedCorrection": string,
      "status": "Needs Human Review" | "Verified" | "Flagged"
    }
  ],
  "suggestedRevision": string,
  "intentPreserved": boolean,
  "intentNotes": string
}`;

        // Race against a 7-second timeout for responsive UX
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI Verification timeout: falling back to rules engine')), 7000)
        );

        const geminiPromise = aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        const rawText = response.text || '{}';
        const parsed = JSON.parse(rawText);
        res.json({ success: true, liveAI: true, data: parsed });
        return;
      } catch (geminiError: any) {
        console.warn('Gemini call completed or timed out; executing deterministic rules engine:', geminiError?.message);
      }
    }

    // Deterministic Rules & Evidence Matching Fallback with Full Data
    const deterministicResult = runDeterministicVerification(content, resolvedIntent, factsToUse, guidelinesToUse);
    res.json({
      success: true,
      liveAI: false,
      data: {
        extractedClaims: deterministicResult.extractedClaims.map(c => ({ text: c, type: 'Proposition' })),
        findings: deterministicResult.findings,
        suggestedRevision: deterministicResult.suggestedRevision,
        intentPreserved: deterministicResult.intentPreserved,
        intentNotes: deterministicResult.intentLockNotes,
      },
      fallbackNotice: 'Executed via Deterministic Claim & Living Fact Verification Engine.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error during verification:', error);
    res.status(500).json({ error: error.message || 'Internal verification error' });
  }
});

// CSV Report Export API
app.get('/api/export/csv', (req: Request, res: Response) => {
  const sampleCsv = `Finding_ID,Category,Severity,Flagged_Text,Evidence_Source,Fact_Owner,Status,Suggested_Correction
FND-001,Stale Fact,High,"10,000+ customers",FACT-012 (Expired 2026-09-30),Sarah Jenkins,Needs Human Review,"Verify updated Q3 customer registry"
FND-002,Needs Evidence,Critical,"100% safe",None (No evidence found),Unassigned,Needs Human Review,"Meet our BPA-free bottle, designed for everyday use."
`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="claim_passport_audit_report.csv"');
  res.send(sampleCsv);
});

// Mount Vite or static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Claim Passport] Full-stack server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

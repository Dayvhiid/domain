import express from 'express';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_SECRETS = {
  'domain-platform': process.env.WEBHOOK_SECRET,
};

const DEPLOY_SCRIPTS = {
  'domain-platform': path.join(__dirname, 'scripts', 'deploy-all.sh'),
};

const LOG_FILE = path.join(__dirname, 'deploy.log');
const locks = new Set();

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
  process.stdout.write(line);
}

function verifySignature(payload, signature) {
  if (!signature) return false;
  const repoName = payload?.repository?.name;
  const secret = WEBHOOK_SECRETS[repoName];
  if (!secret) return false;

  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

app.post('/webhook', express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }), (req, res) => {
  const event = req.headers['x-github-event'];
  const signature = req.headers['x-hub-signature-256'];
  const payload = req.body;

  if (event === 'ping') {
    return res.sendStatus(200);
  }

  if (event !== 'push') {
    return res.sendStatus(200);
  }

  if (payload.ref !== 'refs/heads/main') {
    return res.sendStatus(200);
  }

  if (!verifySignature(payload, signature)) {
    log(`REJECTED invalid signature from ${req.ip}`);
    return res.sendStatus(401);
  }

  const repoName = payload.repository.name;
  const commitSha = payload.after?.slice(0, 7);
  const commitMsg = payload.head_commit?.message || 'unknown';

  res.sendStatus(200);

  if (locks.has(repoName)) {
    log(`SKIP ${repoName}@${commitSha} - deploy already in progress`);
    return;
  }

  locks.add(repoName);
  log(`DEPLOY ${repoName}@${commitSha} "${commitMsg}"`);

  const scriptPath = DEPLOY_SCRIPTS[repoName];
  if (!scriptPath) {
    log(`ERROR no deploy script for repo "${repoName}"`);
    locks.delete(repoName);
    return;
  }

  execFile('bash', [scriptPath], { timeout: 300000 }, (error, stdout, stderr) => {
    locks.delete(repoName);
    if (error) {
      log(`FAIL ${repoName}@${commitSha}: ${error.message}`);
      if (stderr) log(`STDERR: ${stderr}`);
    } else {
      log(`DONE ${repoName}@${commitSha}`);
      if (stdout) log(`STDOUT: ${stdout}`);
    }
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => {
  log(`Webhook receiver listening on port ${PORT}`);
});

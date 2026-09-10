import express from 'express';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) {
  console.error('FATAL: WEBHOOK_SECRET not set in .env');
  process.exit(1);
}

const DEPLOY_SCRIPT = path.join(__dirname, 'scripts', 'deploy-all.sh');
const LOG_FILE = path.join(__dirname, 'deploy.log');
const locks = new Set();

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
  process.stdout.write(line);
}

function verifySignature(rawBody, signature) {
  if (!signature) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

app.post('/webhook', express.json({
  verify: (req, _res, buf) => { req.rawBody = buf; }
}), (req, res) => {
  const event = req.headers['x-github-event'];
  const signature = req.headers['x-hub-signature-256'];
  const payload = req.body;

  if (event === 'ping') {
    log('PING received');
    return res.sendStatus(200);
  }

  if (event !== 'push') {
    return res.sendStatus(200);
  }

  if (payload.ref !== 'refs/heads/main') {
    return res.sendStatus(200);
  }

  if (!verifySignature(req.rawBody, signature)) {
    log(`REJECTED invalid signature from ${req.ip}`);
    return res.sendStatus(401);
  }

  const repoName = payload.repository.name;
  const commitSha = payload.after?.slice(0, 7);
  const commitMsg = payload.head_commit?.message || 'unknown';
  const pushedBy = payload.pusher?.name || 'unknown';

  res.sendStatus(200);

  if (locks.has(repoName)) {
    log(`SKIP ${repoName}@${commitSha} - deploy already in progress`);
    return;
  }

  locks.add(repoName);
  log(`DEPLOY ${repoName}@${commitSha} "${commitMsg}" by ${pushedBy}`);

  execFile('bash', [DEPLOY_SCRIPT], { timeout: 300000 }, (error, stdout, stderr) => {
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

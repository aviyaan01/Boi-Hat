/**
 * Automated Render Deployment Script for Boi-Hat API
 * Uses Render REST API v1 (https://api.render.com/v1)
 */

const https = require('https');
const fs = require('fs');
const dotenv = require('dotenv');

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i].startsWith('--')) {
      const key = process.argv[i].slice(2);
      const val = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true;
      args[key] = val;
    }
  }
  return args;
}

const args = parseArgs();
const token = args.token || process.env.RENDER_API_KEY || 'rnd_0fViaXR3ADb4l4muWz8yYhwKJE0T';

if (!token) {
  console.error('Error: Render API token is required. Pass --token <RENDER_API_KEY> or set RENDER_API_KEY.');
  process.exit(1);
}

// Load .env
let env = {};
if (fs.existsSync('.env')) {
  env = dotenv.parse(fs.readFileSync('.env'));
} else if (fs.existsSync('apps/api/.env')) {
  env = dotenv.parse(fs.readFileSync('apps/api/.env'));
}

function renderApi(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: '/v1' + path,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        ...(postData ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try {
          json = data ? JSON.parse(data) : {};
        } catch (e) {
          json = { raw: data };
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('--- Step 1: Validating Render API Key & Owner ---');
  const ownerRes = await renderApi('GET', '/owners');
  if (ownerRes.status !== 200 || !ownerRes.data || !ownerRes.data[0]) {
    console.error('Failed to get owner. Status:', ownerRes.status, ownerRes.data);
    process.exit(1);
  }
  const owner = ownerRes.data[0].owner;
  console.log(`✓ Authenticated as: ${owner.name} (${owner.email}) [ID: ${owner.id}]`);

  console.log('\n--- Step 2: Checking Existing Services ---');
  const listRes = await renderApi('GET', '/services?limit=50');
  let existingService = null;
  if (listRes.status === 200 && Array.isArray(listRes.data)) {
    for (const item of listRes.data) {
      if (item.service && item.service.name === 'boi-hat-api') {
        existingService = item.service;
        break;
      }
    }
  }

  // Prepare environment variables
  const jwtAccessSecret = env.JWT_ACCESS_SECRET || 'boi_hat_super_secret_access_jwt_key_singapore_prod_2026_prod';
  const jwtRefreshSecret = env.JWT_REFRESH_SECRET || 'boi_hat_super_secret_refresh_jwt_key_singapore_prod_2026_prod';
  const emailProvider = env.BREVO_API_KEY ? 'brevo' : (env.EMAIL_PROVIDER || 'console');

  const envVars = [
    { key: 'NODE_ENV', value: 'production' },
    { key: 'PORT', value: '10000' },
    { key: 'DATABASE_URL', value: env.DATABASE_URL },
    { key: 'DIRECT_URL', value: env.DIRECT_URL || env.DATABASE_URL },
    { key: 'JWT_ACCESS_SECRET', value: jwtAccessSecret },
    { key: 'JWT_REFRESH_SECRET', value: jwtRefreshSecret },
    { key: 'CORS_ORIGINS', value: '*' },
    { key: 'STORAGE_PROVIDER', value: 'cloudinary' },
    { key: 'CLOUDINARY_CLOUD_NAME', value: env.CLOUDINARY_CLOUD_NAME },
    { key: 'CLOUDINARY_API_KEY', value: env.CLOUDINARY_API_KEY },
    { key: 'CLOUDINARY_API_SECRET', value: env.CLOUDINARY_API_SECRET },
    { key: 'EMAIL_PROVIDER', value: emailProvider }
  ];

  if (env.BREVO_API_KEY) {
    envVars.push({ key: 'BREVO_API_KEY', value: env.BREVO_API_KEY });
  }
  if (env.BREVO_SENDER_EMAIL || env.EMAIL_FROM_ADDRESS) {
    envVars.push({ key: 'BREVO_SENDER_EMAIL', value: env.BREVO_SENDER_EMAIL || env.EMAIL_FROM_ADDRESS });
  }

  let serviceId;
  let serviceUrl;

  if (existingService) {
    console.log(`Found existing service "boi-hat-api" (ID: ${existingService.id})`);
    serviceId = existingService.id;
    serviceUrl = existingService.serviceDetails?.url;

    console.log('Updating environment variables...');
    const updateEnvRes = await renderApi('PUT', `/services/${serviceId}/env-vars`, envVars);
    console.log('Update env-vars status:', updateEnvRes.status);

    console.log('Triggering new deploy...');
    const deployRes = await renderApi('POST', `/services/${serviceId}/deploys`, {});
    if (deployRes.status !== 201 && deployRes.status !== 200) {
      console.error('Failed to trigger deploy:', deployRes.data);
      process.exit(1);
    }
    console.log(`✓ Deploy triggered! (Deploy ID: ${deployRes.data.id})`);
  } else {
    console.log('Creating new Web Service "boi-hat-api" on Render (Singapore region)...');
    const servicePayload = {
      type: 'web_service',
      name: 'boi-hat-api',
      ownerId: owner.id,
      repo: 'https://github.com/aviyaan01/Boi-Hat',
      branch: 'master',
      autoDeploy: 'yes',
      serviceDetails: {
        env: 'node',
        plan: 'free',
        region: 'singapore',
        buildCommand: 'npm install && npm run build && npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma',
        startCommand: 'node apps/api/dist/src/main',
        healthCheckPath: '/health',
        envVars: envVars
      }
    };

    const createRes = await renderApi('POST', '/services', servicePayload);
    if (createRes.status !== 201 && createRes.status !== 200) {
      console.error('Failed to create service:', createRes.status, createRes.data);
      process.exit(1);
    }

    const created = createRes.data;
    serviceId = created.id;
    serviceUrl = created.serviceDetails?.url || `https://${created.slug}.onrender.com`;
    console.log(`✓ Service created successfully!`);
    console.log(`  ID: ${serviceId}`);
    console.log(`  URL: ${serviceUrl}`);
  }

  console.log('\n--- Step 3: Monitoring Deploy Progress ---');
  let isLive = false;
  let attempts = 0;
  const maxAttempts = 40; // 40 * 15s = 10 minutes

  while (!isLive && attempts < maxAttempts) {
    attempts++;
    await sleep(15000);
    const deployListRes = await renderApi('GET', `/services/${serviceId}/deploys?limit=1`);
    if (deployListRes.status === 200 && Array.isArray(deployListRes.data) && deployListRes.data[0]) {
      const deploy = deployListRes.data[0].deploy;
      console.log(`[Attempt ${attempts}/${maxAttempts}] Deploy status: ${deploy.status}`);
      if (deploy.status === 'live') {
        isLive = true;
        break;
      } else if (deploy.status === 'build_failed' || deploy.status === 'canceled' || deploy.status === 'deactivated') {
        console.error(`Deploy failed with status: ${deploy.status}`);
        process.exit(1);
      }
    }
  }

  if (isLive) {
    console.log('\n========================================================');
    console.log('✓ CONGRATULATIONS! Render deployment is LIVE!');
    console.log(`Service URL: ${serviceUrl}`);
    console.log('========================================================');
  } else {
    console.log('\nDeploy is still in progress. Check your Render dashboard:');
    console.log(`https://dashboard.render.com/web/${serviceId}`);
  }
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});

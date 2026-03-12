#!/usr/bin/env node

/**
 * Health Check Script for Robot Delivery Simulator
 * Checks if all critical services are running
 */

const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOSTNAME || 'localhost';

const endpoints = [
  { path: '/api/health', name: 'Health API' },
  { path: '/api/user/me', name: 'User API (auth required)' },
];

function checkEndpoint(path, name) {
  return new Promise((resolve) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path,
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      resolve({
        name,
        path,
        status: res.statusCode,
        healthy: res.statusCode >= 200 && res.statusCode < 400,
      });
    });

    req.on('error', (error) => {
      resolve({
        name,
        path,
        status: 0,
        healthy: false,
        error: error.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name,
        path,
        status: 0,
        healthy: false,
        error: 'Request timeout',
      });
    });

    req.end();
  });
}

async function runHealthCheck() {
  console.log('🔍 Running health check...\n');

  const results = await Promise.all(
    endpoints.map((ep) => checkEndpoint(ep.path, ep.name))
  );

  let allHealthy = true;

  results.forEach((result) => {
    const status = result.healthy ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    console.log(`   Path: ${result.path}`);
    console.log(`   Status: ${result.status || 'N/A'}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');

    if (!result.healthy) {
      allHealthy = false;
    }
  });

  console.log('─'.repeat(50));
  if (allHealthy) {
    console.log('✅ All services are healthy!');
    process.exit(0);
  } else {
    console.log('❌ Some services are unhealthy!');
    process.exit(1);
  }
}

runHealthCheck().catch((error) => {
  console.error('❌ Health check failed:', error.message);
  process.exit(1);
});

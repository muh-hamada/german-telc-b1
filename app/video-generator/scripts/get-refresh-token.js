#!/usr/bin/env node

/**
 * Script to obtain YouTube OAuth refresh token
 * Run this once to get the refresh token needed for automated uploads
 * 
 * Usage:
 *   npm install googleapis open
 *   node get-refresh-token.js
 */

const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const open = require('open');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log('=== YouTube OAuth Refresh Token Generator ===\n');
  
  // Get credentials from user
  const CLIENT_ID = await prompt('Enter your OAuth Client ID: ');
  const CLIENT_SECRET = await prompt('Enter your OAuth Client Secret: ');
  
  console.log('\n');
  
  const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  const scopes = ['https://www.googleapis.com/auth/youtube.upload'];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent screen to get refresh token
  });

  console.log('Opening browser for authorization...');
  console.log('If browser does not open, visit this URL manually:');
  console.log(authUrl);
  console.log('\n');

  // Create local server to handle OAuth callback
  const server = http.createServer(async (req, res) => {
    if (req.url.indexOf('/oauth2callback') > -1) {
      const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
      const code = qs.get('code');
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1 style="color: green;">✓ Authentication Successful!</h1>
            <p>You can close this window and return to your terminal.</p>
          </body>
        </html>
      `);

      server.close();

      try {
        const { tokens } = await oauth2Client.getToken(code);
        
        console.log('\n✓ SUCCESS! Your refresh token:');
        console.log('─'.repeat(80));
        console.log(tokens.refresh_token);
        console.log('─'.repeat(80));
        console.log('\n📋 Next Steps:\n');
        console.log('1. Save this refresh token securely');
        console.log('2. Set it in Firebase Functions config:\n');
        console.log('   firebase functions:config:set \\');
        console.log(`     youtube.client_id="${CLIENT_ID}" \\`);
        console.log(`     youtube.client_secret="${CLIENT_SECRET}" \\`);
        console.log(`     youtube.refresh_token="${tokens.refresh_token}"\n`);
        console.log('3. Or for local development, create functions/.runtimeconfig.json:\n');
        console.log('   {');
        console.log('     "youtube": {');
        console.log(`       "client_id": "${CLIENT_ID}",`);
        console.log(`       "client_secret": "${CLIENT_SECRET}",`);
        console.log(`       "refresh_token": "${tokens.refresh_token}"`);
        console.log('     }');
        console.log('   }\n');
      } catch (error) {
        console.error('\n✗ Error getting tokens:', error.message);
      }
      
      rl.close();
      process.exit(0);
    }
  });

server.listen(3000, async () => {
  try {
    await open(authUrl, { wait: false });
  } catch (error) {
    console.log('\n⚠️  Could not open browser automatically.');
    console.log('Please copy and paste the URL above into your browser.\n');
  }
});
}

main().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});


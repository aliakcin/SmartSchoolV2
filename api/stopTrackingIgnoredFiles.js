const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Stopping tracking of files that should be ignored...\n');

try {
  // Remove node_modules directory from Git tracking
  if (fs.existsSync('node_modules')) {
    console.log('Removing node_modules from Git tracking...');
    execSync('git rm -r --cached node_modules', { stdio: 'inherit' });
  } else {
    console.log('node_modules directory not found.');
  }

  // Remove package-lock.json from Git tracking (if it exists)
  if (fs.existsSync('package-lock.json')) {
    console.log('Removing package-lock.json from Git tracking...');
    execSync('git rm --cached package-lock.json', { stdio: 'inherit' });
  } else {
    console.log('package-lock.json not found.');
  }

  // Remove yarn.lock from Git tracking (if it exists)
  if (fs.existsSync('yarn.lock')) {
    console.log('Removing yarn.lock from Git tracking...');
    execSync('git rm --cached yarn.lock', { stdio: 'inherit' });
  } else {
    console.log('yarn.lock not found.');
  }

  // Remove any .env files from Git tracking (if they exist)
  const envFiles = fs.readdirSync('.').filter(file => file.startsWith('.env'));
  if (envFiles.length > 0) {
    console.log('Removing .env files from Git tracking...');
    envFiles.forEach(file => {
      try {
        execSync(`git rm --cached ${file}`, { stdio: 'inherit' });
        console.log(`  - Removed ${file} from tracking`);
      } catch (error) {
        console.log(`  - Could not remove ${file} from tracking: ${error.message}`);
      }
    });
  } else {
    console.log('.env files not found.');
  }

  // Remove any log files from Git tracking
  const logFiles = fs.readdirSync('.').filter(file => file.endsWith('.log'));
  if (logFiles.length > 0) {
    console.log('Removing log files from Git tracking...');
    logFiles.forEach(file => {
      try {
        execSync(`git rm --cached ${file}`, { stdio: 'inherit' });
        console.log(`  - Removed ${file} from tracking`);
      } catch (error) {
        console.log(`  - Could not remove ${file} from tracking: ${error.message}`);
      }
    });
  } else {
    console.log('Log files not found.');
  }

  console.log('\nDone! The ignored files are no longer tracked by Git.');
  console.log('Make sure to commit these changes:');
  console.log('git add .gitignore');
  console.log('git commit -m "Stop tracking ignored files"');

} catch (error) {
  console.error('Error occurred:', error.message);
  process.exit(1);
}
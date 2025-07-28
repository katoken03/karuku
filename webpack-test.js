const { exec } = require('child_process');
const path = require('path');

const projectDir = '/Users/kato/mcp_folder/Karuku';

console.log('Testing Webpack build...');

exec('npm run build', { cwd: projectDir }, (error, stdout, stderr) => {
  if (error) {
    console.error('Build errors found:');
    console.error(error.message);
    if (stderr) {
      console.error('STDERR:', stderr);
    }
  }
  
  if (stdout) {
    console.log('Build output:');
    console.log(stdout);
  }
  
  if (!error) {
    console.log('✅ Webpack build completed successfully!');
  }
});

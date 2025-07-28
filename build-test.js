const { exec } = require('child_process');
const path = require('path');

const projectDir = '/Users/kato/mcp_folder/Karuku';

console.log('Testing TypeScript compilation...');

exec('npx tsc --noEmit', { cwd: projectDir }, (error, stdout, stderr) => {
  if (error) {
    console.error('Compilation errors found:');
    console.error(error.message);
    if (stderr) {
      console.error('STDERR:', stderr);
    }
    if (stdout) {
      console.log('STDOUT:', stdout);
    }
  } else {
    console.log('✅ TypeScript compilation successful!');
    if (stdout) {
      console.log('Output:', stdout);
    }
  }
});

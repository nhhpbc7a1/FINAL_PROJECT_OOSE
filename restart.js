// A simple script to restart the Node.js server
const { exec } = require('child_process');
const os = require('os');

// Determine the appropriate command based on the OS
const isWindows = os.platform() === 'win32';
const killCommand = isWindows 
  ? 'FOR /F "tokens=5" %a in (\'netstat -ano ^| findstr :3000 ^| findstr LISTENING\') do taskkill /F /PID %a'
  : "kill $(lsof -t -i:3000)";

console.log('Attempting to kill process on port 3000...');

exec(killCommand, (error, stdout, stderr) => {
  if (error) {
    console.log('No process was running on port 3000 or could not kill process.');
  } else {
    console.log('Successfully killed process on port 3000.');
  }
  
  console.log('Starting server...');
  
  // Start the server
  exec('node main.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting server: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Server stderr: ${stderr}`);
      return;
    }
    console.log(`Server stdout: ${stdout}`);
  });
}); 
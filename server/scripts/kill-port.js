import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const killPort = async (port) => {
  try {
    // Windows command to find process using port
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    const lines = stdout.trim().split('\n');
    
    if (lines.length === 0 || lines[0] === '') {
      console.log(`✅ Port ${port} is free`);
      return;
    }

    // Extract PIDs from output
    const pids = new Set();
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid)) {
          pids.add(pid);
        }
      }
    });

    // Kill each process
    for (const pid of pids) {
      try {
        await execAsync(`taskkill /F /PID ${pid}`);
        console.log(`✅ Killed process ${pid} using port ${port}`);
      } catch (error) {
        console.log(`⚠️  Could not kill process ${pid}: ${error.message}`);
      }
    }
  } catch (error) {
    // Port might be free, that's okay
    if (error.message.includes('findstr')) {
      console.log(`✅ Port ${port} is free`);
    } else {
      console.log(`⚠️  Error checking port ${port}: ${error.message}`);
    }
  }
};

// Get port from command line or use default
const port = process.argv[2] || 5000;
killPort(port).then(() => process.exit(0));


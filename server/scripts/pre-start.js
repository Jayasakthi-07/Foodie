import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const killPort = async (port) => {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    const lines = stdout.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return; // Port is free
    }

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

    for (const pid of pids) {
      try {
        await execAsync(`taskkill /F /PID ${pid}`);
        console.log(`✅ Freed port ${port} by killing process ${pid}`);
      } catch (error) {
        // Process might already be dead
      }
    }
  } catch (error) {
    // Port is free or command failed, that's okay
  }
};

const port = process.argv[2] || 5000;
killPort(port).then(() => {
  process.exit(0);
}).catch(() => {
  process.exit(0);
});


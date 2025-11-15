import { createServer } from 'http';

export const checkPort = (port) => {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
  });
};

export const findAvailablePort = async (startPort = 5000, maxPort = 5010) => {
  for (let port = startPort; port <= maxPort; port++) {
    const available = await checkPort(port);
    if (available) {
      return port;
    }
  }
  throw new Error(`No available ports found between ${startPort} and ${maxPort}`);
};


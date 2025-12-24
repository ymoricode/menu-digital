import app from './app.js';
import 'dotenv/config';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🍔 Menu Digital API Server                      ║
║                                                   ║
║   Server running on port ${PORT}                     ║
║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
║                                                   ║
║   API: http://localhost:${PORT}/api                  ║
║   Health: http://localhost:${PORT}/api/health        ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

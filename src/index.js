import 'dotenv/config'
import { createApp } from './server.js';
const PORT = process.env.PORT || 8080;
const { server } = await createApp();
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
process.on('SIGINT', async () => {
    console.log('\n🛑 Gracefully shutting down...');
    try {
        server.close(() => {
            console.log('✅ Shutdown complete.');
            process.exit(0);
        });
    } catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
    }
});
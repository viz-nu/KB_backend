import mongoose from "mongoose";
import 'dotenv/config'
export const initialize = async (retryCount=0) => {
    try {
        if (mongoose.connection.readyState === 1) return; // already connected
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (err) {
        if (retryCount < 5) {  // Set a maximum number of retries
            console.error('Error connecting to MongoDB. Retrying...', err);
            setTimeout(() => connectDB(retryCount + 1), 5000); // Retry after 5 seconds
        } else {
            console.error('Failed to connect to MongoDB after multiple attempts:', err);
            process.exit(1);  // Exit the process after max retries
        }
    }
}

export const closeConnections = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('MongoDB connection closed');
        }
    } catch (error) {
        console.error('Error closing connections:', error);
    }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Received SIGINT, closing connections...');
    await closeConnections();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, closing connections...');
    await closeConnections();
    process.exit(0);
});
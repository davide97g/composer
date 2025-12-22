import "dotenv/config";
import { startServer } from "./server";

// Standalone mode - start server when run directly
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

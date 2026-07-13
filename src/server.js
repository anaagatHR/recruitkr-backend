import "dotenv/config";
import http from 'http';
import socketIo from 'socket.io';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import { autoSeedIfEmpty } from "./seedData.js";
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = socketIo(server, {
    cors: {
          origin: ["https://recruitkr-business-os.vercel.app", "http://localhost:3000", "http://localhost:3001"],
          methods: ["GET", "POST"],
          credentials: true
    },
    transports: ['websocket', 'polling']
});

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    socket.on('disconnect', () => {
          console.log('❌ Client disconnected:', socket.id);
    });
});

// Behind Render's proxy — needed for correct client IPs (rate limiting).
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Global safety net against abuse (AI routes have their own tighter limit).
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Health check
app.get("/", (req, res) => {
  res.json({ name: "RecruitKR API", status: "ok", version: "1.0.0" });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/messages", messageRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(autoSeedIfEmpty)
  .then(() => {
server      console.log(`🚀 RecruitKR API running on port ${PORT}`);
    });
  });

// redeploy trigger: chat routes (messages + ai/chat) — deploy-bab2b0b

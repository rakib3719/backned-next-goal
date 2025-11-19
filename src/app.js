import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mainRouter from "./route/index.js";
import connectDB from "./configure/db.js";
import { webHook } from "./controller/PaymentController.js";

export const app = express();

app.post("/api/webhook", express.raw({ type: "application/json" }), webHook);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://next-goal-dashboard.vercel.app",
    ],
    credentials: true,
  })
);

// app.use(cors({
//   origin: "*"
// }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use("/api", mainRouter);

app.get("/", (req, res) => {
  try {
    res.status(200).send(`
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>🚀 Next Goal API</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code&display=swap');

    body {
      margin: 0;
      padding: 0;
      font-family: 'Fira Code', monospace;
      background: radial-gradient(circle at top left, #0f2027, #203a43, #2c5364);
      color: #00ffcc;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      overflow: hidden;
    }

    .terminal {
      background: #0d0d0d;
      border-radius: 12px;
      box-shadow: 0 0 25px #00ffcc80;
      padding: 40px;
      width: 90%;
      max-width: 750px;
      border: 1px solid #00ffcc40;
      position: relative;
      animation: fadeIn 1.2s ease-out;
    }

    .terminal::before {
      content: '';
      position: absolute;
      top: -10px;
      left: 15px;
      height: 10px;
      width: 10px;
      border-radius: 50%;
      background: #ff5f56;
      box-shadow: 20px 0 #ffbd2e, 40px 0 #27c93f;
    }

    h1 {
      color: #00ffff;
      font-size: 1.8rem;
      margin-bottom: 20px;
    }

    .typewriter {
      font-size: 1rem;
      color: #ffffffcc;
      white-space: nowrap;
      overflow: hidden;
      border-right: 2px solid #00ffcc;
      width: 0;
      animation: typing 3.5s steps(40, end) forwards, blink 0.75s step-end infinite;
    }

    .section {
      margin-top: 25px;
    }

    .label {
      color: #ff00c8;
      margin-bottom: 5px;
      font-weight: bold;
    }

    .code {
      background: #1a1a1a;
      color: #00ffcc;
      padding: 10px;
      border-radius: 5px;
      font-size: 0.95rem;
      overflow-x: auto;
    }

    .footer {
      margin-top: 30px;
      font-size: 0.8rem;
      color: #888;
      text-align: center;
    }

    @keyframes typing {
      from { width: 0 }
      to { width: 100% }
    }

    @keyframes blink {
      50% { border-color: transparent }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div class="terminal">
    <h1>💥 Welcome to the Next Goal Backend API</h1>


    <div class="section">
      <div class="label">🧭 Base URL</div>
      <div class="code">https://next-goal-backend.vercel.app/api</div>
    </div>

  



    <div class="footer">
      Powered by Express + Node JS + JWT + MongoDB Atlas<br>
      © 2025 NextGoal API – Built with ❤️ by Next Goal.
    </div>
  </div>
</body>
</html>

    `);
  } catch (error) {
    res.status(500).send(`
      <h1>Something went wrong!</h1>
      <p>${error.message}</p>
    `);
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// app.listen(3000, '0.0.0.0', () => {
//   console.log('Server running on port 3000');
// });

// // Optional: Add security middleware in production
// if (process.env.NODE_ENV === 'production') {
//   app.use(helmet()); // Security headers
//   app.use(compression()); // Compress responses
// }
connectDB();

// import express from "express";
// import bodyParser from "body-parser";
// import dotenv from "dotenv";
// import morgan from "morgan";
// import cors from "cors";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import routes from "./app.js";
// import multer from "multer";
// import cookieParser from "cookie-parser";
// import './cron/dailyEmailSender.js';
// import deactivateExpiredSubscriptions from './cron/subscriptionDeactivation.js';

// // ✅ Clean up expired subscriptions on startup
// deactivateExpiredSubscriptions();


// dotenv.config();
// const app = express();
// const PORT = process.env.PORT || 3001;

// app.use(cookieParser());

// // ✅ Fix `__dirname` for ES Module
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // ✅ Set absolute path for uploads folder
// // const uploadDir = path.join("./uploads"); // veni
// // ✅ Use existing "uploads" folder (no new folder creation)    


// // ✅ Define `uploadDir` correctly
// const uploadDir = path.join(__dirname, "uploads");

// // ✅ Ensure "uploads" folder exists
// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true }); // ✅ Create if not exists
//     console.log("✅ Uploads folder created!");
// } else {
//     console.log("✅ Uploads folder exists!");
// }


// // ✅ Serve static files from "uploads" folder
// app.use("/uploads", express.static(uploadDir));

// // ✅ Multer Configuration for Multiple File Uploads
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, uploadDir); // ✅ Use the existing "uploads" folder
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname)); // ✅ Unique filename
//     }
// });

// const upload = multer({ storage: storage });

// // ✅ Proper CORS Configuration
// // app.use(
// //     cors({
// //         origin: "*", // Sabhi origins allowed hain
// //         methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // ✅ Specific HTTP methods allow kar rahe hain
// //         allowedHeaders: ["Content-Type", "Authorization"], // ✅ Required headers allow karein
// //         credentials: true, // ✅ Agar cookies allow karni hain
// //     })
// // );


// // ✅ ================= CORS FIX =================
// app.use(cors({
//     origin: "https://smartlifeacademy.io", // ✅ your frontend
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true
// }));

// // ✅ Handle preflight requests (VERY IMPORTANT)
// app.options("*", cors({
//     origin: "https://smartlifeacademy.io",
//     credentials: true
// }));
// // ✅ ===========================================

// app.use(morgan("dev"));
// app.use(bodyParser.json({ limit: "50mb" }));
// app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
// app.use(cookieParser());

// app.use(routes);

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });


import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import routes from "./app.js";
import multer from "multer";
import cookieParser from "cookie-parser";
import './cron/dailyEmailSender.js';
import deactivateExpiredSubscriptions from './cron/subscriptionDeactivation.js';

// ✅ Clean up expired subscriptions on startup
deactivateExpiredSubscriptions();

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cookieParser());

// ✅ Fix __dirname for ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Upload folder path
const uploadDir = path.join(__dirname, "uploads");

// ✅ Ensure uploads folder exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("✅ Uploads folder created!");
} else {
    console.log("✅ Uploads folder exists!");
}

// ✅ Serve static files
app.use("/uploads", express.static(uploadDir));

// ✅ Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// ✅ ================= CORS FIX =================
const allowedOrigins = [
    "http://localhost:5173",
    "https://smartlifeacademy.io"
];

// 🔥 reusable config
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

// ✅ Apply CORS
app.use(cors(corsOptions));

// ✅ Preflight FIX (same config use karna hai)
app.options("*", cors(corsOptions));
// ✅ ===========================================

app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// ❌ duplicate hata diya (upar already use hai)
// app.use(cookieParser());

app.use(routes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

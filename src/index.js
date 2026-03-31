import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.route.js";
import fundraiserRouter from "./routes/fundraiser.route.js";
import "./utils/cron.js";
import userRouter from "./routes/user.route.js";
import adminRouter from "./routes/admin.route.js";
import publicRouter from "./routes/public.route.js";
import { authMiddleware } from "./middleware/auth.middleware.js";
import { roleMiddleware } from "./middleware/role.middleware.js";

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: ["https://cassiority.miraeecode.my.id", "http://localhost:5173"], // Whitelist specific domains
  credentials: true, // Enable passing of cookies/authentication headers
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // Specify allowed methods
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"], // Specify allowed headers
};

BigInt.prototype.toJSON = function () {
  return this.toString();
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/public", publicRouter);
app.use("/api/auth", authRouter);

app.use(authMiddleware);
app.use("/api", userRouter);
app.use("/api/admin", roleMiddleware("admin"), adminRouter);
app.use("/api/fundraiser", roleMiddleware("fundraiser"), fundraiserRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

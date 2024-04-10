import express, { Express, Request, Response } from 'express';
import dotenv from "dotenv";
import cors from 'cors';

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
console.log(`isProduction: ${isProduction}`);

const app: Express = express();
const port = process.env.PORT || 3001;


function useAuthUser(req: Request, res: Response) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  return userId as string;
}

app.use(cors({
  // origin: process.env.FRONTEND_URL || 'http://localhost:3000'
  origin: "*"
}));

app.use(express.json()); // for parsing application/json

// log all requests
app.use((req, res, next) => {
  console.log(`[${req.method}]: ${req.path}`);
  next();
});


app.get("/", (req: Request, res: Response) => {
  res.send(`Hello, world! ${isProduction ? "Production" : "Development"}`);
});

app.post("/test", (req: Request, res: Response) => {
  const body = req.body;
  const user = useAuthUser(req, res);
  if (!user) return; // unauthorized
  
  res.json({
    message: "Hello, world!",
    echo: body,
    meta: "This is a test endpoint. bloep blap bloop.\nYou are authorized.",
    userId: user,
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
import express, { Express, Request, Response } from 'express';
import dotenv from "dotenv";
import cors from 'cors';

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
console.log(`isProduction: ${isProduction}`);

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: "*"
}));

app.use(express.json());


app.get("/", (req: Request, res: Response) => {
  const ip = req.ip;
  res.send(`Hello, ${ip}`);
});

app.post("/test", (req: Request, res: Response) => {
  const body = req.body;
  
  console.log(body);

  res.json({
    message: "Hello, world!",
    data: body
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
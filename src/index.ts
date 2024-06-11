import express, { Express, Request, Response } from 'express';
import dotenv from "dotenv";
import cors from 'cors';
import CassandraService from './services/cassandraService';
import RabbitMQService from './services/rabbitmq';

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
console.log(`isProduction: ${isProduction}`);


const kubernetescontactpoints = [
  'pixelchat-cassandra-0.pixelchat-cassandra.default.svc.cluster.local',
  'pixelchat-cassandra-1.pixelchat-cassandra.default.svc.cluster.local',
  'pixelchat-cassandra-2.pixelchat-cassandra.default.svc.cluster.local',
]

const contactpoints = process.env.CASSANDRA_CONTACT_POINTS?.split(',') || kubernetescontactpoints;

const cassandraService = new CassandraService(contactpoints);

if (!process.env.RABBITMQ_HOST || !process.env.RABBITMQ_USER || !process.env.RABBITMQ_PASS) {
  console.error('RabbitMQ credentials not set!')
}

const rabbitMQService = new RabbitMQService(
  process.env.RABBITMQ_HOST as string,
  process.env.RABBITMQ_USER as string,
  process.env.RABBITMQ_PASS as string,
);

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
  const messagesTest = cassandraService.getDMmessages("1", "2", 10);
  res.send(`Hello, world! ${isProduction ? "Production" : "Development"}\n\n\n${JSON.stringify(messagesTest)}`);
});

app.post("/dm", async (req: Request, res: Response) => {
  const body = req.body;
  const user = useAuthUser(req, res);
  if (!user) return; // unauthorized

  const message = body.message;
  const receiver_id = body.receiver_id;

  if (!message || !receiver_id) {
    res.status(400).json({ message: "Invalid request" });
    return;
  }

  const sendmessage = await cassandraService.insertDmMessage({
    sender_id: user,
    receiver_id: receiver_id,
    message: message,
  });

  res.status(200).json({ message: "Message sent" });
});

app.delete("/dm/:message_id", async (req: Request, res: Response) => {
  const message_id = req.params.message_id;
  const user = useAuthUser(req, res);
  if (!user) return; // unauthorized

  const receiver_id = req.query.receiver_id as string;
  const created_at = req.query.created_at as string;

  if (!message_id || !receiver_id || !created_at) {
    res.status(400).json({ message: "Invalid request" });
    return;
  }
  
  const deleteMessage = await cassandraService.deleteDmMessage(message_id, user, receiver_id, new Date(created_at));

  res.status(200).json({ message: "Message deleted", res: deleteMessage });	
});

app.post("/group", async (req: Request, res: Response) => {
  const body = req.body;
  const user = useAuthUser(req, res);
  if (!user) return; // unauthorized

  const message = body.message;
  const group_id = body.group_id;

  if (!message || !group_id) {
    res.status(400).json({ message: "Invalid request" });
    return;
  }

  const sendmessage = await cassandraService.insertGroupMessage({
    sender_id: user,
    group_id: group_id,
    message: message,
  });

  res.status(200).json({ message: "Message sent" });
});

app.get("/dm/:receiver_id", async (req: Request, res: Response) => {
  const receiver_id = req.params.receiver_id;
  const user = useAuthUser(req, res);
  if (!user) return; // unauthorized

  const messages = await cassandraService.getDMmessages(user, receiver_id);

  const you = await cassandraService.getUserInfoById(user);
  const other = await cassandraService.getUserInfoById(receiver_id);
  
  res.json({
    messages: messages.messages,
    nextPageStates: messages.nextPageStates,
    users: {
      you: you,
      other: other,
    }
  });
});

app.get("/group/:group_id", async (req: Request, res: Response) => {
  const group_id = req.params.group_id;
  const user = useAuthUser(req, res);
  if (!user) return; // unauthorized

  // convert group_id to number
  const group = parseInt(group_id);

  const messages = await cassandraService.getGroupMessages(group);

  res.json(messages);
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

rabbitMQService.startConsuming(async (msg)  => {
  console.log(`Received message: ${msg}`);
  let message;

  try {
    message = JSON.parse(msg);
  }
  catch (e) {
    console.error(`Invalid message received: ${msg}`);
    return;
  }

  const action: "delete" | "update" | "deleteAll" | undefined = message.action;
  if (!action) {
    throw new Error(`Invalid message received: ${msg}`);
  }
  
  if (action === "delete") {
    if (!message.userId) {
      throw new Error(`Delete message received without userId: ${msg}`);
    }
  }
  if (action === "update") {
    if (!message.user) {
      throw new Error(`Update message received without user: ${msg}`);
    }

    const user = message.user;

    if (!user.id || !user.name || !user.nickname || !user.picture) {
      throw new Error(`Update message received with invalid user: ${msg}`);
    }
  
    await cassandraService.InsertOrUpdateUserInfo(
      user.id,
      user.name,
      user.nickname,
      user.picture
    );
  }
});


const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});


export { app, server }

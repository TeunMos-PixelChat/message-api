import client, { Connection, Channel, ConsumeMessage } from "amqplib";
// https://hassanfouad.medium.com/using-rabbitmq-with-nodejs-and-typescript-8b33d56a62cc
export default class RabbitMQService {
  connection!: Connection;
  channel!: Channel;

  connString: string;

  queue: string = "user-update";

  constructor(private host: string, user: string, pass: string) {
    this.connString = `amqp://${user}:${pass}@${host}:5672`
  }

  async connect() {
    console.log("Connecting to RabbitMQ");

    this.connection = await client.connect(this.connString);

    console.log("Connected to RabbitMQ");

    this.channel = await this.connection.createChannel();
  }

  async startConsuming(callback: (msg: string) => Promise<void>, queue: string = this.queue) {
    if (!this.channel) {
      await this.connect();
    }


    await this.channel.assertQueue(queue, { durable: true });

    this.channel.consume(
      this.queue,
      (msg) => {
        {
          if (!msg) {
            return console.error(`Invalid incoming message`);
          }
          callback(msg?.content?.toString());
          this.channel.ack(msg);
        }
      },
      {
        noAck: false,
      }
    );
  }

  
}
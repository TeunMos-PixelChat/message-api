import cassandra, { ClientOptions, QueryOptions } from 'cassandra-driver';
import { DirectChatMessage, GroupChatMessage } from '../typings/cassandraModels';

export default class CassandraService {
  private client: cassandra.Client;

  constructor(contactPoints: ClientOptions['contactPoints']) {
    this.client = new cassandra.Client({
      contactPoints: contactPoints,
      localDataCenter: 'DC1-pixelchatCassandra',
      keyspace: 'pixelchat_message',
    });
  }


  async insertDmMessage(message: DirectChatMessage) {
    const query = `INSERT INTO pixelchat_message.direct_chat_messages (
      id, sender_id, receiver_id, message, created_at, updated_at
    ) VALUES (?, ?, ?, ?, toTimestamp(now()), toTimestamp(now()))`;

    message.id = cassandra.types.Uuid.random();
    
    const queryparams = [
      message.id,
      message.sender_id,
      message.receiver_id,
      message.message,
    ];

    return this.client.execute(query, queryparams, { prepare: true });
  }

  async deleteAllDmMessages(user1: string, user2: string) {
    const query = `DELETE FROM pixelchat_message.direct_chat_messages 
      WHERE sender_id = ? AND receiver_id = ?`

    const queryparams1 = [user1, user2];
    const queryparams2 = [user2, user1];

    return Promise.all([
      this.client.execute(query, queryparams1, { prepare: true }),
      this.client.execute(query, queryparams2, { prepare: true }),
    ]);
  }

  async deleteDmMessage(messageId: string, userId: string) {
    const query = `DELETE FROM pixelchat_message.direct_chat_messages 
      WHERE id = ? AND (sender_id = ? OR receiver_id = ?)`;

    const queryparams = [messageId, userId, userId];

    return this.client.execute(query, queryparams, { prepare: true });
  }


  async getDMmessages(
    user1: string, user2: string, 
    limit: number = 100, pageStates: { user1: string, user2: string } | undefined = undefined
  ) {
    const query1 = `SELECT * FROM pixelchat_message.direct_chat_messages 
    WHERE sender_id = ? AND receiver_id = ? order by created_at desc limit ?`;

    const query2 = `SELECT * FROM pixelchat_message.direct_chat_messages 
      WHERE sender_id = ? AND receiver_id = ? order by created_at desc limit ?`;

    const queryparams1 = [user1, user2, Math.floor(limit/2)];
    const queryparams2 = [user2, user1, Math.floor(limit/2)];

    const options1: QueryOptions = { prepare: true, fetchSize: limit, pageState: pageStates?.user1};
    const options2: QueryOptions = { prepare: true, fetchSize: limit, pageState: pageStates?.user2 };

    const messages1 = await this.client.execute(query1, queryparams1, options1);
    const messages2 = await this.client.execute(query2, queryparams2, options2);

    const combinedMessages = messages1.rows.concat(messages2.rows) as unknown as DirectChatMessage[];
    
    const messages = combinedMessages.sort((a, b) => {
      return b.created_at!.getTime() - a.created_at!.getTime();
    });

    return { messages, nextPageStates: { user1: messages1.pageState, user2: messages2.pageState } };
  }


  async insertGroupMessage(message: GroupChatMessage) {
    const query = `INSERT INTO pixelchat_message.group_chat_messages (
      id, group_id, sender_id, message, created_at, updated_at
    ) VALUES (?, ?, ?, ?, toTimestamp(now()), toTimestamp(now()))`;

    message.id = cassandra.types.Uuid.random();
    
    const queryparams = [
      message.id,
      message.group_id,
      message.sender_id,
      message.message,
    ];

    return this.client.execute(query, queryparams, { prepare: true });
  }

  async deleteGroupMessage(messageId: string, userId: string) {
    const query = `DELETE FROM pixelchat_message.group_chat_messages 
      WHERE id = ? AND sender_id = ?`;

    const queryparams = [messageId, userId];

    return this.client.execute(query, queryparams, { prepare: true });
  }

  async getGroupMessages(group_id: number, limit = 100, pageState: string | undefined = undefined) {
    const query = `SELECT * FROM pixelchat_message.group_chat_messages 
      WHERE group_id = ? order by created_at desc limit ?`;
    
    const queryparams = [group_id, limit];

    const options: QueryOptions = { prepare: true, fetchSize: limit, pageState: pageState };
    const messages = await this.client.execute(query, queryparams, options);

    return messages.rows as unknown as GroupChatMessage[];
  }
}
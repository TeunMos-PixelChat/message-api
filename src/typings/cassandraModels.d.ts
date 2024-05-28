// -- Create a keyspace
// CREATE KEYSPACE IF NOT EXISTS pixelchat_message WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : '1' };

import { types } from 'cassandra-driver'


export type DirectChatMessage = {
  id?: types.Uuid;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at?: Date;
  updated_at?: Date;
};

export type GroupChatMessage = {
  id?: types.Uuid;
  group_id: number;
  sender_id: string;
  message: string;
  created_at?: Date;
  updated_at?: Date;
};

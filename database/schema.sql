-- Create a keyspace
CREATE KEYSPACE IF NOT EXISTS pixelchat_message WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : '1' };


-- UserInfo table
CREATE TABLE IF NOT EXISTS pixelchat_message.user_info (
    id varchar,
    name varchar,
    nickname varchar,
    picture varchar,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (id)
);

-- DirectChatMessages table
CREATE TABLE IF NOT EXISTS pixelchat_message.direct_chat_messages (
    id uuid,
    sender_id varchar,
    receiver_id varchar,
    message TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY ((sender_id, receiver_id), created_at)
) WITH CLUSTERING ORDER BY (created_at DESC);

-- GroupChatMessages table
CREATE TABLE IF NOT EXISTS pixelchat_message.group_chat_messages (
    id uuid,
    group_id int,
    sender_id varchar,
    message TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY ((group_id), created_at)
) WITH CLUSTERING ORDER BY (created_at DESC);


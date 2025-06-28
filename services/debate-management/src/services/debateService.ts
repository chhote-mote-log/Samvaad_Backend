import { PrismaClient, DebateStatus } from '@prisma/client';
import { kafkaProducer } from './kafkaService'; // assume this is your Kafka wrapper
import { sendToMatchmakingQueue } from '../kafka/producer';
const prisma = new PrismaClient();

export async function createDebate(data: any) {
  if (!data.title || !data.created_by) {
    throw new Error('Title and created_by are required');
  }

  const debate = await prisma.debate.create({
    data: {
      title: data.title,
      topic: data.topic || 'The future of AI',
      type: data.type || 'PROFESSIONAL',
      mode: data.mode || 'TEXT',
      chat_enabled: data.chat_enabled ?? true,
      visibility: data.visibility || 'PUBLIC',
      duration_minutes: data.duration_minutes || 15,
      ai_moderation: data.ai_moderation ?? true,
      created_by: data.created_by,
      status: data.status || DebateStatus.WAITING,
      xp_reward: data.xp_reward || 100,
      tags: data.tags || ['ai', 'future'],
      language: data.language || 'en',
    },
  });

  return debate;
}

export async function getDebateById(id: string) {
  return await prisma.debate.findUnique({
    where: { id },
  });
}

export async function startDebate(id: string) {
  const debate = await getDebateById(id);
  if (!debate) throw new Error('Debate not found');
  if (debate.status !== DebateStatus.WAITING) {
    throw new Error('Debate cannot be started (wrong status)');
  }

  // If you're tracking participants in another service, replace this check
  // with a call to the Participant Service.
  // Placeholder validation here:
  // if (debate.participants.length < 2) throw new Error('Not enough participants');

  const updated = await prisma.debate.update({
    where: { id },
    data: {
      status: DebateStatus.ACTIVE,
      started_at: new Date(),
    },
  });

  // Send Kafka event
  await kafkaProducer.send({
    topic: 'debate.started',
    messages: [
      {
        key: id,
        value: JSON.stringify({
          debateId: id,
          settings: {
            mode: debate.mode,
            duration: debate.duration_minutes,
            chatEnabled: debate.chat_enabled,
          },
        }),
      },
    ],
  });

  return updated;
}
export async function requestMatchmaking(user: any) {
  // You could add DB logic here
  console.log('[ENQUEUE MATCHMAKING]', user);
  await sendToMatchmakingQueue(user);
}

export async function endDebate(id: string) {
  const debate = await getDebateById(id);
  if (!debate) throw new Error('Debate not found');
  if (debate.status !== DebateStatus.ACTIVE) {
    throw new Error('Only active debates can be ended');
  }

  const updated = await prisma.debate.update({
    where: { id },
    data: {
      status: DebateStatus.ENDED,
      ended_at: new Date(),
    },
  });

  // Optionally: send Kafka event
  await kafkaProducer.send({
    topic: 'debate.ended',
    messages: [
      {
        key: id,
        value: JSON.stringify({ debateId: id }),
      },
    ],
  });

  return updated;
}

export async function updateDebateConfig(id: string, data: any) {
  const allowedFields = [
    'title',
    'topic',
    'type',
    'mode',
    'chat_enabled',
    'visibility',
    'duration_minutes',
    'xp_reward',
    'language',
    'tags',
    'ai_moderation',
  ];

  const updateData: Record<string, any> = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  const updated = await prisma.debate.update({
    where: { id },
    data: updateData,
  });

  return updated;
}
export async function createDebateFromMatch(payload: {
  users: string[];
  title?: string;
  debateType: string;
  mode: string;
  timestamp: number;    
  visibility?: string;
  created_by?: string;
  duration_minutes?: number;
  chat_enabled?: boolean;
  ai_moderation?: boolean;
  language?: string; // Optional, default is "en" 
}) {
  
  const data = {
    title: payload.title || "Untitled Debate",
    topic: "Auto-generated from Match",
    type: payload.debateType || "PROFESSIONAL",
    mode: payload.mode || "TEXT",
    visibility: payload.visibility || "PUBLIC",
    created_by: payload.created_by || payload.users[0], // Fallback
    duration_minutes: payload.duration_minutes || 15,
    chat_enabled: payload.chat_enabled ?? true,
    ai_moderation: payload.ai_moderation ?? true,
    status: DebateStatus.WAITING,
    xp_reward: 100,
    tags: ["auto", "match"],
    language: "en",
  };
  const existingDebate = await prisma.debate.findFirst({
  where: {
    participants: {
      some: {
        user_id: payload.users[0],
      },
    },
    status: 'ONGOING',
  },
});
if (existingDebate) {
  console.warn("⚠️ Debate already exists for users:", payload.users);
  return;
}
  console.log("[CREATE DEBATE FROM MATCH]", data);
  const debate = await prisma.debate.create({ data });
   const sessionId = `${debate.id}-${Date.now()}`;
  // TODO: You can emit debate.created event here

  return {debate, sessionId};
}


export async function listDebates(
  page = 1,
  limit = 10,
  status?: string
) {
  const skip = (page - 1) * limit;

  const whereClause = status ? { status } : {};

  const debates = await prisma.debate.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: { created_at: 'desc' },
  });

  return debates;
}

export async function deleteDebate(id: string) {
  const debate = await getDebateById(id);
  if (!debate) {
    throw new Error('Debate not found');
  }

  // Optional: prevent deletion of debates that already started or ended
  if (debate.status === DebateStatus.ACTIVE || debate.status === DebateStatus.ENDED) {
    throw new Error('Cannot delete an active or ended debate');
  }

  const deleted = await prisma.debate.delete({
    where: { id },
  });

  // Optionally emit Kafka event
  await kafkaProducer.send({
    topic: 'debate.deleted',
    messages: [
      {
        key: id,
        value: JSON.stringify({ debateId: id }),
      },
    ],
  });

  return deleted;
}

export async function getDebatesByUser(userId: string) {
  return await prisma.debate.findMany({
    where: {
      created_by: userId
    },
    orderBy: {
      created_at: 'desc'
    }
  });
}
-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "participantName" TEXT,
    "isAutoReplyOn" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "igMessageId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isFromBot" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "systemPrompt" TEXT NOT NULL DEFAULT 'You are a helpful assistant responding to Instagram DMs. Be friendly, concise, and helpful.',
    "isGloballyActive" BOOLEAN NOT NULL DEFAULT true,
    "maxHistoryLength" INTEGER NOT NULL DEFAULT 15,
    "model" TEXT NOT NULL DEFAULT 'google/gemini-2.0-flash-001',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_participantId_key" ON "Conversation"("participantId");

-- CreateIndex
CREATE INDEX "Conversation_participantId_idx" ON "Conversation"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_igMessageId_key" ON "Message"("igMessageId");

-- CreateIndex
CREATE INDEX "Message_conversationId_timestamp_idx" ON "Message"("conversationId", "timestamp");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

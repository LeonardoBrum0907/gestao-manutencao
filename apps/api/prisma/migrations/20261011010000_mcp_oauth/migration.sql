-- Login OAuth do servidor MCP: clientes que se registram sozinhos e as chaves entregues a eles.

-- CreateTable
CREATE TABLE "McpClient" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "McpClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McpToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "scopes" TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "McpToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "McpToken_tokenHash_key" ON "McpToken"("tokenHash");

-- CreateIndex
CREATE INDEX "McpToken_clientId_idx" ON "McpToken"("clientId");

-- CreateIndex
CREATE INDEX "McpToken_expiresAt_idx" ON "McpToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "McpToken" ADD CONSTRAINT "McpToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "McpClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

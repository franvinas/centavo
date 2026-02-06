-- Rename tables to plural snake_case
ALTER TABLE "Account" RENAME TO "accounts";
ALTER TABLE "Session" RENAME TO "sessions";
ALTER TABLE "VerificationToken" RENAME TO "verification_tokens";
ALTER TABLE "User" RENAME TO "users";
ALTER TABLE "Category" RENAME TO "categories";
ALTER TABLE "Expense" RENAME TO "expenses";
ALTER TABLE "TelegramMessage" RENAME TO "telegram_messages";
ALTER TABLE "TelegramLinkToken" RENAME TO "telegram_link_tokens";

-- Rename columns to snake_case
ALTER TABLE "accounts" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "accounts" RENAME COLUMN "providerAccountId" TO "provider_account_id";

ALTER TABLE "sessions" RENAME COLUMN "sessionToken" TO "session_token";
ALTER TABLE "sessions" RENAME COLUMN "userId" TO "user_id";

ALTER TABLE "users" RENAME COLUMN "emailVerified" TO "email_verified";
ALTER TABLE "users" RENAME COLUMN "baseCurrency" TO "base_currency";
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "users" RENAME COLUMN "telegramChatId" TO "telegram_chat_id";

ALTER TABLE "categories" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "categories" RENAME COLUMN "createdAt" TO "created_at";

ALTER TABLE "expenses" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "expenses" RENAME COLUMN "baseAmount" TO "base_amount";
ALTER TABLE "expenses" RENAME COLUMN "exchangeRate" TO "exchange_rate";
ALTER TABLE "expenses" RENAME COLUMN "categoryId" TO "category_id";
ALTER TABLE "expenses" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "expenses" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "telegram_messages" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "telegram_messages" RENAME COLUMN "toolCalls" TO "tool_calls";
ALTER TABLE "telegram_messages" RENAME COLUMN "toolCallId" TO "tool_call_id";
ALTER TABLE "telegram_messages" RENAME COLUMN "createdAt" TO "created_at";

ALTER TABLE "telegram_link_tokens" RENAME COLUMN "chatId" TO "user_id";
ALTER TABLE "telegram_link_tokens" RENAME COLUMN "expiresAt" TO "expires_at";
ALTER TABLE "telegram_link_tokens" RENAME COLUMN "createdAt" TO "created_at";

-- Rename primary key constraints
ALTER TABLE "accounts" RENAME CONSTRAINT "Account_pkey" TO "accounts_pkey";
ALTER TABLE "sessions" RENAME CONSTRAINT "Session_pkey" TO "sessions_pkey";
ALTER TABLE "users" RENAME CONSTRAINT "User_pkey" TO "users_pkey";
ALTER TABLE "categories" RENAME CONSTRAINT "Category_pkey" TO "categories_pkey";
ALTER TABLE "expenses" RENAME CONSTRAINT "Expense_pkey" TO "expenses_pkey";
ALTER TABLE "telegram_messages" RENAME CONSTRAINT "TelegramMessage_pkey" TO "telegram_messages_pkey";
ALTER TABLE "telegram_link_tokens" RENAME CONSTRAINT "TelegramLinkToken_pkey" TO "telegram_link_tokens_pkey";

-- Rename unique and secondary indexes
ALTER INDEX "Account_provider_providerAccountId_key" RENAME TO "accounts_provider_provider_account_id_key";
ALTER INDEX "Session_sessionToken_key" RENAME TO "sessions_session_token_key";
ALTER INDEX "VerificationToken_token_key" RENAME TO "verification_tokens_token_key";
ALTER INDEX "VerificationToken_identifier_token_key" RENAME TO "verification_tokens_identifier_token_key";
ALTER INDEX "User_email_key" RENAME TO "users_email_key";
ALTER INDEX "User_telegramChatId_key" RENAME TO "users_telegram_chat_id_key";
ALTER INDEX "Category_userId_idx" RENAME TO "categories_user_id_idx";
ALTER INDEX "Category_userId_name_key" RENAME TO "categories_user_id_name_key";
ALTER INDEX "Expense_userId_date_idx" RENAME TO "expenses_user_id_date_idx";
ALTER INDEX "Expense_userId_categoryId_idx" RENAME TO "expenses_user_id_category_id_idx";
ALTER INDEX "TelegramMessage_userId_createdAt_idx" RENAME TO "telegram_messages_user_id_created_at_idx";
ALTER INDEX "TelegramLinkToken_token_key" RENAME TO "telegram_link_tokens_token_key";
ALTER INDEX "TelegramLinkToken_chatId_key" RENAME TO "telegram_link_tokens_user_id_key";

-- Rename foreign key constraints
ALTER TABLE "accounts" RENAME CONSTRAINT "Account_userId_fkey" TO "accounts_user_id_fkey";
ALTER TABLE "sessions" RENAME CONSTRAINT "Session_userId_fkey" TO "sessions_user_id_fkey";
ALTER TABLE "categories" RENAME CONSTRAINT "Category_userId_fkey" TO "categories_user_id_fkey";
ALTER TABLE "expenses" RENAME CONSTRAINT "Expense_userId_fkey" TO "expenses_user_id_fkey";
ALTER TABLE "expenses" RENAME CONSTRAINT "Expense_categoryId_fkey" TO "expenses_category_id_fkey";
ALTER TABLE "telegram_messages" RENAME CONSTRAINT "TelegramMessage_userId_fkey" TO "telegram_messages_user_id_fkey";

-- Ensure all link tokens reference valid users before adding FK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "telegram_link_tokens" tlt
    LEFT JOIN "users" u ON u.id = tlt.user_id
    WHERE u.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add FK telegram_link_tokens.user_id -> users.id: orphan rows found';
  END IF;
END $$;

ALTER TABLE "telegram_link_tokens"
ADD CONSTRAINT "telegram_link_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

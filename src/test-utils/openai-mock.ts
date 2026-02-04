import { vi } from "vitest";

interface MockToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface MockChoice {
  message: {
    role: "assistant";
    content: string | null;
    tool_calls?: MockToolCall[];
  };
}

export function createMockOpenAI() {
  const createMock = vi.fn();

  const mock = {
    chat: {
      completions: {
        create: createMock,
      },
    },
  };

  return { mock, createMock };
}

export function mockChatResponse(content: string): { choices: MockChoice[] } {
  return {
    choices: [
      {
        message: {
          role: "assistant",
          content,
          tool_calls: undefined,
        },
      },
    ],
  };
}

export function mockToolCallResponse(
  toolCalls: MockToolCall[],
  content: string | null = null,
): { choices: MockChoice[] } {
  return {
    choices: [
      {
        message: {
          role: "assistant",
          content,
          tool_calls: toolCalls,
        },
      },
    ],
  };
}

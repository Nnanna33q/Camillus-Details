export type TConversation = {
    sessionId: string,
    messages: { user: string, llm: string }[],
    summary: string
}
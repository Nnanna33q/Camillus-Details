export type TConversation = {
    sessionId: string,
    messages: { user: string, llm: string }[],
    summary: string
}

export type TBookingStep = undefined | 'confirmation' | 'data collection';

export type TState = 'general_question' | 'booking_request';

export type TBookingInfo = {
    name: string,
    email: string,
    service: string,
    time: string,
    vehicle: string
}

export type TMessage = {
    id: number,
    role: string,
    content: string,
    loadingState: boolean;
}
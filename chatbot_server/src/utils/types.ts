export type TBookingStep = 'unset' | 'confirmation' | 'data collection';

export type TMessage = {
    id: number,
    role: string,
    content: string,
    loadingState: boolean;
}

export type TConversation = {
    _id: string,
    messages: { user: string, llm: string }[],
    summary: string,
    bookingStep: TBookingStep
}
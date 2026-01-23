import type { Dispatch, SetStateAction } from "react";

export type TMessage = {
    id: number,
    role: string,
    content: string,
    loadingState: boolean;
}

export type TGetMessages = (setChatMessages: Dispatch<SetStateAction<TMessage[] | null>>, setIsLoadingMessages: Dispatch<SetStateAction<boolean>>, setMessagesError: Dispatch<SetStateAction<{
    error: boolean;
    errorMessage: string;
}>>) => Promise<void>
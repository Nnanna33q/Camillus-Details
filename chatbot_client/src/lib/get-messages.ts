class ChatError extends Error { };
import type { Dispatch, SetStateAction } from "react";

type TMessage = {
    id: number,
    role: string,
    content: string,
    loadingState: boolean;
}

export async function getMessages(setChatMessages: Dispatch<SetStateAction<TMessage[] | null>>, setIsLoadingMessages: Dispatch<SetStateAction<boolean>>, setMessagesError: Dispatch<SetStateAction<{ error: boolean, errorMessage: string }>>) {
    try {
        const response = await fetch(window.location.origin === 'http://localhost:5173' ? 'http://localhost:4000/messages' : 'https://camillus-details-chat.onrender.com/messages', { credentials: 'include' });
        const data = await response.json();
        if (!data.success) throw new ChatError(data.errorMessage);
        setChatMessages(data.messages);
        setMessagesError({ error: true, errorMessage: 'An error occurred' });
    } catch (error) {
        console.error(error);
        setChatMessages(null);
        if(error instanceof ChatError) return setMessagesError({ error: true, errorMessage: error.message });
        if(error instanceof Error) return setMessagesError({ error: true, errorMessage: 'Something went wrong. Please check your connection and try again.' });
        return setMessagesError({ error: true, errorMessage: 'An unexpected error occurred' });

    }
    setIsLoadingMessages(false);
}
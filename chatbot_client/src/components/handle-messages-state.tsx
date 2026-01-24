import { ChatContainerContent } from "./chat_container";
import { Message, MessageContent } from "./message";
import { cn } from "@/lib/utils";
import { Loader } from "./loader";
import { RotateCw } from "lucide-react";
import { Button } from "./ui/button";
import type { TMessage, TGetMessages } from "@/lib/types";
import type { Dispatch, SetStateAction } from "react";

function AssistantMessage({ content, loadingState }: { content: string, loadingState: boolean | undefined }) {
    return loadingState ? (<Loader />) : (
        <div className="group flex w-full flex-col gap-0">
            <MessageContent
                className="text-foreground prose w-full flex-1 rounded-lg bg-transparent p-0"
                markdown
            >
                {content}
            </MessageContent>

        </div>
    )
}

export default function HandleMessagesState({ chatMessages, setChatMessages, isLoadingMessages, setIsLoadingMessages, messagesError, setMessagesError, getMessages }: { 
    chatMessages: TMessage[] | null,
    setChatMessages: Dispatch<SetStateAction<TMessage[] | null>>,
    isLoadingMessages: boolean,
    setIsLoadingMessages: Dispatch<SetStateAction<boolean>>,
    messagesError: { error: boolean, errorMessage: string },
    setMessagesError: Dispatch<SetStateAction<{ error: boolean, errorMessage: string }>>,
    getMessages: TGetMessages
 }) {

    if (!chatMessages) {
        return <ChatContainerContent className="absolute w-[100vw] h-[100vh] top-0 left-0 flex flex-col items-center justify-center gap-y-4 px-4 text-center">
            <div className="text-xl text-accent">
                {messagesError.errorMessage}
            </div>
            <Button onClick={() => getMessages(setChatMessages, setIsLoadingMessages, setMessagesError)} className="ring rounded-none bg-white text-primary gap-1 hover:bg-secondary">
                <span className="font-semibold">Retry</span> <RotateCw />
            </Button>
        </ChatContainerContent>
    }

    if (chatMessages.length === 0 && !isLoadingMessages) {
        return <ChatContainerContent className="absolute w-[100vw] h-[100vh] top-0 left-0 flex items-center justify-center">
            <div className="text-xl text-secondary">
                How can we help you today?
            </div>
        </ChatContainerContent>
    }

    if (chatMessages.length > 1) {
        return (
            <ChatContainerContent className="space-y-12 px-4 py-12">
                {chatMessages.map((message) => {
                    const isAssistant = message.role === "assistant"

                    return (
                        <Message
                            key={message.id}
                            className={cn(
                                "mx-auto flex w-full max-w-3xl flex-col gap-2 px-0 md:px-6",
                                isAssistant ? "items-start" : "items-end"
                            )}
                        >
                            {isAssistant ? (
                                <AssistantMessage content={message.content} loadingState={message.loadingState} />
                            ) : (
                                <div className="group flex flex-col items-end gap-1 w-full">
                                    <MessageContent className="bg-muted text-primary max-w-[85%] rounded-3xl px-5 py-2.5 sm:max-w-[75%]">
                                        {message.content}
                                    </MessageContent>
                                </div>
                            )}
                        </Message>
                    )
                })}
            </ChatContainerContent>)
    }

    return <ChatContainerContent><div></div></ChatContainerContent>
}
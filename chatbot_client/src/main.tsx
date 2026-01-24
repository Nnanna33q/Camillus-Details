import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css';
import Header from './components/header';
import {
  ChatContainerRoot,
} from "@/components/chat_container"
import {
  PromptInput,
  PromptInputTextarea,
} from "@/components/prompt-input"
import { Button } from "@/components/ui/button"
import {
  ArrowUp,
} from "lucide-react"
import { useState } from "react"
import { ScrollButton } from './components/scroll-button';
import { getMessages } from './lib/get-messages';
import HandleMessagesState from './components/handle-messages-state';

class ChatError extends Error { };

type TMessage = {
  id: number,
  role: string,
  content: string,
  loadingState: boolean;
}

function ConversationPromptInput() {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<TMessage[] | null>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [messagesError, setMessagesError] = useState({ error: false, errorMessage: '' });

  useEffect(() => {
    getMessages(setChatMessages, setIsLoadingMessages, setMessagesError);
  }, [])

  const handleSubmit = async () => {
    if (!prompt.trim()) return
    if(!chatMessages) return

    setPrompt("")
    setIsLoading(true)

    // Add user and assistant messages immediately
    const newUserMessage = {
      id: chatMessages.length + 1,
      role: "user",
      content: prompt.trim(),
      loadingState: false
    }

    const newAssistantMessage = {
      id: chatMessages.length + 2,
      role: "assistant",
      content: '',
      loadingState: true
    }

    setChatMessages([...chatMessages, newUserMessage, newAssistantMessage])

    try {
      const id = localStorage.getItem('id');
      const response = await fetch(window.location.origin === 'http://localhost:5173' ? 'http://localhost:4000/' : 'https://camillus-details-chat.onrender.com/', {
        method: 'POST',
        headers: id ? { "Content-Type": "application/json", "id": id } : { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: newUserMessage.content }),
      });

      const data = await response.json();
      if (!data.success) throw new ChatError(data.errorMessage);
      data.id && localStorage.setItem('id', data.id);
      setIsLoading(false);
      setChatMessages((prev) => {
        const filteredMessages = prev ? prev.filter((m) => m.loadingState === false) : [];
        return [...filteredMessages, { id: chatMessages.length + 2, role: 'assistant', content: data.msg, loadingState: false }]
      });
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      if (error instanceof ChatError) return setChatMessages((prev) => {
        const filteredMessages = prev ? prev.filter((m) => m.loadingState === false) : []
        return [...filteredMessages, { id: chatMessages.length + 2, role: 'assistant', content: error.message, loadingState: false }]
      });
      return setChatMessages((prev) => {
        const filteredMessages = prev ? prev.filter((m) => m.loadingState === false) : []
        return [...filteredMessages, { id: chatMessages.length + 2, role: 'assistant', content: 'We couldn’t process your message just now. Please try again.', loadingState: false }]
      });
    }
  }

  return (
    <>
      <Header />
      <div className="flex h-screen flex-col overflow-hidden">
        <ChatContainerRoot className="relative flex-1 space-y-0 overflow-y-auto px-4 pt-12 pb-0" style={{ scrollbarWidth: 'thin' }}>
          <HandleMessagesState chatMessages={chatMessages} setChatMessages={setChatMessages} isLoadingMessages={isLoadingMessages} setIsLoadingMessages={setIsLoadingMessages} messagesError={messagesError} setMessagesError={setMessagesError} getMessages={getMessages}  />
          <div className='absolute right-12 bottom-4'>
            <ScrollButton variant={'secondary'} />
          </div>
        </ChatContainerRoot>
        <div className="inset-x-0 bottom-0 mx-auto w-full max-w-3xl shrink-0 px-3 pb-3 md:px-5 md:pb-5">
          <PromptInput
            isLoading={isLoading}
            value={prompt}
            onValueChange={setPrompt}
            onSubmit={handleSubmit}
            className="border-input bg-popover relative z-10 w-full rounded-3xl border p-0 pt-1 shadow-xs"
          >
            <div className="flex items-center pr-2">
              <PromptInputTextarea
                placeholder="Ask anything"
                className="min-h-[44px] text-base leading-[1.3] sm:text-base md:text-base"
              />

              <Button
                size="icon"
                disabled={!prompt.trim() || isLoading}
                onClick={handleSubmit}
                className="size-9 rounded-full"
                variant={'default'}
              >
                {!isLoading ? (
                  <ArrowUp size={18} />
                ) : (
                  <span className="size-3 rounded-xs bg-white" />
                )}
              </Button>
            </div>
          </PromptInput>
        </div>
      </div>
    </>
  )
}

export { ConversationPromptInput }


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConversationPromptInput />
  </StrictMode>
)

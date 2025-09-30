"use client";

import { useEffect, useState, useRef, FormEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Copy,
  Check,
  Pencil,
  ChevronDown,
  X,
  ZoomIn,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";

const FREQUENT_QUESTIONS = [
  "Can you share your company's background and history?",
  "After booking, what documents do you provide?",
  "What payment methods do you accept for overseas clients?",
  "Is your booking form legally valid?",
  "Do you offer discounts on full payment?",
  "What's the return on investment of your projects?",
];

interface SampleQuestion {
  question: string;
  description: string;
}

const SAMPLE_QUESTIONS: SampleQuestion[] = [
  {
    question: "What types of properties do you sell?",
    description: "Apartments, plots, houses, and commercial spaces",
  },
  {
    question: "Where should I invest right now?",
    description: "Best areas for real estate investment",
  },
  {
    question: "Do you offer rental properties too?",
    description: "Find houses and apartments for rent",
  },
  {
    question: "Can you help me buy commercial property?",
    description: "Shops, offices, and business spaces",
  },
];

const LOADING_MESSAGES = [
  "   Just a sec",
  "   Almost there",
  "   Thinking",
  "   Processing your request",
  "   Getting the best results",
  "   Finding relevant information",
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  isLoading?: boolean;
}

interface ChatResponse {
  response?: string;
  images?: string[];
  error?: string;
}

export default function PropertyAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedMessageContent, setEditedMessageContent] = useState<string>("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [sessionId] = useState<string>(
    () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (copiedMessageId) {
      const timer = setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedMessageId]);

  const startLoadingAnimation = () => {
    let index = 0;
    setLoadingText(LOADING_MESSAGES[0]);

    loadingIntervalRef.current = setInterval(() => {
      index = (index + 1) % LOADING_MESSAGES.length;
      setLoadingText(LOADING_MESSAGES[index]);
    }, 2000);
  };

  const stopLoadingAnimation = () => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleCopyMessage = (messageId: string, content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopiedMessageId(messageId);
        toast({
          description: "Message copied to clipboard",
          duration: 2000,
        });
      })
      .catch(() => {
        toast({
          variant: "destructive",
          description: "Failed to copy message",
          duration: 2000,
        });
      });
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditedMessageContent(content);
  };

  const handleSaveEdit = (messageId: string) => {
    const updatedMessages = messages.map((message) =>
      message.id === messageId
        ? { ...message, content: editedMessageContent }
        : message
    );

    setMessages(updatedMessages);
    setEditingMessageId(null);
    setEditedMessageContent("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedMessageContent("");
  };

  const handleQuestionSelect = (question: string) => {
    setInput(question);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const currentInput = input.trim();
    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: currentInput,
    };

    const loadingId = `${Date.now().toString()}-loading`;
    const loadingMessage: Message = {
      id: loadingId,
      role: "assistant",
      content: "",
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setLoadingMessageId(loadingId);
    setIsLoading(true);
    setInput("");
    startLoadingAnimation();

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: currentInput,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const answer = data.response || "No response";
      const images = data.images || [];

      setMessages((prev) =>
        prev.map((message) =>
          message.id === loadingId
            ? {
                ...message,
                content: answer,
                images: images,
                isLoading: false,
              }
            : message
        )
      );
    } catch (error) {
      console.error("Error sending query:", error);
      toast({
        variant: "destructive",
        description: "Error sending query. Please try again.",
        duration: 3000,
      });
      setMessages((prev) => prev.filter((message) => message.id !== loadingId));
    } finally {
      setIsLoading(false);
      setLoadingMessageId(null);
      stopLoadingAnimation();
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background/98 to-background/95 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 border-b bg-background/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-sm"
      >
        <div className="container max-w-7xl mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Property Assistant AI
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </motion.header>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-4">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="min-h-full flex flex-col items-center justify-center text-center px-4 py-12"
            >
              {/* Logo and Title - Better spacing and hierarchy */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-4 flex flex-col items-center"
              >
                <div className="w-48 h-48 mx-auto mb-2 relative">
                  <Image
                    src="/ldlogo.png"
                    alt="Company Logo"
                    width={192}
                    height={192}
                    className="object-contain"
                    priority
                    onError={(e) => {
                      console.error("Logo failed to load");
                    }}
                  />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#1e3a8a] dark:text-blue-400">
                  ARIA by Landmark Developers
                </h2>
                <p className="text-muted-foreground max-w-3xl mx-auto text-base md:text-lg leading-relaxed px-4">
                  We specialize in premium real estate, including high-rise
                  office spaces, luxury apartments, and commercial properties.
                  Tell us your requirements, and we'll guide you toward the best
                  opportunities.
                </p>
              </motion.div>

              {/* Sample Questions Grid - 2x2 with proper spacing */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-5 mb-16 px-4"
              >
                {SAMPLE_QUESTIONS.map((item, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col text-left p-6 rounded-xl border border-muted-foreground/20 bg-background/60 backdrop-blur-sm hover:bg-muted/20 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md"
                    onClick={() => setInput(item.question)}
                  >
                    <span className="font-medium text-primary mb-2 text-base">
                      {item.question}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {item.description}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 pb-32">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="group w-full"
                >
                  {editingMessageId === message.id ? (
                    <div className="flex flex-col gap-3 max-w-2xl ml-auto">
                      <Input
                        value={editedMessageContent}
                        onChange={(e) =>
                          setEditedMessageContent(e.target.value)
                        }
                        className="w-full"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(message.id)}
                          disabled={!editedMessageContent.trim()}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "flex w-full",
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "relative rounded-2xl px-4 py-3 shadow-sm",
                          message.role === "user"
                            ? "bg-primary force-text-white max-w-md"
                            : "bg-muted/40 border border-muted-foreground/10 backdrop-blur-sm w-full"
                        )}
                      >
                        {message.isLoading ? (
                          <div className="flex items-center gap-4 text-muted-foreground py-3">
                            <div className="flex space-x-2">
                              <motion.div
                                className="w-2.5 h-2.5 bg-primary rounded-full"
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  delay: 0,
                                }}
                              />
                              <motion.div
                                className="w-2.5 h-2.5 bg-primary rounded-full"
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  delay: 0.2,
                                }}
                              />
                              <motion.div
                                className="w-2.5 h-2.5 bg-primary rounded-full"
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  delay: 0.4,
                                }}
                              />
                            </div>
                            <span className="text-sm">{loadingText}</span>
                          </div>
                        ) : (
                          <>
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>

                            {/* Image thumbnails - grid layout (2 per row on all devices) */}
                            {message.images && message.images.length > 0 && (
                              <div className="mt-4 grid grid-cols-2 gap-3">
                                {message.images.map((image, imgIndex) => (
                                  <motion.div
                                    key={imgIndex}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: imgIndex * 0.1 }}
                                    className="relative group cursor-pointer"
                                    onClick={() => setSelectedImage(image)}
                                  >
                                    <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted/30 border border-muted-foreground/20">
                                      <Image
                                        src={image}
                                        alt={`Property image ${imgIndex + 1}`}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                                        onError={(e: any) => {
                                          e.target.style.display = "none";
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                        <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            )}
                          </>
                        )}

                        {/* Action buttons */}
                        {!message.isLoading && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
                                    onClick={() =>
                                      handleCopyMessage(
                                        message.id,
                                        message.content
                                      )
                                    }
                                  >
                                    {copiedMessageId === message.id ? (
                                      <Check className="h-3 w-3" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {copiedMessageId === message.id
                                      ? "Copied!"
                                      : "Copy message"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {message.role === "user" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
                                      onClick={() =>
                                        handleEditMessage(
                                          message.id,
                                          message.content
                                        )
                                      }
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit message</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Fixed Input Area - Better positioning and spacing */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/98 backdrop-blur-md shadow-2xl z-20 py-6">
          <div className="max-w-4xl mx-auto px-4">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask me about properties..."
                  className="w-full rounded-full pl-6 pr-6 py-6 text-base border-2 border-primary/20 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 h-14 shadow-lg bg-background"
                  disabled={isLoading}
                />
              </div>

              {/* FAQ Dropdown */}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="default"
                    variant="outline"
                    className="h-14 px-5 rounded-full border-2 border-primary/20 hover:bg-muted/50 bg-background shadow-md"
                    disabled={isLoading}
                  >
                    FAQs
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-96 max-h-96 overflow-y-auto"
                  sideOffset={5}
                >
                  {FREQUENT_QUESTIONS.map((question, index) => (
                    <DropdownMenuItem
                      key={index}
                      onSelect={() => handleQuestionSelect(question)}
                      className="p-4 cursor-pointer hover:bg-muted text-sm whitespace-normal leading-relaxed"
                    >
                      {question}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0"
              >
                {isLoading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>

      {/* Image Modal - Better sizing */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative max-w-3xl max-h-[85vh] bg-background rounded-xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-full">
                <Image
                  src={selectedImage}
                  alt="Property image"
                  width={1200}
                  height={800}
                  className="object-contain w-full h-full"
                  onError={(e: any) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full h-10 w-10"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster />
    </div>
  );
}


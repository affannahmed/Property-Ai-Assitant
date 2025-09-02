    //    updated   
// "use client"

// import { useEffect, useState, useRef } from "react"
// import axios from "axios"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Send, Copy, Check, Pencil } from "lucide-react"
// import { ThemeToggle } from "@/components/theme-toggle"
// import { cn } from "@/lib/utils"
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// import { toast } from "@/components/ui/use-toast"
// import { Toaster } from "@/components/ui/toaster"

// // Create API client pointing to the ngrok URL (set in NEXT_PUBLIC_API_BASE_URL)
// const apiClient = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
//   timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "120000"),
//   headers: {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY || ""}`,
//     Accept: "application/json",
//     "ngrok-skip-browser-warning": "true",
//   },
// })

// // Interceptor to catch HTML responses (ngrok warning pages)
// apiClient.interceptors.response.use(
//   (response) => {
//     const contentType = response.headers["content-type"] || ""
//     if (!contentType.includes("application/json") && typeof response.data === "string") {
//       if (response.data.includes("<!DOCTYPE html>") || response.data.includes("<html")) {
//         throw {
//           response: {
//             data: {
//               error: true,
//               message: "Received HTML instead of JSON. Please approve the ngrok URL.",
//               isNgrokWarning: true,
//             },
//           },
//         }
//       }
//       return {
//         data: {
//           error: true,
//           status: "error",
//           message: "Non-JSON response received",
//           originalContent: response.data.substring(0, 100) + "...",
//         },
//       }
//     }
//     return response
//   },
//   (error) => Promise.reject(error)
// )

// export default function PropertyAssistant() {
//   const [messages, setMessages] = useState([])
//   const [input, setInput] = useState("")
//   const [isLoading, setIsLoading] = useState(false)
//   const [isMounted, setIsMounted] = useState(false)
//   const [editingMessageId, setEditingMessageId] = useState(null)
//   const [editedMessageContent, setEditedMessageContent] = useState("")
//   const [copiedMessageId, setCopiedMessageId] = useState(null)
//   const [ngrokWarningShown, setNgrokWarningShown] = useState(false)
//   const [loadingMessageId, setLoadingMessageId] = useState(null) // ID of the loading (assistant) message
//   const messagesEndRef = useRef(null)

//   useEffect(() => {
//     setIsMounted(true)
//   }, [])

//   useEffect(() => {
//     if (messagesEndRef.current) {
//       messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
//     }
//   }, [messages])

//   useEffect(() => {
//     if (copiedMessageId) {
//       const timer = setTimeout(() => {
//         setCopiedMessageId(null)
//       }, 2000)
//       return () => clearTimeout(timer)
//     }
//   }, [copiedMessageId])

//   const handleInputChange = (e) => {
//     setInput(e.target.value)
//   }

//   const handleCopyMessage = (messageId, content) => {
//     navigator.clipboard
//       .writeText(content)
//       .then(() => {
//         setCopiedMessageId(messageId)
//         toast({
//           description: "Message copied to clipboard",
//           duration: 2000,
//         })
//       })
//       .catch(() => {
//         toast({
//           variant: "destructive",
//           description: "Failed to copy message",
//           duration: 2000,
//         })
//       })
//   }

//   const handleEditMessage = (messageId, content) => {
//     setEditingMessageId(messageId)
//     setEditedMessageContent(content)
//   }

//   const handleSaveEdit = (messageId) => {
//     const updatedMessages = messages.map((message) =>
//       message.id === messageId ? { ...message, content: editedMessageContent } : message
//     )

//     setMessages(updatedMessages)
//     setEditingMessageId(null)
//     setEditedMessageContent("")
//   }

//   const handleCancelEdit = () => {
//     setEditingMessageId(null)
//     setEditedMessageContent("")
//   }

//   const showNgrokWarning = () => {
//     if (!ngrokWarningShown) {
//       setNgrokWarningShown(true)
//       toast({
//         variant: "destructive",
//         title: "Ngrok Warning Page Detected",
//         description: (
//           <div className="space-y-2">
//             <p>Your backend is using ngrok which requires approval:</p>
//             <ol className="list-decimal pl-4">
//               <li>
//                 <a
//                   href={process.env.NEXT_PUBLIC_API_BASE_URL}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-blue-500 underline"
//                 >
//                   Open ngrok URL directly
//                 </a>
//               </li>
//               <li>Click "Visit Site" on the ngrok warning page</li>
//               <li>Return here and try again</li>
//             </ol>
//           </div>
//         ),
//         duration: 10000,
//       })
//     }
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()

//     if (!input.trim() || isLoading) return

//     // ✅ use crypto.randomUUID() instead of Date.now()
//     const userMessageId = crypto.randomUUID()
//     const userMessage = {
//       id: userMessageId,
//       role: "user",
//       content: input,
//     }

//     // Add user message and a placeholder loading message for the assistant
//     const loadingId = `${crypto.randomUUID()}-loading`
//     const loadingMessage = {
//       id: loadingId,
//       role: "assistant",
//       content: "",
//     }
//     setMessages((prev) => [...prev, userMessage, loadingMessage])
//     setLoadingMessageId(loadingId)
//     setIsLoading(true)
//     setInput("")

//     try {
//       // Call the /chat endpoint directly
//       const response = await apiClient.post("/chat", {
//         question: input,
//         session_id: "user1",
//       })

//       if (response.data.error) {
//         if (response.data.isNgrokWarning) {
//           setIsLoading(false)
//           showNgrokWarning()
//           return
//         }
//         throw new Error(response.data.message || "Error occurred")
//       }

//       const answer = response.data.answer || "No response"
//       // Update the loading message with the actual answer
//       setMessages((prev) =>
//         prev.map((message) =>
//           message.id === loadingId ? { ...message, content: answer } : message
//         )
//       )
//     } catch (error) {
//       console.error("Error sending query:", error)
//       toast({
//         variant: "destructive",
//         description: "Error sending query. Please try again.",
//         duration: 3000,
//       })
//       // Remove the loading message on error
//       setMessages((prev) => prev.filter((message) => message.id !== loadingId))
//     } finally {
//       setIsLoading(false)
//       setLoadingMessageId(null)
//     }
//   }

//   if (!isMounted) {
//     return null
//   }

//   return (
//     <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-background/95 dark:from-zinc-900 dark:to-zinc-950">
//       {/* Header */}
//       <header className="sticky top-0 z-10 border-b bg-background/80 dark:bg-zinc-900/80 backdrop-blur-md">
//         <div className="container max-w-5xl mx-auto px-4 flex h-16 items-center justify-between">
//           <div className="flex items-center gap-3">
//             <h1 className="text-xl font-semibold">Property Assistant AI</h1>
//           </div>
//           <ThemeToggle />
//         </div>
//       </header>

//       {/* Main content */}
//       <main className="flex-1 flex flex-col container max-w-5xl mx-auto py-8 mb-4 px-4">
//         {/* Chat messages */}
//         {messages.length === 0 ? (
//           <div className="h-full flex flex-col items-center justify-center text-center py-4 xl:py-16">
//             <h2 className="text-2xl font-semibold my-6">Your Property Assistant</h2>
//             <p className="text-muted-foreground max-w-2xl mb-8 mt-8">
//               Welcome to your Property Assistant! <br />
//               <br />
//               We specialize in premium real estate, including high-rise office spaces,
//               luxury apartments, and commercial properties. <br />
//               Tell us your requirements, and we will guide you toward the best opportunities.
//             </p>

//             {/* Example questions */}
//             <div className="w-full max-w-4xl py-4 gap-4 mx-auto">
//               <div className="flex flex-cols-1 md:flex-cols-2 items-center justify-center gap-4">
//                 <div className="space-y-3 space-x-2">
//                   <ExampleQuestion
//                     question="What types of properties do you sell?"
//                     description="Apartments, plots, houses, and commercial spaces"
//                     onClick={() => setInput("What types of properties do you sell?")}
//                   />
//                   <ExampleQuestion
//                     question="Where should I invest right now?"
//                     description="Best areas for real estate investment"
//                     onClick={() => setInput("Where should I invest right now?")}
//                   />
//                 </div>
//                 <div className="space-y-3">
//                   <ExampleQuestion
//                     question="Do you offer rental properties too?"
//                     description="Find houses and apartments for rent"
//                     onClick={() => setInput("Do you offer rental properties too?")}
//                   />
//                   <ExampleQuestion
//                     question="Can you help me buy commercial property?"
//                     description="Shops, offices, and business spaces"
//                     onClick={() => setInput("Can you help me buy commercial property?")}
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         ) : (
//           messages.map((message) => (
//             <div key={message.id} className="w-full max-w-3xl mx-auto group mb-4">
//               {editingMessageId === message.id ? (
//                 <div className="flex flex-col gap-2">
//                   <div>
//                     <Input
//                       value={editedMessageContent}
//                       onChange={(e) => setEditedMessageContent(e.target.value)}
//                       className="w-full"
//                       autoFocus
//                     />
//                   </div>
//                   <div className="flex gap-2 justify-end">
//                     <Button size="sm" variant="outline" onClick={handleCancelEdit}>
//                       Cancel
//                     </Button>
//                     <Button
//                       size="sm"
//                       onClick={() => handleSaveEdit(message.id)}
//                       disabled={!editedMessageContent.trim()}
//                     >
//                       Save
//                     </Button>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="relative">
//                   <div
//                     className={cn(
//                       "flex flex-col gap-2 rounded-2xl px-5 py-4 w-full",
//                       message.role === "user"
//                         ? "bg-primary text-primary-foreground shadow-sm"
//                         : "bg-muted border border-muted-foreground/10"
//                     )}
//                   >
//                     <div className="whitespace-pre-wrap">
//                       {message.id === loadingMessageId ? (
//                         <div className="flex items-center gap-3 text-muted-foreground">
//                           <div className="h-5 w-5 border-2 border-t-transparent border-gray-500 dark:border-gray-300 rounded-full animate-spin" />
//                           <span>Thinking...</span>
//                         </div>
//                       ) : (
//                         message.content
//                       )}
//                     </div>
//                   </div>
//                   <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
//                     {message.id !== loadingMessageId && (
//                       <TooltipProvider>
//                         <Tooltip>
//                           <TooltipTrigger asChild>
//                             <Button
//                               size="icon"
//                               variant="ghost"
//                               className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
//                               onClick={() => handleCopyMessage(message.id, message.content)}
//                             >
//                               {copiedMessageId === message.id ? (
//                                 <Check className="h-4 w-4" />
//                               ) : (
//                                 <Copy className="h-4 w-4" />
//                               )}
//                             </Button>
//                           </TooltipTrigger>
//                           <TooltipContent>
//                             <p>{copiedMessageId === message.id ? "Copied!" : "Copy message"}</p>
//                           </TooltipContent>
//                         </Tooltip>
//                       </TooltipProvider>
//                     )}
//                     {message.role === "user" && message.id !== loadingMessageId && (
//                       <TooltipProvider>
//                         <Tooltip>
//                           <TooltipTrigger asChild>
//                             <Button
//                               size="icon"
//                               variant="ghost"
//                               className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
//                               onClick={() => handleEditMessage(message.id, message.content)}
//                             >
//                               <Pencil className="h-4 w-4" />
//                             </Button>
//                           </TooltipTrigger>
//                           <TooltipContent>
//                             <p>Edit message</p>
//                           </TooltipContent>
//                         </Tooltip>
//                       </TooltipProvider>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))
//         )}
//         <div ref={messagesEndRef} />

//         {/* Input area */}
//         <div className="border-t py-4">
//           <form
//             onSubmit={handleSubmit}
//             className="flex flex-col md:flex-row items-center gap-4 max-w-md mx-auto w-full px-4"
//           >
//             <div className="flex items-center gap-2 w-full">
//               <Input
//                 value={input}
//                 onChange={handleInputChange}
//                 placeholder="Type your property question..."
//                 className="flex-grow rounded-full px-3 py-2 h-10 text-sm border border-muted-foreground/20 focus-visible:ring-primary"
//                 disabled={isLoading}
//               />
//               <Button
//                 type="submit"
//                 disabled={isLoading || !input.trim()}
//                 className="h-10 w-10 min-w-[2.5rem] min-h-[2.5rem] rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90"
//               >
//                 {isLoading ? (
//                   <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
//                 ) : (
//                   <Send className="h-4 w-4" />
//                 )}
//                 <span className="sr-only">Send</span>
//               </Button>
//             </div>
//           </form>
//         </div>
//       </main>
//       <Toaster />
//     </div>
//   )
// }

// function ExampleQuestion({ question, description, onClick }) {
//   return (
//     <button
//       className="flex flex-col text-left w-full rounded-2xl border border-muted-foreground/20 bg-background hover:bg-muted/50 hover:border-primary/30 transition-all p-4 shadow-sm"
//       onClick={onClick}
//     >
//       <span className="font-medium text-primary mb-1">{question}</span>
//       <span className="text-sm text-muted-foreground">{description}</span>
//     </button>
//   )
// }


"use client"

import { useEffect, useState, useRef } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Copy, Check, Pencil } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// Create API client pointing to the ngrok URL (set in NEXT_PUBLIC_API_BASE_URL)
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "120000"),
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY || ""}`,
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
  },
})

// Interceptor to catch HTML responses (ngrok warning pages)
apiClient.interceptors.response.use(
  (response) => {
    const contentType = response.headers["content-type"] || ""
    if (!contentType.includes("application/json") && typeof response.data === "string") {
      if (response.data.includes("<!DOCTYPE html>") || response.data.includes("<html")) {
        throw {
          response: {
            data: {
              error: true,
              message: "Received HTML instead of JSON. Please approve the ngrok URL.",
              isNgrokWarning: true,
            },
          },
        }
      }
      return {
        data: {
          error: true,
          status: "error",
          message: "Non-JSON response received",
          originalContent: response.data.substring(0, 100) + "...",
        },
      }
    }
    return response
  },
  (error) => Promise.reject(error)
)

export default function PropertyAssistant() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editedMessageContent, setEditedMessageContent] = useState("")
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const [ngrokWarningShown, setNgrokWarningShown] = useState(false)
  const [loadingMessageId, setLoadingMessageId] = useState(null) // ID of the loading (assistant) message
  const messagesEndRef = useRef(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  useEffect(() => {
    if (copiedMessageId) {
      const timer = setTimeout(() => {
        setCopiedMessageId(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [copiedMessageId])

  const handleInputChange = (e) => {
    setInput(e.target.value)
  }

  const handleCopyMessage = (messageId, content) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopiedMessageId(messageId)
        toast({
          description: "Message copied to clipboard",
          duration: 2000,
        })
      })
      .catch(() => {
        toast({
          variant: "destructive",
          description: "Failed to copy message",
          duration: 2000,
        })
      })
  }

  const handleEditMessage = (messageId, content) => {
    setEditingMessageId(messageId)
    setEditedMessageContent(content)
  }

  const handleSaveEdit = (messageId) => {
    const updatedMessages = messages.map((message) =>
      message.id === messageId ? { ...message, content: editedMessageContent } : message
    )

    setMessages(updatedMessages)
    setEditingMessageId(null)
    setEditedMessageContent("")
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditedMessageContent("")
  }

  const showNgrokWarning = () => {
    if (!ngrokWarningShown) {
      setNgrokWarningShown(true)
      toast({
        variant: "destructive",
        title: "Ngrok Warning Page Detected",
        description: (
          <div className="space-y-2">
            <p>Your backend is using ngrok which requires approval:</p>
            <ol className="list-decimal pl-4">
              <li>
                  <a
                    href={process.env.NEXT_PUBLIC_API_BASE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    Open backend URL directly
                  </a>


              </li>
              <li>Click "Visit Site" on the ngrok warning page</li>
              <li>Return here and try again</li>
            </ol>
          </div>
        ),
        duration: 10000,
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    const userMessageId = Date.now().toString()
    const userMessage = {
      id: userMessageId,
      role: "user",
      content: input,
    }

    // Add user message and a placeholder loading message for the assistant
    const loadingId = `${Date.now().toString()}-loading`
    const loadingMessage = {
      id: loadingId,
      role: "assistant",
      content: "",
    }
    setMessages((prev) => [...prev, userMessage, loadingMessage])
    setLoadingMessageId(loadingId)
    setIsLoading(true)
    setInput("")

    try {
      // Call the /ask endpoint directly with question and user fields
      const response = await apiClient.post("/ask", {
        question: input,
        user: "user1",
      })

      if (response.data.error) {
        if (response.data.isNgrokWarning) {
          setIsLoading(false)
          showNgrokWarning()
          return
        }
        throw new Error(response.data.message || "Error occurred")
      }

      const answer = response.data.answer || "No response"
      // Update the loading message with the actual answer
      setMessages((prev) =>
        prev.map((message) =>
          message.id === loadingId
            ? { ...message, content: answer }
            : message
        )
      )
    } catch (error) {
      console.error("Error sending query:", error)
      toast({
        variant: "destructive",
        description: "Error sending query. Please try again.",
        duration: 3000,
      })
      // Remove the loading message on error
      setMessages((prev) => prev.filter((message) => message.id !== loadingId))
    } finally {
      setIsLoading(false)
      setLoadingMessageId(null)
    }
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-background/95 dark:from-zinc-900 dark:to-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="container max-w-5xl mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Optional logo removed */}
            <h1 className="text-xl font-semibold">Property Assistant AI</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col container max-w-5xl mx-auto py-8 mb-4 px-4">
        {/* Chat messages */}
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-4 xl:py-16">
            <h2 className="text-2xl font-semibold my-6">Your Property Assistant</h2>
            <p className="text-muted-foreground max-w-2xl mb-8 mt-8">
              Welcome to your Property Assistant!  <br /><br />
              We specialize in premium real estate, including high-rise office spaces,
              luxury apartments, and commercial properties. <br />
              Tell us your requirements, and we will guide you toward the best opportunities.
            </p>

            {/* Example questions */}
            <div className="w-full max-w-4xl py-4 gap-4 mx-auto">
              <div className="flex flex-cols-1 md:flex-cols-2 items-center justify-center gap-4">
                <div className="space-y-3 space-x-2">
                  <ExampleQuestion
                    question="What types of properties do you sell?"
                    description="Apartments, plots, houses, and commercial spaces"
                    onClick={() => setInput("What types of properties do you sell?")}
                  />
                  <ExampleQuestion
                    question="Where should I invest right now?"
                    description="Best areas for real estate investment"
                    onClick={() => setInput("Where should I invest right now?")}
                  />
                </div>
                <div className="space-y-3">
                  <ExampleQuestion
                    question="Do you offer rental properties too?"
                    description="Find houses and apartments for rent"
                    onClick={() => setInput("Do you offer rental properties too?")}
                  />
                  <ExampleQuestion
                    question="Can you help me buy commercial property?"
                    description="Shops, offices, and business spaces"
                    onClick={() => setInput("Can you help me buy commercial property?")}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="w-full max-w-3xl mx-auto group mb-4">
              {editingMessageId === message.id ? (
                <div className="flex flex-col gap-2">
                  <div>
                    <Input
                      value={editedMessageContent}
                      onChange={(e) => setEditedMessageContent(e.target.value)}
                      className="w-full"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
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
                <div className="relative">
                  <div
                    className={cn(
                      "flex flex-col gap-2 rounded-2xl px-5 py-4 w-full",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted border border-muted-foreground/10"
                    )}
                  >
                    <div className="whitespace-pre-wrap">
                      {message.id === loadingMessageId ? (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <div className="h-5 w-5 border-2 border-t-transparent border-gray-500 dark:border-gray-300 rounded-full animate-spin" />
                          <span>Thinking...</span>
                        </div>
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {message.id !== loadingMessageId && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
                              onClick={() => handleCopyMessage(message.id, message.content)}
                            >
                              {copiedMessageId === message.id ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{copiedMessageId === message.id ? "Copied!" : "Copy message"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {message.role === "user" && message.id !== loadingMessageId && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
                              onClick={() => handleEditMessage(message.id, message.content)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit message</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />

        {/* Input area */}
        <div className="border-t py-4">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col md:flex-row items-center gap-4 max-w-md mx-auto w-full px-4"
          >
            <div className="flex items-center gap-2 w-full">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Type your property question..."
                className="flex-grow rounded-full px-3 py-2 h-10 text-sm border border-muted-foreground/20 focus-visible:ring-primary"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-10 w-10 min-w-[2.5rem] min-h-[2.5rem] rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Toaster />
    </div>
  )
}

function ExampleQuestion({ question, description, onClick }) {
  return (
    <button
      className="flex flex-col text-left w-full rounded-2xl border border-muted-foreground/20 bg-background hover:bg-muted/50 hover:border-primary/30 transition-all p-4 shadow-sm"
      onClick={onClick}
    >
      <span className="font-medium text-primary mb-1">{question}</span>
      <span className="text-sm text-muted-foreground">{description}</span>
    </button>
  )
}
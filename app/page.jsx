// "use client"

// import { useEffect, useState, useRef } from "react"
// import axios from "axios"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Send, Scale, User, Copy, Check, Pencil } from "lucide-react"
// import { ThemeToggle } from "@/components/theme-toggle"
// import { cn } from "@/lib/utils"
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// import { toast } from "@/components/ui/use-toast"
// import { Toaster } from "@/components/ui/toaster"
// import { 
//   Select,
//   SelectContent, 
//   SelectItem, 
//   SelectTrigger, 
//   SelectValue 
// } from "@/components/ui/select"

// // Create API client with environment variables for direct backend connection
// const apiClient = axios.create({
//    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,

//   timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '120000'),
//   headers: {
//     'Content-Type': 'application/json',
//     'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY || ''}`,
//     'Accept': 'application/json',
//     'ngrok-skip-browser-warning': 'true' // Try to bypass ngrok warning
//   }
// });

// // Add response interceptor to handle unexpected content types
// apiClient.interceptors.response.use(
//   response => {
//     // Check if response is not JSON despite requesting JSON
//     const contentType = response.headers['content-type'] || '';
//     if (!contentType.includes('application/json') && typeof response.data === 'string') {
//       // If HTML is received (likely ngrok warning)
//       if (response.data.includes('<!DOCTYPE html>') || response.data.includes('<html')) {
//         throw {
//           response: {
//             data: {
//               error: true,
//               message: 'Received HTML instead of JSON. Please approve the ngrok URL.',
//               isNgrokWarning: true
//             }
//           }
//         };
//       }

//       // Create a properly structured error response for other non-JSON responses
//       return {
//         data: {
//           error: true,
//           status: 'error',
//           message: 'Non-JSON response received',
//           originalContent: response.data.substring(0, 100) + '...' // Just keep a snippet for debugging
//         }
//       };
//     }
//     return response;
//   },
//   error => Promise.reject(error)
// );

// export default function LegalAssistant() {
//   const [messages, setMessages] = useState([])
//   const [input, setInput] = useState("")
//   const [isLoading, setIsLoading] = useState(false)
//   const [isMounted, setIsMounted] = useState(false)
//   const [editingMessageId, setEditingMessageId] = useState(null)
//   const [editedMessageContent, setEditedMessageContent] = useState("")
//   const [copiedMessageId, setCopiedMessageId] = useState(null)
//   const [ngrokWarningShown, setNgrokWarningShown] = useState(false)
//   const [modelType, setModelType] = useState("intfloat") // Default model type
//   const messagesEndRef = useRef(null)

//   // Handle hydration issues with useEffect
//   useEffect(() => {
//     setIsMounted(true)
//     // Test connection when component loads
//     // testBackendConnection()
//   }, [])

//   // const testBackendConnection = async () => {
//   //   try {
//   //     // Try a simple request to backend
//   //     await apiClient.get('/health-check')
//   //     console.log("Backend connection established")
//   //   } catch (error) {
//   //     if (error.response?.data?.isNgrokWarning) {
//   //       showNgrokWarning()
//   //     }
//   //   }
//   // }

//   // Function to show ngrok warning message
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

//   // Scroll to bottom when messages change
//   useEffect(() => {
//     if (messagesEndRef.current) {
//       messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
//     }
//   }, [messages])

//   // Reset copied message ID after 2 seconds
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

//   const handleModelTypeChange = (value) => {
//     setModelType(value)
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
//     // Update the message in the messages array
//     const updatedMessages = messages.map((message) =>
//       message.id === messageId ? { ...message, content: editedMessageContent } : message,
//     )

//     setMessages(updatedMessages)
//     setEditingMessageId(null)
//     setEditedMessageContent("")
//   }

//   const handleCancelEdit = () => {
//     setEditingMessageId(null)
//     setEditedMessageContent("")
//   }

//   // Function to check status until it becomes 1
//   const checkStatus = async (job_id) => {
//     try {
//       console.log("Starting status check for job_id:", job_id);
//       const maxRetries = parseInt(process.env.NEXT_PUBLIC_MAX_RETRIES || '120');
//       const retryInterval = parseInt(process.env.NEXT_PUBLIC_RETRY_INTERVAL || '1000');
//       let retries = 0;

//       const interval = setInterval(async () => {
//         if (retries >= maxRetries) {
//           clearInterval(interval);
//           setIsLoading(false);
//           console.log("Max retries reached. Request timed out.");
//           toast({
//             variant: "destructive",
//             description: "Request timed out. Please try again.",
//             duration: 3000,
//           });
//           return;
//         }

//         retries++;
//         console.log(`Checking status (attempt ${retries}/${maxRetries})`);

//         try {
//           const statusResponse = await apiClient.get('/check_status', {
//             params: { job_id }
//           });

//           console.log("Status response:", statusResponse.data);

//           if (statusResponse.data.error) {
//             if (statusResponse.data.isNgrokWarning) {
//               clearInterval(interval);
//               setIsLoading(false);
//               showNgrokWarning();
//               return;
//             }
//             console.error("Error in status response:", statusResponse.data.message);
//             // Continue polling for recoverable errors
//             return;
//           }

//           if (statusResponse.data.status === 1) {
//             clearInterval(interval);
//             console.log("Status is 1, processing result");

//             // Make sure we have a properly formatted response
//             let responseContent = statusResponse.data.answer;

//             // Check if response exists and is not empty
//             if (!responseContent || responseContent.trim() === "") {
//               responseContent = "Sorry, I couldn't generate a response. Please try again.";
//             }

//             // Debug the response content
//             console.log("Response content:", responseContent);

//             const newMessage = {
//               id: Date.now().toString(),
//               role: 'assistant',
//               content: responseContent
//             };

//             setMessages(prev => [...prev, newMessage]);
//             setIsLoading(false);
//           }
//         } catch (error) {
//           console.error("Error in status check:", error);

//           // Special handling for ngrok warning pages
//           if (error.response?.data?.isNgrokWarning) {
//             clearInterval(interval);
//             setIsLoading(false);
//             showNgrokWarning();
//             return;
//           }

//           // Continue polling for other errors
//         }
//       }, retryInterval);

//       return () => clearInterval(interval);

//     } catch (error) {
//       console.error("Error in checkStatus:", error);
//       setIsLoading(false);
//       toast({
//         variant: "destructive",
//         description: "Error getting response. Please try again.",
//         duration: 3000,
//       });
//     }
//   };


//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!input.trim() || isLoading) return;

//     // Add user message to messages
//     const userMessage = {
//       id: Date.now().toString(),
//       role: 'user',
//       content: input
//     };

//     // Add model information to message display so user knows which model was used
//     const modelInfo = {
//       id: Date.now().toString() + "-model",
//       role: 'system',
//       content: `Using model: ${modelType === "sentence-transformer" ? "Sentence Transformer" : "IntFloat"}`
//     };

//     setMessages(prev => [...prev, userMessage]);
//     setIsLoading(true);
//     setInput('');

//     try {
//     // Direct call to your backend query endpoint with selected model type
//       const response = await apiClient.post('/submit_query', {
//         query: input,
//         model_type: modelType  // Include the selected model type in the request
//       });

//       console.log(`Sending query with model_type: ${modelType}`);

//       // Check if response indicates an ngrok warning
//       if (response.data.error && response.data.isNgrokWarning) {
//         setIsLoading(false);
//         showNgrokWarning();
//         return;
//       }

//       const { job_id } = response.data;

//       // Check status until it's 1
//       if (job_id) {
//         checkStatus(job_id);
//       } else {
//         throw new Error("No job ID received");
//       }

//     } catch (error) {
//       console.error("Error sending query:", error);
//       setIsLoading(false);

//       // Handle ngrok warning
//       if (error.response?.data?.isNgrokWarning) {
//         showNgrokWarning();
//         return;
//       }

//       toast({
//         variant: "destructive",
//         description: "Error sending query. Please try again.",
//         duration: 3000,
//       });
//     }
//   };

//   if (!isMounted) {
//     return null
//   }

//   return (
//     <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-background/95 dark:from-zinc-900 dark:to-zinc-950">
//       {/* Header */}
//       <header className="sticky top-0 z-10 border-b bg-background/80 dark:bg-zinc-900/80 backdrop-blur-md">
//         <div className="container max-w-5xl mx-auto px-4 flex h-16 items-center justify-between">
//           <div className="flex items-center gap-3">
//             <a href="/" className="bg-primary/10 p-2 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer">
//               <Scale className="h-5 w-5 text-primary" />
//             </a>
//             <h1 className="text-xl font-semibold">Legal Counsel AI</h1>
//           </div>
//           <ThemeToggle />
//         </div>
//       </header>

//       {/* Main content */}
//       <main className="flex-1 flex flex-col container max-w-5xl mx-auto py-8 mb-4 px-4">
//         {/* Chat messages */}
//         <div className="flex-1 overflow-y-auto py-6 space-y-8">
//           {messages.length === 0 ? (
//             <div className="h-full flex flex-col items-center justify-center text-center py-4  xl:py-16">
//               <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center xl:mb-6">
//                 <Scale className="h-8 w-8 text-primary" />
//               </div>
//               <h2 className="text-2xl font-semibold my-6 ">Your Legal Assistant</h2>
//               <p className="text-muted-foreground max-w-md mb-8 mt-8">
//                 I can provide information on various legal topics and help you understand your rights and options.
//               </p>

//               <div className="w-full  max-w-4xl py-4 gap-4 mx-auto">
//                 <div className="flex flex-cols-1 md:flex-cols-2 items-center justify-center gap-4">
//                   <div className="space-y-3 space-x-2">
//                     <ExampleQuestion
//                       question="What are my rights as a tenant?"
//                       description="Housing laws and tenant protections"
//                       onClick={() => setInput("What are my rights as a tenant?")}
//                     />
//                     <ExampleQuestion
//                       question="How do I form an LLC?"
//                       description="Business formation and legal entities"
//                       onClick={() => setInput("How do I form an LLC?")}
//                     />
//                   </div>

//                   <div className="space-y-3">
//                     <ExampleQuestion
//                       question="Explain contract law basics"
//                       description="Understanding agreements and obligations"
//                       onClick={() => setInput("Can you explain contract law basics?")}
//                     />
//                     <ExampleQuestion
//                       question="What is intellectual property?"
//                       description="Copyrights, patents, trademarks, and more"
//                       onClick={() => setInput("What is intellectual property?")}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ) : (
//             messages.map((message) => (
//               <div key={message.id} className="flex gap-4 w-full max-w-3xl mx-auto group">
//                 <div
//                   className={cn(
//                     "flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full",
//                     message.role === "user"
//                       ? "bg-primary text-primary-foreground shadow-sm"
//                       : message.role === "system"
//                         ? "bg-muted/50 border border-muted-foreground/10"
//                         : "bg-muted border border-muted-foreground/10"
//                   )}
//                 >
//                   {message.role === "user" ? <User className="h-5 w-5" /> : 
//                    message.role === "system" ? <div className="text-xs font-bold">AI</div> : 
//                    <Scale className="h-5 w-5" />}
//                 </div>

//                 {editingMessageId === message.id ? (
//                   <div className="flex-1 flex flex-col gap-2">
//                     <div className="flex-1">
//                       <Input
//                         value={editedMessageContent}
//                         onChange={(e) => setEditedMessageContent(e.target.value)}
//                         className="w-full"
//                         autoFocus
//                       />
//                     </div>
//                     <div className="flex gap-2 justify-end">
//                       <Button size="sm" variant="outline" onClick={handleCancelEdit}>
//                         Cancel
//                       </Button>
//                       <Button
//                         size="sm"
//                         onClick={() => handleSaveEdit(message.id)}
//                         disabled={!editedMessageContent.trim()}
//                       >
//                         Save
//                       </Button>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="relative flex-1">
//                     <div
//                       className={cn(
//                         "flex flex-col gap-2 rounded-2xl px-5 py-4",
//                         message.role === "user"
//                           ? "bg-primary text-primary-foreground shadow-sm"
//                           : "bg-muted border border-muted-foreground/10"
//                       )}
//                     >
//                       {/* Use whitespace-pre-wrap to preserve text formatting */}
//                       <div className="whitespace-pre-wrap">{message.content}</div>
//                     </div>

//                     {/* Message actions */}
//                     <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
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

//                       {message.role === "user" && (
//                         <TooltipProvider>
//                           <Tooltip>
//                             <TooltipTrigger asChild>
//                               <Button
//                                 size="icon"
//                                 variant="ghost"
//                                 className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
//                                 onClick={() => handleEditMessage(message.id, message.content)}
//                               >
//                                 <Pencil className="h-4 w-4" />
//                               </Button>
//                             </TooltipTrigger>
//                             <TooltipContent>
//                               <p>Edit message</p>
//                             </TooltipContent>
//                           </Tooltip>
//                         </TooltipProvider>
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))
//           )}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* Input area */}
//         <div className="border-t py-4">
//           <form
//             onSubmit={handleSubmit}
//             className="flex flex-col md:flex-row items-center gap-4 max-w-md mx-auto w-full px-4"
//           >

//             <div className="w-full md:w-1/3">
//               <Select value={modelType} onValueChange={handleModelTypeChange}>
//                 <SelectTrigger className="w-full h-10 text-sm border border-muted-foreground/20 focus-visible:ring-primary">
//                   <SelectValue placeholder="Select Model" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {/* <SelectItem value="sentence-transformer">Sentence Transformer</SelectItem> */}
//                   <SelectItem value="intfloat">IntFloat</SelectItem>
//                 </SelectContent>
//               </Select>
//               <p className="text-xs text-muted-foreground mt-1 text-center">
//                 {modelType === "sentence-transformer" ? "Sentence-based processing" : "Floating-point processing"}
//               </p>
//             </div>

//             {/* Input field */}
//             <div className="flex items-center gap-2 w-full">
//               <Input
//                 value={input}
//                 onChange={handleInputChange}
//                 placeholder="Type your legal question..."
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

// function ExampleQuestion({
//   question,
//   description,
//   onClick
// }) {
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
//  --------- working api -------
// "use client"

// import { useEffect, useState, useRef } from "react"
// import axios from "axios"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Send, Scale, User, Copy, Check, Pencil } from "lucide-react"
// import { ThemeToggle } from "@/components/theme-toggle"
// import { cn } from "@/lib/utils"
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// import { toast } from "@/components/ui/use-toast"
// import { Toaster } from "@/components/ui/toaster"



//   ---------------   deep search api --------------
// "use client"

// import { useEffect, useState, useRef } from "react"
// import axios from "axios"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Send, Scale, User, Copy, Check, Pencil } from "lucide-react"
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

//     const userMessage = {
//       id: Date.now().toString(),
//       role: "user",
//       content: input,
//     }

//     setMessages((prev) => [...prev, userMessage])
//     setIsLoading(true)
//     setInput("")

//     try {
//       // Call the /ask endpoint directly with question and user fields
//       const response = await apiClient.post("/ask", {
//         question: input,
//         user: "user1",
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
//       const assistantMessage = {
//         id: Date.now().toString(),
//         role: "assistant",
//         content: answer,
//       }
//       setMessages((prev) => [...prev, assistantMessage])
//     } catch (error) {
//       console.error("Error sending query:", error)
//       toast({
//         variant: "destructive",
//         description: "Error sending query. Please try again.",
//         duration: 3000,
//       })
//     } finally {
//       setIsLoading(false)
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
//             {/* <a
//               href="/"
//               className="bg-primary/10 p-2 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
//             >
//               <Scale className="h-5 w-5 text-primary" />
//             </a> */}
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
//             {/* <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center xl:mb-6">
//               <Scale className="h-8 w-8 text-primary" />
//             </div> */}
//             <h2 className="text-2xl font-semibold my-6">Your Property Assistant</h2>
//             <p className="text-muted-foreground max-w-2xl mb-8 mt-8">
//               Welcome to your Property Assistant!  <br /><br />
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
//             <div key={message.id} className="flex gap-4 w-full max-w-3xl mx-auto group mb-4">
//               <div
//                 className={cn(
//                   "flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full",
//                   message.role === "user"
//                     ? "bg-primary text-primary-foreground shadow-sm"
//                     : message.role === "system"
//                       ? "bg-muted/50 border border-muted-foreground/10"
//                       : "bg-muted border border-muted-foreground/10"
//                 )}
//               >
//                 {message.role === "user" ? (
//                   <User className="h-5 w-5" />
//                 ) : message.role === "system" ? (
//                   <div className="text-xs font-bold">AI</div>
//                 ) : (
//                   <Scale className="h-5 w-5" />
//                 )}
//               </div>

//               {editingMessageId === message.id ? (
//                 <div className="flex-1 flex flex-col gap-2">
//                   <div className="flex-1">
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
//                 <div className="relative flex-1">
//                   <div
//                     className={cn(
//                       "flex flex-col gap-2 rounded-2xl px-5 py-4",
//                       message.role === "user"
//                         ? "bg-primary text-primary-foreground shadow-sm"
//                         : "bg-muted border border-muted-foreground/10"
//                     )}
//                   >
//                     <div className="whitespace-pre-wrap">{message.content}</div>
//                   </div>
//                   <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
//                     <TooltipProvider>
//                       <Tooltip>
//                         <TooltipTrigger asChild>
//                           <Button
//                             size="icon"
//                             variant="ghost"
//                             className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
//                             onClick={() => handleCopyMessage(message.id, message.content)}
//                           >
//                             {copiedMessageId === message.id ? (
//                               <Check className="h-4 w-4" />
//                             ) : (
//                               <Copy className="h-4 w-4" />
//                             )}
//                           </Button>
//                         </TooltipTrigger>
//                         <TooltipContent>
//                           <p>{copiedMessageId === message.id ? "Copied!" : "Copy message"}</p>
//                         </TooltipContent>
//                       </Tooltip>
//                     </TooltipProvider>

//                     {message.role === "user" && (
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
                  Open ngrok URL directly
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

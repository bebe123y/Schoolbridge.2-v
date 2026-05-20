import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', parts: [{ text: input.trim() }] };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const currentPage = window.location.pathname;
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.parts[0].text,
          history: messages,
          context: {
            currentPage
          }
        }),
      });

      const textResponse = await response.text();
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        throw new Error(`Server returned an invalid response (Status: ${response.status})`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Failed to get AI response (Status: ${response.status})`);
      }

      if (data.text) {
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: data.text }] }]);
      } else {
        throw new Error('No response content');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        parts: [{ text: error.message || "Sorry, I'm having trouble connecting right now. Please try again later or contact support at ss0700561@gmail.com." }] 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-20 right-0 w-[90vw] max-w-[400px] h-[500px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight">SchoolBridge AI</h3>
                  <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-gray-50 dark:bg-gray-950"
            >
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                    <Bot className="w-8 h-8" />
                  </div>
                  <h4 className="font-black text-lg mb-2">Welcome!</h4>
                  <p className="text-sm text-gray-500 font-medium px-4">
                    How can I help you navigate SchoolBridge today?
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-slate-800'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`
                    max-w-[80%] p-4 rounded-3xl text-sm font-medium leading-relaxed
                    ${msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-lg' 
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-tl-none'}
                  `}>
                    {msg.parts[0].text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-slate-800 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-4 rounded-3xl rounded-tl-none flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="w-full pl-6 pr-14 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-2xl outline-none focus:ring-2 ring-indigo-600 transition font-medium"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 transition shadow-lg shadow-indigo-100"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all hover:scale-110 active:scale-95
          ${isOpen ? 'bg-red-500 rotate-90' : 'bg-indigo-600'}
        `}
      >
        {isOpen ? <X className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
      </button>
    </div>
  );
};

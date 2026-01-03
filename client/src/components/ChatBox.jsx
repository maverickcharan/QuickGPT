import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import Message from './Message'
import { useRef } from 'react'
import toast from 'react-hot-toast'

const ChatBox = () => {

  const containerRef = useRef(null)
  const { selectedChat, theme, user, axios, token, setUser } = useAppContext()

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState('text')
  const [isPublished, setIsPublished] = useState(false)

  const onSubmit = async (e) => {
    try {
      e.preventDefault();

      if (!user) return toast('Login to send message');
      if (!selectedChat) {
        return toast('Please select a chat first');
      }

      setLoading(true);   



      
      const promptCopy = prompt;
      setPrompt('');

      setMessages(prev => [
        ...prev,
        {
          role: 'user',
          content: prompt,
          timestamp: Date.now(),
          isImage: false,
        },
      ]);


      // ADD THIS LOG TO SEE WHAT'S BEING SENT
      console.log('Sending request:', {
        mode: mode,
        endpoint: `/api/message/${mode}`,
        chatId: selectedChat._id,
        prompt: prompt,
        isPublished: isPublished
      });

      const { data } = await axios.post(
        `/api/message/${mode}`,
        {
          chatId: selectedChat._id,
          prompt,
          isPublished,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }

        }
      );

      if (data.success) {
        setMessages(prev => [...prev, data.reply]);

        // decrease credits
        if (mode === 'image') {
          setUser(prev => ({ ...prev, credits: prev.credits - 2 }));
        } else {
          setUser(prev => ({ ...prev, credits: prev.credits - 1 }));
        }
      } else {
        toast.error(data.message);
        setPrompt(promptCopy);
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      toast.error(errMsg);
    } finally {
      setPrompt('');
      setLoading(false);
    }
  };



  useEffect(() => {
    if (selectedChat) {
      setMessages(selectedChat.messages)
    }
  }, [selectedChat])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col justify-between m-5 md:m-10 xl:mx-28 max-md:mt-14 2xl:pr-40">
      {/* Chat Messages */}
      <div ref={containerRef}
        className="flex-1 mb-5 overflow-y-scroll">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-primary">
            <img
              src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark}
              alt=""
              className="max-w-56 sm:max-w-68"
            />
            <p className="mt-5 text-4xl sm:text-6xl text-center text-gray-400 dark:text-white">
              Ask me anything.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}

        {/* Three Dots Loading */}
        {loading && (
          <div className='loader flex items-center gap-1.5'>
            <div className='w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce'></div>
            <div className='w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce'></div>
            <div className='w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce'></div>
          </div>
        )}

      </div>



      {/* Prompt Input Box */}
      <form onSubmit={onSubmit} className='bg-primary/20 dark:bg-[#583C79]/30 border border-primary dark:border-[#80609F]/30 rounded-full w-full max-w-2xl p-3 pl-4 mx-auto flex gap-4 items-center'>

        <select
          onChange={(e) => setMode(e.target.value)}
          value={mode}
          className="w-28 px-2 py-2 rounded-xl text-sm
    bg-white text-black border border-gray-300
    dark:bg-gray-900 dark:text-white dark:border-gray-700
    placeholder-gray-500 dark:placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-purple-500
  "
        >
          <option className='dark:bg-purple-900' value="text">Text</option>
          <option className='dark:bg-purple-900' value="image">Image</option>
        </select>
        <input
          onChange={(e) => setPrompt(e.target.value)}
          value={prompt}
          type="text"
          placeholder={selectedChat ? "Type your prompt here..." : "Select a chat first"}
          className="
    flex-1 w-full px-4 py-3 rounded-xl text-sm
    bg-white text-black border border-gray-300
    dark:bg-gray-900 dark:text-white dark:border-gray-700
    placeholder-gray-500 dark:placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-purple-500
  "
          required
          disabled={!selectedChat}
        />


        <button disabled={loading}>
          <img
            src={loading ? assets.stop_icon : assets.send_icon}
            className='w-8 cursor-pointer'
            alt=""
          />
        </button>

      </form>


    </div>
  )
}

export default ChatBox 
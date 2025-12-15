import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { SOCKET_URL } from '../config/api';

interface User {
  _id: string;
  username: string;
  email: string;
  hostel: string;
}

interface Message {
  _id?: string;
  message: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  createdAt?: string;
  read?: boolean;
}

interface Chat {
  _id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: string;
  otherUser: User;
  unreadCount: number;
}

export default function Chat() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string; message: Message } | null>(null);
  const [showDeleteChatModal, setShowDeleteChatModal] = useState(false);
  const [showUnsendModal, setShowUnsendModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);
  const sellerChatProcessed = useRef(false);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket and fetch data
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      navigate('/login');
      return;
    }

    setCurrentUserId(userId);

    // Check if sellerId is passed via navigation state
    if (location.state?.sellerId && !isLoading && !sellerChatProcessed.current) {
      console.log('🔍 sellerId detected:', location.state.sellerId);
      console.log('🔍 itemId detected:', location.state.itemId);
      
      sellerChatProcessed.current = true;
      
      // Fetch seller details and start chat
      const startChatWithSeller = async () => {
        setIsLoading(true);
        try {
          console.log('📞 Fetching seller details...');
          const sellerResponse = await axios.get(`/api/user/${location.state.sellerId}`);
          console.log('✅ Seller response:', sellerResponse.data);
          
          if (sellerResponse.data.success) {
            const seller = sellerResponse.data.user;
            console.log('👤 Seller:', seller);
            
            // Start chat with seller - use correct endpoint
            console.log('💬 Creating/getting chat...');
            const chatResponse = await axios.get(`/api/chat/chat/${seller._id}`);
            console.log('✅ Chat response:', chatResponse.data);
            
            if (chatResponse.data.success) {
              const chat = chatResponse.data.chat;
              console.log('💬 Chat:', chat);
              
              setSelectedChat({ ...chat, otherUser: seller, unreadCount: 0 });
              setSelectedUser(seller);
              await fetchMessages(chat._id);
            }
          }
        } catch (error: any) {
          console.error('❌ Error starting chat with seller:', error);
          console.error('Error details:', error.response?.data || error.message);
          alert('Failed to open chat. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };
      startChatWithSeller();
    }

    // Set axios default header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Initialize socket
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      newSocket.emit('userJoin', userId);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected');
      setIsConnected(false);
    });

    // Listen for message errors
    newSocket.on('messageError', (error: any) => {
      alert(error.message);
      setIsSending(false);
    });

    // Listen for new messages
    newSocket.on('newPrivateMessage', (message: Message) => {
      // Only add if not already in the list (prevent duplicates)
      setMessages(prev => {
        const exists = prev.some(m => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
      // Update chat list
      fetchChats();
    });

    // Listen for message sent confirmation (from server)
    newSocket.on('messageSent', (message: Message) => {
      // Update the temporary message with the server response
      setMessages(prev => 
        prev.map(m => 
          m._id?.toString().startsWith('temp-') && m.message === message.message
            ? message
            : m
        )
      );
    });

    // Listen for message deletion
    newSocket.on('messageDeleted', ({ messageId, chatId }: { messageId: string; chatId: string }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
      if (selectedChat?._id === chatId) {
        fetchChats(); // Refresh chat list to update last message
      }
    });

    // Listen for conversation deletion
    newSocket.on('conversationDeleted', ({ chatId }: { chatId: string }) => {
      // Remove chat from list
      setChats(prev => prev.filter(c => c._id !== chatId));
      // If this was the selected chat, clear it
      if (selectedChat?._id === chatId) {
        setSelectedChat(null);
        setSelectedUser(null);
        setMessages([]);
      }
    });

    setSocket(newSocket);

    // Fetch initial data
    fetchUsers();
    fetchChats();

    return () => {
      newSocket.close();
    };
  }, [navigate]);

  // Handle selected chat from navigation state
  useEffect(() => {
    const selectedChatId = location.state?.selectedChatId;
    if (selectedChatId && chats.length > 0) {
      const chat = chats.find(c => c._id === selectedChatId);
      if (chat) {
        openChat(chat);
      }
    }
  }, [location.state, chats]);

  const fetchUsers = async (search = '') => {
    try {
      const response = await axios.get(`/api/chat/users?search=${encodeURIComponent(search)}`);
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Search users when search query changes
  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await axios.get('/api/chat/chats');
      if (response.data.success) {
        setChats(response.data.chats);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const startChat = async (user: User) => {
    try {
      // Get or create chat
      const response = await axios.get(`/api/chat/chat/${user._id}`);
      if (response.data.success) {
        const chat = response.data.chat;
        setSelectedChat({ ...chat, otherUser: user, unreadCount: 0 });
        setSelectedUser(user);
        await fetchMessages(chat._id);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const response = await axios.get(`/api/chat/messages/${chatId}`);
      if (response.data.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedChat || !selectedUser || isSending) return;

    const tempId = `temp-${Date.now()}-${messageIdRef.current++}`;
    const messageText = messageInput.trim();
    
    // Optimistically add message to UI immediately
    const optimisticMessage: Message = {
      _id: tempId,
      message: messageText,
      senderId: currentUserId,
      senderName: 'You',
      receiverId: selectedUser._id,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setMessageInput('');
    setIsSending(true);

    const messageData = {
      chatId: selectedChat._id,
      receiverId: selectedUser._id,
      senderId: currentUserId,
      senderName: 'You',
      message: messageText
    };

    try {
      // Only emit via socket - let server handle database save
      socket?.emit('sendPrivateMessage', messageData);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setMessageInput(messageText); // Restore message
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const openChat = (chat: Chat) => {
    setSelectedChat(chat);
    setSelectedUser(chat.otherUser);
    fetchMessages(chat._id);
  };

  const handleDeleteMessage = async (messageId: string, receiverId: string) => {
    try {
      const response = await axios.delete(`/api/chat/message/${messageId}`);
      if (response.data.success) {
        // Remove from local state
        setMessages(prev => prev.filter(m => m._id !== messageId));
        
        // Emit socket event to notify other user
        socket?.emit('deleteMessage', {
          messageId,
          receiverId,
          chatId: selectedChat?._id
        });
        
        // Refresh chat list to update last message
        fetchChats();
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    } finally {
      setContextMenu(null);
      setShowUnsendModal(false);
      setMessageToDelete(null);
    }
  };

  const handleDeleteForMe = (messageId: string) => {
    // Just remove from local state (not from database)
    setMessages(prev => prev.filter(m => m._id !== messageId));
    setContextMenu(null);
  };

  const handleDeleteConversation = async () => {
    if (!selectedChat || !selectedUser) return;
    
    try {
      const response = await axios.delete(`/api/chat/chat/${selectedChat._id}`);
      if (response.data.success) {
        // Remove from chats list
        setChats(prev => prev.filter(c => c._id !== selectedChat._id));
        
        // Emit socket event to notify other user
        socket?.emit('deleteConversation', {
          chatId: selectedChat._id,
          otherUserId: selectedUser._id
        });
        
        // Clear selected chat
        setSelectedChat(null);
        setSelectedUser(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation');
    } finally {
      setShowDeleteChatModal(false);
    }
  };

  const handleMessageRightClick = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    // Only allow deleting own messages
    if (message.senderId === currentUserId) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        messageId: message._id || '',
        message
      });
    }
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b transition-colors duration-300`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center ${theme === 'dark' ? 'text-gray-300 hover:text-indigo-400' : 'text-gray-600 hover:text-indigo-600'} transition`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo-icon.jpg" alt="CampusZon" className="w-8 h-8 rounded-full object-cover" />
            <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Messages</h1>
          </div>
          <div className={`text-sm ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            {isConnected ? '● Online' : '● Offline'}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden transition-colors duration-300`} style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex h-full">
            {/* Sidebar */}
            <div className={`w-80 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-r flex flex-col transition-colors duration-300`}>
              {/* Header */}
              <div className="flex border-b">
                <div className={`flex-1 py-3 text-sm font-medium text-center ${
                    theme === 'dark'
                      ? 'bg-gray-800 text-indigo-400'
                      : 'bg-white text-indigo-600'
                  } transition-colors duration-300`}
                >
                  Your Chats
                </div>
              </div>

              {/* Search Input */}
              <div className={`p-3 border-b ${theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'}`}>
                <div className="relative">
                  <input
                    type="text"
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    placeholder="Search chats..."
                    className={`w-full px-4 py-2 pl-10 rounded-lg ${
                      theme === 'dark'
                        ? 'bg-gray-600 text-white placeholder-gray-400 border-gray-500'
                        : 'bg-gray-100 text-gray-900 placeholder-gray-500 border-gray-300'
                    } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  <svg
                    className={`absolute left-3 top-2.5 w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {chats.filter(chat => 
                  chat.otherUser?.username.toLowerCase().includes(chatSearchQuery.toLowerCase())
                ).length > 0 ? (
                  chats.filter(chat => 
                    chat.otherUser?.username.toLowerCase().includes(chatSearchQuery.toLowerCase())
                  ).map(chat => (
                    <button
                      key={chat._id}
                      onClick={() => openChat(chat)}
                      className={`w-full p-4 text-left ${
                        selectedChat?._id === chat._id
                          ? theme === 'dark'
                            ? 'bg-gray-800'
                            : 'bg-white'
                          : theme === 'dark'
                          ? 'hover:bg-gray-600'
                          : 'hover:bg-gray-100'
                      } border-b ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'} transition-colors duration-200`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {chat.otherUser?.username || 'Unknown'}
                          </h3>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                            {chat.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                        {chat.unreadCount > 0 && (
                          <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-1">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p>{chatSearchQuery ? 'No chats found' : 'No conversations yet'}</p>
                    <p className="text-sm mt-2">{chatSearchQuery ? 'Try a different search' : 'Unlock items and chat with sellers!'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <div className={`p-4 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-b transition-colors duration-300 flex items-center justify-between`}>
                    <div>
                      <h2 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedUser.username}
                      </h2>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {selectedUser.hostel}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowDeleteChatModal(true)}
                        className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-gray-200 text-red-600'} transition-colors`}
                        title="Delete conversation"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
                    {messageLimit !== null && messageCount >= messageLimit && (
                      <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div>
                            <h4 className="font-semibold text-red-800 dark:text-red-300 mb-1">🚫 Message Limit Reached</h4>
                            <p className="text-sm text-red-700 dark:text-red-400">
                              You've used all {messageLimit} messages. Upgrade to Premium for unlimited messaging!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {messages.length === 0 ? (
                      <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-8`}>
                        <p className="text-sm">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((msg, index) => {
                        const isOwnMessage = msg.senderId === currentUserId;
                        const isPending = msg._id?.toString().startsWith('temp-');
                        return (
                          <div
                            key={msg._id || index}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                            onContextMenu={(e) => handleMessageRightClick(e, msg)}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm cursor-pointer ${
                                isOwnMessage
                                  ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-md hover:from-indigo-700 hover:to-indigo-800'
                                  : theme === 'dark'
                                  ? 'bg-gray-700 text-white rounded-bl-md hover:bg-gray-600'
                                  : 'bg-gray-200 text-gray-900 rounded-bl-md hover:bg-gray-300'
                              } ${isPending ? 'opacity-70' : ''} transition-colors duration-150`}
                            >
                              <p className="break-words">{msg.message}</p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <p className={`text-xs ${isOwnMessage ? 'text-indigo-200' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </p>
                                {isPending && isOwnMessage && (
                                  <svg className="w-3 h-3 animate-spin text-indigo-200" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className={`p-4 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-t transition-colors duration-300`}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder="Type a message..."
                        disabled={isSending}
                        className={`flex-1 px-4 py-3 rounded-lg ${
                          theme === 'dark'
                            ? 'bg-gray-600 text-white placeholder-gray-400 border-gray-500'
                            : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
                        } border focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!messageInput.trim() || isSending || (messageLimit !== null && messageCount >= messageLimit)}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg transition-all duration-200 font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
                      >
                        {isSending ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                          </>
                        ) : messageLimit !== null && messageCount >= messageLimit ? (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Limit Reached
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Send
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <svg className={`w-20 h-20 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Select a user to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu for Messages */}
      {contextMenu && (
        <div
          className={`fixed z-50 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl py-1 min-w-[160px]`}
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => {
              setMessageToDelete(contextMenu.message);
              setShowUnsendModal(true);
            }}
            className={`w-full px-4 py-2 text-left text-sm ${theme === 'dark' ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-100'} transition-colors flex items-center gap-2`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Unsend for everyone
          </button>
          <button
            onClick={() => handleDeleteForMe(contextMenu.messageId)}
            className={`w-full px-4 py-2 text-left text-sm ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors flex items-center gap-2`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Delete for me
          </button>
        </div>
      )}

      {/* Unsend Confirmation Modal */}
      {showUnsendModal && messageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-2xl max-w-md w-full p-6 animate-fade-in`}>
            <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Unsend Message?
            </h3>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              This message will be deleted for everyone in this conversation. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowUnsendModal(false);
                  setMessageToDelete(null);
                  setContextMenu(null);
                }}
                className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} transition-colors font-medium`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMessage(messageToDelete._id || '', messageToDelete.receiverId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Unsend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Conversation Modal */}
      {showDeleteChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-2xl max-w-md w-full p-6 animate-fade-in`}>
            <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Delete Conversation?
            </h3>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              This will delete the entire conversation with <span className="font-semibold">{selectedUser?.username}</span> for both of you. All messages will be permanently removed. You can start a fresh chat with them from the Users tab.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteChatModal(false)}
                className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} transition-colors font-medium`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConversation}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

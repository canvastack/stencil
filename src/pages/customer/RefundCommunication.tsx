import React, { useState, useRef, useEffect } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  Label,
  Textarea,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/lazy-components';
import {
  Send,
  Paperclip,
  Image,
  Phone,
  Video,
  MoreHorizontal,
  ArrowLeft,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { RefundStatus } from '@/types/refund';

// Mock data for the refund request
const mockRefund = {
  id: '1',
  requestNumber: 'RFD-20241208-001',
  orderNumber: 'ORD-20241201-001',
  status: RefundStatus.UnderInvestigation,
  customerName: 'John Doe',
  assignedAgent: {
    id: 'cs1',
    name: 'Sarah Customer Service',
    avatar: '/avatars/sarah.jpg',
    role: 'Customer Service Specialist',
    online: true
  }
};

// Mock conversation data
const mockConversation = [
  {
    id: '1',
    senderId: 'customer',
    senderName: 'John Doe',
    message: 'Selamat siang, saya ingin menanyakan status refund request saya.',
    timestamp: '2024-12-08T10:30:00Z',
    type: 'text',
    read: true
  },
  {
    id: '2',
    senderId: 'cs1',
    senderName: 'Sarah Customer Service',
    message: 'Selamat siang Pak John! Terima kasih telah menghubungi kami. Saya akan membantu Anda mengenai refund request RFD-20241208-001.',
    timestamp: '2024-12-08T10:32:00Z',
    type: 'text',
    read: true
  },
  {
    id: '3',
    senderId: 'cs1',
    senderName: 'Sarah Customer Service',
    message: 'Saya sudah melihat bukti foto yang Anda kirim. Kualitas produk memang terlihat tidak sesuai standar. Tim teknis kami sedang melakukan investigasi lebih lanjut.',
    timestamp: '2024-12-08T10:35:00Z',
    type: 'text',
    read: true
  },
  {
    id: '4',
    senderId: 'customer',
    senderName: 'John Doe',
    message: 'Baik, kira-kira berapa lama ya proses investigasinya?',
    timestamp: '2024-12-08T10:40:00Z',
    type: 'text',
    read: true
  },
  {
    id: '5',
    senderId: 'cs1',
    senderName: 'Sarah Customer Service',
    message: 'Biasanya proses investigasi memakan waktu 2-3 hari kerja. Kami akan segera menginformasikan hasilnya kepada Anda.',
    timestamp: '2024-12-08T10:42:00Z',
    type: 'text',
    read: true
  },
  {
    id: '6',
    senderId: 'system',
    senderName: 'System',
    message: 'Refund request telah disetujui oleh Finance Manager. Proses pencairan akan dimulai.',
    timestamp: '2024-12-08T14:30:00Z',
    type: 'system',
    read: true
  },
  {
    id: '7',
    senderId: 'cs1',
    senderName: 'Sarah Customer Service',
    message: 'Kabar baik Pak John! Refund request Anda telah disetujui. Dana akan dicairkan ke rekening Anda dalam 1-2 hari kerja.',
    timestamp: '2024-12-08T14:32:00Z',
    type: 'text',
    read: false
  }
];

export default function CustomerRefundCommunication() {
  const { refundId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState(mockConversation);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate agent typing
  useEffect(() => {
    // Mark unread messages as read when component mounts
    const updatedMessages = messages.map(msg => ({ ...msg, read: true }));
    setMessages(updatedMessages);
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    
    const userMessage = {
      id: Date.now().toString(),
      senderId: 'customer',
      senderName: 'John Doe',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'text' as const,
      read: true
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Simulate agent response delay
    setIsTyping(true);
    
    setTimeout(() => {
      const agentResponse = {
        id: (Date.now() + 1).toString(),
        senderId: 'cs1',
        senderName: 'Sarah Customer Service',
        message: getAutoResponse(newMessage.trim()),
        timestamp: new Date().toISOString(),
        type: 'text' as const,
        read: false
      };
      
      setMessages(prev => [...prev, agentResponse]);
      setIsTyping(false);
      setIsSending(false);
    }, 2000);
  };

  const getAutoResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('kapan') && lowerMessage.includes('selesai')) {
      return 'Berdasarkan status terkini, estimasi proses refund akan selesai dalam 1-2 hari kerja. Saya akan segera menginformasikan update terbaru kepada Anda.';
    }
    
    if (lowerMessage.includes('rekening') || lowerMessage.includes('bank')) {
      return 'Dana refund akan ditransfer ke rekening yang terdaftar dalam sistem kami. Jika ada perubahan rekening, mohon informasikan kepada kami.';
    }
    
    if (lowerMessage.includes('terima kasih')) {
      return 'Sama-sama Pak John! Jika ada pertanyaan lain terkait refund request Anda, jangan ragu untuk bertanya.';
    }
    
    return 'Terima kasih atas pertanyaan Anda. Saya akan memeriksa dan memberikan informasi yang akurat mengenai hal tersebut.';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm', { locale: id });
  };

  const formatMessageDate = (timestamp: string) => {
    return format(new Date(timestamp), 'dd MMMM yyyy', { locale: id });
  };

  const shouldShowDateSeparator = (currentMsg: any, prevMsg: any) => {
    if (!prevMsg) return true;
    
    const currentDate = new Date(currentMsg.timestamp).toDateString();
    const prevDate = new Date(prevMsg.timestamp).toDateString();
    
    return currentDate !== prevDate;
  };

  const StatusBadge = ({ status }: { status: RefundStatus }) => {
    const config = {
      [RefundStatus.PendingReview]: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
      [RefundStatus.UnderInvestigation]: { color: 'bg-blue-100 text-blue-800', label: 'Under Investigation' },
      [RefundStatus.Approved]: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      [RefundStatus.Processing]: { color: 'bg-purple-100 text-purple-800', label: 'Processing' },
      [RefundStatus.Completed]: { color: 'bg-emerald-100 text-emerald-800', label: 'Completed' },
      [RefundStatus.Rejected]: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
    };

    const { color, label } = config[status] || config[RefundStatus.PendingReview];

    return (
      <Badge className={color}>
        {label}
      </Badge>
    );
  };

  return (
    <LazyWrapper>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/customer/refund-status')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={mockRefund.assignedAgent.avatar} />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{mockRefund.assignedAgent.name}</h2>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${mockRefund.assignedAgent.online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {mockRefund.assignedAgent.online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={mockRefund.status} />
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <FileText className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Refund Details</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Request Number:</span>
                      <span className="font-mono">{mockRefund.requestNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Number:</span>
                      <span className="font-mono">{mockRefund.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <StatusBadge status={mockRefund.status} />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="ghost" size="sm">
                <Phone className="w-4 h-4" />
              </Button>
              
              <Button variant="ghost" size="sm">
                <Video className="w-4 h-4" />
              </Button>
              
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((message, index) => {
              const isCurrentUser = message.senderId === 'customer';
              const isSystem = message.senderId === 'system';
              const showDateSeparator = shouldShowDateSeparator(message, messages[index - 1]);

              return (
                <div key={message.id}>
                  {/* Date Separator */}
                  {showDateSeparator && (
                    <div className="flex items-center justify-center py-2">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {formatMessageDate(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* System Message */}
                  {isSystem && (
                    <div className="flex justify-center">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 max-w-md">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-600">System Update</span>
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-200">{message.message}</p>
                      </div>
                    </div>
                  )}

                  {/* User/Agent Message */}
                  {!isSystem && (
                    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md xl:max-w-lg flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                        {!isCurrentUser && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={mockRefund.assignedAgent.avatar} />
                            <AvatarFallback>SC</AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`rounded-lg px-4 py-2 ${
                          isCurrentUser 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                        }`}>
                          <p className="text-sm">{message.message}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className={`text-xs ${
                              isCurrentUser 
                                ? 'text-blue-100' 
                                : 'text-gray-500'
                            }`}>
                              {formatMessageTime(message.timestamp)}
                            </span>
                            {isCurrentUser && (
                              <CheckCircle2 className={`w-3 h-3 ml-2 ${
                                message.read ? 'text-blue-200' : 'text-blue-300'
                              }`} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-end gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={mockRefund.assignedAgent.avatar} />
                    <AvatarFallback>SC</AvatarFallback>
                  </Avatar>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-end gap-3">
            <Button variant="ghost" size="sm">
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="sm">
              <Image className="w-4 h-4" />
            </Button>
            
            <div className="flex-1">
              <Textarea
                placeholder="Ketik pesan Anda..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[40px] resize-none"
                rows={1}
              />
            </div>
            
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || isSending}
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>
              {mockRefund.assignedAgent.online ? 'Agent sedang online' : 'Agent akan merespons sesegera mungkin'}
            </span>
            <span>Tekan Enter untuk mengirim</span>
          </div>
        </div>
      </div>
    </LazyWrapper>
  );
}
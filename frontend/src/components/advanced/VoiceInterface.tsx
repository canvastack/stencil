import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface VoiceCommand {
  command: string;
  action: string;
  parameters?: Record<string, any>;
  confidence: number;
}

interface VoiceInterfaceProps {
  onCommand?: (command: VoiceCommand) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'floating' | 'embedded';
}

// Speech recognition types
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export function VoiceInterface({ 
  onCommand, 
  className, 
  size = 'md', 
  variant = 'button' 
}: VoiceInterfaceProps) {
  const { t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognition = useRef<any>(null);
  const synthesis = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognition.current = new SpeechRecognition();
      
      // Configure speech recognition
      recognition.current.continuous = false;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-US'; // TODO: Use current language from i18n
      recognition.current.maxAlternatives = 1;

      recognition.current.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);

        if (finalTranscript) {
          processVoiceCommand(finalTranscript);
        }
      };

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
        
        let errorMessage = 'Voice recognition error';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not accessible. Please check permissions.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
        }
        
        toast.error(errorMessage);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }

    // Check for speech synthesis support
    if ('speechSynthesis' in window) {
      synthesis.current = window.speechSynthesis;
    }

    return () => {
      if (recognition.current) {
        recognition.current.abort();
      }
      if (synthesis.current) {
        synthesis.current.cancel();
      }
    };
  }, []);

  const startListening = () => {
    if (!isSupported || !recognition.current) {
      toast.error('Voice recognition is not supported in this browser');
      return;
    }

    try {
      recognition.current.start();
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      toast.error('Failed to start voice recognition');
    }
  };

  const stopListening = () => {
    if (recognition.current) {
      recognition.current.stop();
    }
  };

  const processVoiceCommand = async (command: string) => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/admin/voice-commands', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ command })
      });

      if (!response.ok) {
        throw new Error('Failed to process voice command');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const voiceCommand: VoiceCommand = {
          command: command,
          action: result.data.action,
          parameters: result.data.parameters,
          confidence: result.data.confidence || 0.8
        };

        // Execute the command
        if (onCommand) {
          onCommand(voiceCommand);
        } else {
          executeVoiceAction(voiceCommand);
        }

        // Provide voice feedback
        if (result.data.response) {
          speak(result.data.response);
        }

        toast.success(`Command executed: ${result.data.action}`);
      } else {
        toast.error('Command not recognized. Please try again.');
        speak("I didn't understand that command. Please try again.");
      }
    } catch (error) {
      console.error('Voice command processing failed:', error);
      toast.error('Failed to process voice command');
      speak("Sorry, I couldn't process that command.");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeVoiceAction = (command: VoiceCommand) => {
    const { action, parameters } = command;

    switch (action) {
      case 'navigate':
        if (parameters?.route) {
          window.location.href = parameters.route;
        }
        break;
      
      case 'search':
        if (parameters?.query) {
          // Trigger search functionality
          const searchEvent = new CustomEvent('voiceSearch', { 
            detail: { query: parameters.query } 
          });
          window.dispatchEvent(searchEvent);
        }
        break;
      
      case 'create_order':
        window.location.href = '/admin/orders/create';
        break;
      
      case 'show_dashboard':
        window.location.href = '/admin';
        break;
      
      case 'show_analytics':
        window.location.href = '/admin/analytics';
        break;
      
      default:
        console.log('Unknown voice action:', action);
    }
  };

  const speak = (text: string) => {
    if (!synthesis.current) return;

    // Cancel any ongoing speech
    synthesis.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // TODO: Use current language from i18n
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesis.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthesis.current) {
      synthesis.current.cancel();
      setIsSpeaking(false);
    }
  };

  if (!isSupported) {
    return null; // Don't render if not supported
  }

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'h-8 w-8';
      case 'lg': return 'h-12 w-12';
      default: return 'h-10 w-10';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3';
      case 'lg': return 'h-6 w-6';
      default: return 'h-4 w-4';
    }
  };

  if (variant === 'floating') {
    return (
      <div className={cn("fixed bottom-20 right-4 z-50", className)}>
        <div className="relative">
          {/* Voice feedback indicator */}
          {(isListening || isProcessing) && (
            <div className="absolute -top-16 right-0 bg-background border rounded-lg p-2 shadow-lg min-w-[200px]">
              <div className="flex items-center gap-2">
                {isListening && (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm">Listening...</span>
                  </>
                )}
                {isProcessing && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-sm">Processing...</span>
                  </>
                )}
              </div>
              {transcript && (
                <div className="mt-2 text-xs text-muted-foreground">
                  "{transcript}"
                </div>
              )}
            </div>
          )}

          <Button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={cn(
              "rounded-full shadow-lg transition-all duration-200",
              getButtonSize(),
              isListening 
                ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {isProcessing ? (
              <Loader2 className={cn("animate-spin", getIconSize())} />
            ) : isListening ? (
              <MicOff className={getIconSize()} />
            ) : (
              <Mic className={getIconSize()} />
            )}
          </Button>

          {/* Speaker control */}
          {synthesis.current && (
            <Button
              onClick={isSpeaking ? stopSpeaking : undefined}
              variant="outline"
              size="sm"
              className={cn(
                "absolute -left-12 top-1/2 -translate-y-1/2 rounded-full",
                isSpeaking && "bg-blue-100 border-blue-300"
              )}
            >
              {isSpeaking ? (
                <VolumeX className="h-3 w-3" />
              ) : (
                <Volume2 className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'embedded') {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              <span className="font-medium">Voice Commands</span>
              <Badge variant="secondary" className="text-xs">
                {isSupported ? 'Available' : 'Not Supported'}
              </Badge>
            </div>
            
            {synthesis.current && (
              <Button
                onClick={isSpeaking ? stopSpeaking : undefined}
                variant="ghost"
                size="sm"
                disabled={!isSpeaking}
              >
                {isSpeaking ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className={cn(
                "w-full",
                isListening && "bg-red-500 hover:bg-red-600"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Voice Command
                </>
              )}
            </Button>

            {transcript && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-1">Transcript:</div>
                <div className="text-sm text-muted-foreground">"{transcript}"</div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <div className="font-medium mb-1">Try saying:</div>
              <ul className="space-y-1">
                <li>• "Show me the dashboard"</li>
                <li>• "Create a new order"</li>
                <li>• "Search for customers"</li>
                <li>• "Open analytics"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default button variant
  return (
    <Button
      onClick={isListening ? stopListening : startListening}
      disabled={isProcessing}
      variant={isListening ? "destructive" : "default"}
      size={size}
      className={cn(
        "rounded-full transition-all duration-200",
        isListening && "animate-pulse",
        className
      )}
    >
      {isProcessing ? (
        <Loader2 className={cn("animate-spin", getIconSize())} />
      ) : isListening ? (
        <MicOff className={getIconSize()} />
      ) : (
        <Mic className={getIconSize()} />
      )}
      <span className="sr-only">
        {isListening ? 'Stop voice command' : 'Start voice command'}
      </span>
    </Button>
  );
}

// Hook for voice interface functionality
export function useVoiceInterface() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  return {
    isSupported,
    speak
  };
}

// Voice command patterns for natural language processing
export const VOICE_COMMAND_PATTERNS = {
  navigation: [
    /(?:go to|open|show|navigate to)\s+(dashboard|home)/i,
    /(?:go to|open|show)\s+(orders?|order management)/i,
    /(?:go to|open|show)\s+(customers?|customer management)/i,
    /(?:go to|open|show)\s+(vendors?|vendor management)/i,
    /(?:go to|open|show)\s+(products?|product management)/i,
    /(?:go to|open|show)\s+(analytics|reports?)/i,
    /(?:go to|open|show)\s+(settings?|configuration)/i
  ],
  search: [
    /(?:search for|find|look for)\s+(.+)/i,
    /(?:show me|display)\s+(.+)/i
  ],
  actions: [
    /(?:create|add|new)\s+(order|customer|vendor|product)/i,
    /(?:delete|remove)\s+(.+)/i,
    /(?:edit|update|modify)\s+(.+)/i,
    /(?:export|download)\s+(.+)/i
  ],
  status: [
    /(?:what is|show me)\s+(?:the\s+)?status\s+of\s+(.+)/i,
    /(?:how many|count)\s+(.+)/i
  ]
};

// Voice command processor utility
export class VoiceCommandProcessor {
  static processCommand(command: string): VoiceCommand | null {
    const normalizedCommand = command.toLowerCase().trim();
    
    // Check navigation patterns
    for (const pattern of VOICE_COMMAND_PATTERNS.navigation) {
      const match = normalizedCommand.match(pattern);
      if (match) {
        const target = match[1];
        return {
          command: command,
          action: 'navigate',
          parameters: { 
            route: this.getRouteForTarget(target),
            target: target
          },
          confidence: 0.9
        };
      }
    }
    
    // Check search patterns
    for (const pattern of VOICE_COMMAND_PATTERNS.search) {
      const match = normalizedCommand.match(pattern);
      if (match) {
        return {
          command: command,
          action: 'search',
          parameters: { 
            query: match[1].trim()
          },
          confidence: 0.85
        };
      }
    }
    
    // Check action patterns
    for (const pattern of VOICE_COMMAND_PATTERNS.actions) {
      const match = normalizedCommand.match(pattern);
      if (match) {
        const actionType = this.extractActionType(normalizedCommand);
        const entity = match[1];
        
        return {
          command: command,
          action: actionType,
          parameters: { 
            entity: entity,
            route: this.getActionRoute(actionType, entity)
          },
          confidence: 0.8
        };
      }
    }
    
    // Check status patterns
    for (const pattern of VOICE_COMMAND_PATTERNS.status) {
      const match = normalizedCommand.match(pattern);
      if (match) {
        return {
          command: command,
          action: 'show_status',
          parameters: { 
            entity: match[1].trim()
          },
          confidence: 0.75
        };
      }
    }
    
    return null;
  }
  
  private static getRouteForTarget(target: string): string {
    const routes: Record<string, string> = {
      'dashboard': '/admin',
      'home': '/admin',
      'orders': '/admin/orders',
      'order': '/admin/orders',
      'customers': '/admin/customers',
      'customer': '/admin/customers',
      'vendors': '/admin/vendors',
      'vendor': '/admin/vendors',
      'products': '/admin/products',
      'product': '/admin/products',
      'analytics': '/admin/analytics',
      'reports': '/admin/analytics',
      'settings': '/admin/settings',
      'configuration': '/admin/settings'
    };
    
    return routes[target] || '/admin';
  }
  
  private static extractActionType(command: string): string {
    if (command.includes('create') || command.includes('add') || command.includes('new')) {
      return 'create';
    }
    if (command.includes('delete') || command.includes('remove')) {
      return 'delete';
    }
    if (command.includes('edit') || command.includes('update') || command.includes('modify')) {
      return 'edit';
    }
    if (command.includes('export') || command.includes('download')) {
      return 'export';
    }
    return 'view';
  }
  
  private static getActionRoute(actionType: string, entity: string): string {
    const baseRoutes: Record<string, string> = {
      'order': '/admin/orders',
      'customer': '/admin/customers',
      'vendor': '/admin/vendors',
      'product': '/admin/products'
    };
    
    const baseRoute = baseRoutes[entity] || '/admin';
    
    if (actionType === 'create') {
      return `${baseRoute}/create`;
    }
    
    return baseRoute;
  }
}
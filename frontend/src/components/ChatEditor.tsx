/**
 * 💬 Chat Editor Component
 * Natural language interface for adjusting design parameters
 * English commands only
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Sparkles } from 'lucide-react';
import { DesignerOptions } from './ImageEditor';

// Message type
interface Message {
    role: 'user' | 'ai';
    text: string;
    timestamp: Date;
}

interface ChatEditorProps {
    options: DesignerOptions;
    onOptionsChange: (options: DesignerOptions) => void;
}

// API Base URL
const API_BASE = '';

export const ChatEditor: React.FC<ChatEditorProps> = ({
    options,
    onOptionsChange,
}) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'ai',
            text: '👋 Hi! I can help you design. Try: "bigger logo", "text to top", "only 16:9"',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send command to backend
    const handleSend = async (cmdText?: string) => {
        const textToSend = cmdText || input;
        if (!textToSend.trim() || isProcessing) return;

        setInput('');
        setIsProcessing(true);

        // Add user message
        setMessages((prev) => [
            ...prev,
            { role: 'user', text: textToSend, timestamp: new Date() },
        ]);

        try {
            const response = await fetch(`${API_BASE}/api/parse-command`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    command: textToSend,
                    current_options: options,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to parse command');
            }

            const data = await response.json();

            // Apply parameter changes
            if (data.params) {
                const newOptions = { ...options };

                // Apply each parameter change
                Object.keys(data.params).forEach(key => {
                    // @ts-ignore
                    const val = data.params[key];
                    if (key === 'logo_size') newOptions.logoSize = val;
                    if (key === 'logo_position') newOptions.logoPosition = val;
                    if (key === 'logo_enabled') newOptions.logoEnabled = val;
                    if (key === 'title_font_size') newOptions.titleFontSize = val;
                    if (key === 'title_position') newOptions.textPosition = val;
                    if (key === 'title_opacity') newOptions.textOpacity = val;
                    if (key === 'formats') newOptions.selectedFormats = val;
                    if (key === 'title') newOptions.title = val;
                    if (key === 'cta') newOptions.cta = val;
                });

                onOptionsChange(newOptions);
            }

            // Add AI response
            setMessages((prev) => [
                ...prev,
                { role: 'ai', text: `✓ ${data.action || 'Updated design.'}`, timestamp: new Date() },
            ]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                { role: 'ai', text: '❌ Network error or unknown command. Backend may be offline.', timestamp: new Date() },
            ]);
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle Enter key
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Quick command buttons - English only
    const quickCommands = [
        { label: 'Bigger Logo', command: 'make logo bigger' },
        { label: 'Text to Top', command: 'move text to top' },
        { label: 'Only 16:9', command: 'only 16:9 format' },
        { label: 'No Logo', command: 'hide the logo' },
    ];

    return (
        <div className="chat-editor">
            {/* Header */}
            <div className="chat-header">
                <MessageCircle size={18} />
                <span>Chat Editor</span>
                <Sparkles size={14} className="ai-badge" />
            </div>

            {/* Messages */}
            <div className="chat-messages">
                {messages.map((msg, i) => (
                    <div key={i} className={`chat-message ${msg.role}`}>
                        <div className="message-content">{msg.text}</div>
                    </div>
                ))}
                {isProcessing && (
                    <div className="chat-message ai">
                        <div className="message-content typing">
                            <span>.</span><span>.</span><span>.</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Commands */}
            <div className="quick-commands">
                {quickCommands.map((cmd, i) => (
                    <button
                        key={i}
                        className="quick-cmd-btn"
                        onClick={() => handleSend(cmd.command)}
                    >
                        {cmd.label}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div className="chat-input">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a command..."
                    disabled={isProcessing}
                />
                <button
                    className="send-btn"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isProcessing}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default ChatEditor;

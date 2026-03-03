import { useEffect, useState } from 'react';
import { wardenApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function WardenMessages() {
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('received');
  const [sentMessages, setSentMessages] = useState<any[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposeForm, setShowComposeForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM'
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const [sent, received] = await Promise.all([
        wardenApi.getSentMessages(),
        wardenApi.getReceivedMessages()
      ]);
      setSentMessages(sent.messages || []);
      setReceivedMessages(received.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await wardenApi.sendMessage(formData);
      setFormData({ title: '', description: '', priority: 'MEDIUM' });
      setShowComposeForm(false);
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  };

  const markAsSeen = async (id: number) => {
    try {
      await wardenApi.markMessageSeen(id);
      fetchMessages();
    } catch (error) {
      console.error('Failed to mark message as seen:', error);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      LOW: 'bg-blue-100 text-blue-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.MEDIUM;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      SENT: 'bg-gray-100 text-gray-800',
      SEEN: 'bg-blue-100 text-blue-800',
      RESOLVED: 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || colors.SENT;
  };

  const messages = activeTab === 'sent' ? sentMessages : receivedMessages;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">Communicate with administration</p>
        </div>
        <Button
          onClick={() => setShowComposeForm(!showComposeForm)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {showComposeForm ? '✕ Cancel' : '✉️ New Message'}
        </Button>
      </div>

      {/* Compose Form */}
      {showComposeForm && (
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Message to Admin</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter message title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[120px]"
                  placeholder="Describe the issue or your message..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                📤 Send Message
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('received')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'received'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📥 Received ({receivedMessages.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sent'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📤 Sent ({sentMessages.length})
          </button>
        </nav>
      </div>

      {/* Messages List */}
      {messages.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-600">No messages {activeTab === 'sent' ? 'sent' : 'received'} yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id}>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{message.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {activeTab === 'received' && message.sender?.fullName && `From: ${message.sender.fullName}`}
                        {activeTab === 'sent' && 'To: Admin'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(message.priority)}`}>
                        {message.priority}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(message.status)}`}>
                        {message.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 whitespace-pre-wrap">{message.description}</p>

                  {message.adminReply && (
                    <div className="bg-emerald-50 rounded-lg p-4 mt-3">
                      <p className="text-sm font-semibold text-emerald-900 mb-2">Admin Reply:</p>
                      <p className="text-sm text-emerald-800">{message.adminReply}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                    {activeTab === 'received' && message.status === 'SENT' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsSeen(message.id)}
                      >
                        Mark as Seen
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

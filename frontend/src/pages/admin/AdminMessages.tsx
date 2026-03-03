import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function AdminMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [wardens, setWardens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'from-wardens' | 'to-wardens'>('all');
  const [showComposeForm, setShowComposeForm] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [formData, setFormData] = useState({
    wardenId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    isToAllWardens: false
  });
  const [replyData, setReplyData] = useState({
    status: '',
    adminReply: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [messagesRes, wardensRes] = await Promise.all([
        adminApi.getAllMessages(),
        adminApi.getWardens()
      ]);
      setMessages(messagesRes.messages || []);
      setWardens(wardensRes.wardens || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.sendMessageToWarden({
        ...formData,
        wardenId: formData.wardenId ? parseInt(formData.wardenId) : null
      });
      setFormData({ wardenId: '', title: '', description: '', priority: 'MEDIUM', isToAllWardens: false });
      setShowComposeForm(false);
      fetchData();
    } catch (error: any) {
      console.error('Failed to send message:', error);
      alert(error.response?.data?.message || 'Failed to send message');
    }
  };

  const handleReply = async (messageId: number) => {
    try {
      await adminApi.updateMessageStatus(messageId, replyData);
      setSelectedMessage(null);
      setReplyData({ status: '', adminReply: '' });
      fetchData();
    } catch (error: any) {
      console.error('Failed to update message:', error);
      alert('Failed to update message');
    }
  };

  const handleDeleteMessage = async (id: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await adminApi.deleteMessage(id);
      setMessages(messages.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message');
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

  const filteredMessages = messages.filter(m => {
    if (filter === 'from-wardens') return m.sender?.role === 'WARDEN';
    if (filter === 'to-wardens') return m.sender?.role !== 'WARDEN';
    return true;
  });

  const unreadCount = messages.filter(m => m.sender?.role === 'WARDEN' && m.status === 'SENT').length;

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
          <h1 className="text-3xl font-bold text-gray-900">Warden Messages</h1>
          <p className="text-gray-600 mt-1">Manage communication with wardens</p>
        </div>
        <Button
          onClick={() => setShowComposeForm(!showComposeForm)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {showComposeForm ? '✕ Cancel' : '✉️ Send Message'}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Total Messages</p>
              <p className="text-3xl font-bold text-blue-600">{messages.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Unread from Wardens</p>
              <p className="text-3xl font-bold text-red-600">{unreadCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Resolved</p>
              <p className="text-3xl font-bold text-green-600">
                {messages.filter(m => m.status === 'RESOLVED').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">High Priority</p>
              <p className="text-3xl font-bold text-orange-600">
                {messages.filter(m => m.priority === 'HIGH').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compose Form */}
      {showComposeForm && (
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Message to Warden(s)</h2>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={formData.isToAllWardens}
                  onChange={(e) => setFormData({ ...formData, isToAllWardens: e.target.checked, wardenId: '' })}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Send to all wardens (Broadcast)
                </label>
              </div>

              {!formData.isToAllWardens && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Warden <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.wardenId}
                    onChange={(e) => setFormData({ ...formData, wardenId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required={!formData.isToAllWardens}
                  >
                    <option value="">Select a warden</option>
                    {wardens.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.fullName} - {w.assignedHostel?.name || 'No Hostel'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  placeholder="Enter message content..."
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

      {/* Filter */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setFilter('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              filter === 'all'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All ({messages.length})
          </button>
          <button
            onClick={() => setFilter('from-wardens')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              filter === 'from-wardens'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            From Wardens ({messages.filter(m => m.sender?.role === 'WARDEN').length})
          </button>
          <button
            onClick={() => setFilter('to-wardens')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              filter === 'to-wardens'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            To Wardens ({messages.filter(m => m.sender?.role !== 'WARDEN').length})
          </button>
        </nav>
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-600">No messages found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <Card key={message.id}>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{message.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {message.sender?.role === 'WARDEN' ? `From: ${message.sender.fullName}` : 
                         message.isToAllWardens ? 'To: All Wardens' : `To: ${message.receiver?.fullName || 'Warden'}`}
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
                    <div className="flex gap-2">
                      {message.sender?.role === 'WARDEN' && !selectedMessage && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedMessage(message);
                            setReplyData({ status: message.status, adminReply: message.adminReply || '' });
                          }}
                        >
                          💬 Reply
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteMessage(message.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  </div>

                  {/* Reply Form */}
                  {selectedMessage?.id === message.id && (
                    <div className="bg-gray-50 rounded-lg p-4 mt-3 space-y-3">
                      <h4 className="font-semibold text-gray-900">Reply to this message</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={replyData.status}
                          onChange={(e) => setReplyData({ ...replyData, status: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="SENT">Sent</option>
                          <option value="SEEN">Seen</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Reply</label>
                        <textarea
                          value={replyData.adminReply}
                          onChange={(e) => setReplyData({ ...replyData, adminReply: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                          placeholder="Type your reply here..."
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReply(message.id)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          ✓ Send Reply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedMessage(null);
                            setReplyData({ status: '', adminReply: '' });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

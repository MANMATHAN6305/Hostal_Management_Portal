import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi, wardenApi } from '@/lib/api';

interface HeaderProps {
  onMenuClick?: () => void;
}

interface NotificationItem {
  id: string;
  category: string;
  title: string;
  description: string;
  createdAt: string;
  href?: string;
  messageId?: number;
}

const NOTIFICATION_POLL_INTERVAL_MS = 15000;
const notificationEnabledRoles = ['ADMIN', 'WARDEN'];

const formatNotificationTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
};

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Admin');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const canUseNotifications = notificationEnabledRoles.includes(userRole);

  useEffect(() => {
    const name = localStorage.getItem('userName') || 'Admin';
    const email = localStorage.getItem('userEmail') || '';
    const role = localStorage.getItem('userRole') || '';
    setUserName(name);
    setUserEmail(email);
    setUserRole(role);
  }, []);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-700';
      case 'WARDEN': return 'bg-blue-100 text-blue-700';
      case 'STAFF': return 'bg-yellow-100 text-yellow-700';
      case 'STUDENT': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('studentId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const normalizeNotificationOrder = (items: NotificationItem[]) => {
    return [...items].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
  };

  const loadNotifications = useCallback(async () => {
    if (!userRole) return;

    if (!notificationEnabledRoles.includes(userRole)) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    try {
      if (userRole === 'WARDEN') {
        const messageRes = await wardenApi.getReceivedMessages();
        const allMessages = messageRes?.messages || [];
        const unreadMessages = allMessages.filter((message: any) => message.status === 'SENT');

        const items: NotificationItem[] = [
          ...allMessages.map((message: any) => ({
            id: `warden-msg-${message.id}`,
            category: 'Admin Message',
            title: message.title || 'New message from admin',
            description: message.description || '',
            createdAt: message.createdAt || new Date().toISOString(),
            href: '/warden/messages',
            messageId: Number(message.id)
          }))
        ];

        setUnreadCount(unreadMessages.length);
        setNotifications(normalizeNotificationOrder(items).slice(0, 15));
        return;
      }

      if (userRole === 'ADMIN') {
        const messagesRes = await adminApi.getAllMessages();
        const unreadWardenMessages = (messagesRes?.messages || []).filter((message: any) =>
          message?.sender?.role === 'WARDEN' && message.status === 'SENT'
        );

        const items: NotificationItem[] = unreadWardenMessages.map((message: any) => ({
          id: `admin-msg-${message.id}`,
          category: 'Warden Message',
          title: message.title || 'New message from warden',
          description: message.description || '',
          createdAt: message.createdAt || new Date().toISOString(),
          href: '/admin-messages'
        }));

        setUnreadCount(unreadWardenMessages.length);
        setNotifications(normalizeNotificationOrder(items).slice(0, 15));
        return;
      }

      setUnreadCount(0);
      setNotifications([]);
    } catch (error) {
      setUnreadCount(0);
      setNotifications([]);
    }
  }, [userRole]);

  useEffect(() => {
    if (!userRole || !canUseNotifications) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    loadNotifications();
    const timer = setInterval(loadNotifications, NOTIFICATION_POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [userRole, canUseNotifications, loadNotifications]);

  const visibleNotifications = useMemo(() => notifications.slice(0, 8), [notifications]);

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (userRole === 'WARDEN' && notification.messageId) {
      try {
        await wardenApi.markMessageSeen(notification.messageId);
      } catch (error) {
        // Keep UX responsive even if mark-seen fails.
      }
    }

    setShowNotifications(false);
    if (notification.href) {
      navigate(notification.href);
    }
    await loadNotifications();
  };

  return (
    <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2 className="text-sm md:text-lg font-semibold text-gray-800 truncate">College Hostel Portal</h2>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {canUseNotifications && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.59 1.41L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg border z-50">
                <div className="px-4 py-3 border-b bg-gray-50">
                  <p className="text-sm font-semibold text-gray-800">Notifications</p>
                  <p className="text-xs text-gray-500">Unread: {unreadCount}</p>
                </div>

                {visibleNotifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    No new notifications.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {visibleNotifications.map((notification) => (
                      <button
                        key={notification.id}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <p className="text-xs font-semibold text-blue-700">{notification.category}</p>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">{notification.title}</p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.description || 'No additional details'}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{formatNotificationTime(notification.createdAt)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="text-right hidden sm:block">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-800">{userName}</p>
            {userRole && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(userRole)}`}>
                {userRole}
              </span>
            )}
          </div>
          {userEmail && <p className="text-xs text-gray-500">{userEmail}</p>}
        </div>

        <div className="relative group">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors">
            <span className="text-sm font-medium text-gray-700">{userName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="py-2">
              <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

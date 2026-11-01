/**
 * Claim Passport - In-App Notifications Modal / Page
 * Displays alerts for expired facts, facts expiring within 14 days, citations, and assigned reviews.
 */

import React from 'react';
import {
  Bell,
  Clock,
  AlertTriangle,
  CalendarX2,
  CheckCircle2,
  FileText,
  X,
  Check,
  ExternalLink,
} from 'lucide-react';
import { markNotificationReadApi, markAllNotificationsReadApi } from '../services/api';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: any[];
  onRefresh: () => void;
  onNavigateSubmission?: (subId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onRefresh,
  onNavigateSubmission,
}) => {
  if (!isOpen) return null;

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationReadApi(id);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadApi();
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'fact_expired':
        return <CalendarX2 className="h-4 w-4 text-rose-600" />;
      case 'fact_expiring_soon':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'fact_cited':
        return <CheckCircle2 className="h-4 w-4 text-indigo-600" />;
      default:
        return <Bell className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">In-App Notifications</h3>
              <p className="text-xs text-slate-300">Living Fact staleness alerts & review queue citations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            {notifications.filter((n) => !n.isRead).length} Unread Notifications
          </span>
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            Mark all as read
          </button>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              You are all caught up! No notifications.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl border transition ${
                  n.isRead ? 'bg-white border-slate-200 opacity-75' : 'bg-indigo-50/50 border-indigo-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-xs mt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

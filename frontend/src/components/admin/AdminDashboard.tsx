// src/components/AdminDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import ContentManager from './ContentManager';
import api, { BACKEND_URL } from '@/api';

interface UserItem {
  user_id: string;
  name: string;
  auth_methods: string[];
  is_admin: boolean;
  profile_complete: boolean;
  disabled: boolean;
  createdAt: string | null;
  lastLoginAt: string | null;
}

interface FeedbackItem {
  _id: string;
  user_id: string;
  category: string;
  feedback: string;
  status: string;
  created_at: string;
  screenshot_id?: string;
  has_screenshot: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: '#1e3a5f', text: '#60a5fa' },
  in_progress: { bg: '#3b3a1a', text: '#facc15' },
  resolved: { bg: '#1a3b2a', text: '#4ade80' },
};

const STATUS_CYCLE: Record<string, string> = {
  open: 'in_progress',
  in_progress: 'resolved',
  resolved: 'open',
};

const tabBase = 'py-2.5 px-5 bg-transparent border-none border-b-2 text-[15px] font-medium cursor-pointer font-inter';
const tabInactive = `${tabBase} border-b-transparent text-[#9DA7B7]`;
const tabActive   = `${tabBase} border-b-[#60a5fa] text-[#F9FAFB]`;

const inputCls = 'w-full py-2.5 px-3 mb-2.5 bg-brand-bg border border-brand-border-dark rounded-md text-[#E5E7EB] text-sm font-inter box-border';
const btnCls   = 'py-2 px-4.5 bg-[#353E54] text-[#E5E7EB] border-none rounded-md cursor-pointer text-sm font-medium font-inter';
const thCls    = 'text-left py-3 px-3.5 border-b border-brand-card text-[#9DA7B7] font-medium whitespace-nowrap';
const tdCls    = 'py-3 px-3.5 text-[#E5E7EB] align-top';
const badgeCls = 'py-1 px-2.5 rounded-xl border-none text-xs font-semibold cursor-pointer font-inter whitespace-nowrap';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'content' | 'feedback' | 'users'>('users');

  // Users state
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersTotal, setUsersTotalCount] = useState(0);
  const [usersTotalAll, setUsersTotalAll] = useState(0);
  const [usersHasMore, setUsersHasMore] = useState(false);
  const [usersSearch, setUsersSearch] = useState('');

  // Feedback state
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState('');
  const [feedbackTotal, setFeedbackTotal] = useState(0);
  const [feedbackHasMore, setFeedbackHasMore] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Users handlers
  const fetchUsers = useCallback(async (skip = 0, append = false) => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50', skip: String(skip) });
      if (usersSearch) params.set('search', usersSearch);
      const response = await api.get(`/admin/users?${params.toString()}`);
      const data = response.data;
      setUsersList(prev => append ? [...prev, ...data.users] : data.users);
      setUsersTotalCount(data.total_count);
      setUsersTotalAll(data.total_users);
      setUsersHasMore(data.has_more);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  }, [usersSearch]);

  useEffect(() => {
    if (activeTab === 'users') void fetchUsers();
  }, [activeTab, fetchUsers]);

  const handleToggleDisable = async (email: string) => {
    try {
      const response = await api.patch(`/admin/users/${encodeURIComponent(email)}/disable`, {});
      setUsersList(prev =>
        prev.map(u => u.user_id === email ? { ...u, disabled: response.data.disabled } : u)
      );
    } catch (error) {
      console.error('Error toggling user disable:', error);
    }
  };

  // Feedback handlers
  const fetchFeedback = useCallback(async (skip = 0, append = false) => {
    setFeedbackLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50', skip: String(skip) });
      if (feedbackFilter) params.set('status', feedbackFilter);
      const response = await api.get(`/admin/feedback?${params.toString()}`);
      const data = response.data;
      setFeedbackList(prev => append ? [...prev, ...data.feedback] : data.feedback);
      setFeedbackTotal(data.total_count);
      setFeedbackHasMore(data.has_more);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setFeedbackLoading(false);
    }
  }, [feedbackFilter]);

  useEffect(() => {
    if (activeTab === 'feedback') void fetchFeedback();
  }, [activeTab, fetchFeedback]);

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = STATUS_CYCLE[currentStatus] || 'open';
    try {
      await api.patch(`/admin/feedback/${id}/status`, { status: newStatus });
      setFeedbackList(prev =>
        prev.map(fb => fb._id === id ? { ...fb, status: newStatus } : fb)
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    try {
      await api.delete(`/admin/feedback/${id}`);
      setFeedbackList(prev => prev.filter(fb => fb._id !== id));
      setFeedbackTotal(prev => prev - 1);
    } catch (error) {
      console.error('Error deleting feedback:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (feedbackFilter) params.set('status', feedbackFilter);
      const response = await api.get(`/admin/feedback/export?${params.toString()}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'feedback_export.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="
      min-h-screen bg-[#0f1729] px-8 py-6 font-inter text-[#E5E7EB]
    ">
      <h1 className="mb-5 text-2xl font-semibold text-[#F9FAFB]">Admin Dashboard</h1>

      {/* Tab bar */}
      <div className="mb-6 flex gap-0 border-b border-brand-border-dark">
        <button className={activeTab === 'users' ? tabActive : tabInactive} onClick={() => setActiveTab('users')}>
          Users {usersTotalAll > 0 && `(${usersTotalAll})`}
        </button>
        <button className={activeTab === 'content' ? tabActive : tabInactive} onClick={() => setActiveTab('content')}>
          Content Management
        </button>
        <button className={activeTab === 'feedback' ? tabActive : tabInactive} onClick={() => setActiveTab('feedback')}>
          Feedback {feedbackTotal > 0 && `(${feedbackTotal})`}
        </button>
      </div>

      {/* Content Management Tab */}
      {activeTab === 'content' && <ContentManager />}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <input
              type="text"
              placeholder="Search by email or name..."
              value={usersSearch}
              onChange={(e) => setUsersSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void fetchUsers(); }}
              className={`
                ${inputCls}
                mb-0 max-w-80
              `}
            />
            <button onClick={() => { void fetchUsers(); }} className={btnCls}>Search</button>
            <span className="flex-1 text-sm text-[#6B7280]">
              {usersTotal === usersTotalAll ? `${usersTotalAll} users` : `${usersTotal} of ${usersTotalAll} users`}
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-brand-card">
            <table className="w-full border-collapse bg-brand-panel text-sm">
              <thead>
                <tr>
                  <th className={thCls}>Email</th>
                  <th className={thCls}>Name</th>
                  <th className={thCls}>Auth</th>
                  <th className={thCls}>Profile</th>
                  <th className={thCls}>Role</th>
                  <th className={thCls}>Created</th>
                  <th className={thCls}>Last Login</th>
                  <th className={thCls}>Status</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((user) => (
                  <tr key={user.user_id} className="border-b border-[#1e2d4a]">
                    <td className={`
                      ${tdCls}
                      max-w-55 truncate
                    `}>
                      {user.user_id}
                    </td>
                    <td className={tdCls}>{user.name || '—'}</td>
                    <td className={`
                      ${tdCls}
                      flex flex-wrap gap-1
                    `}>
                      {user.auth_methods.map((method) => (
                        <span
                          key={method}
                          className={badgeCls}
                          style={{
                            backgroundColor: method === 'google' ? '#1a3b2a' : '#1e3a5f',
                            color: method === 'google' ? '#4ade80' : '#60a5fa',
                          }}
                        >
                          {method === 'google' ? 'Google' : 'Email'}
                        </span>
                      ))}
                      {user.auth_methods.length === 0 && <span className="
                        text-[#6B7280]
                      ">—</span>}
                    </td>
                    <td className={tdCls}>
                      {user.profile_complete
                        ? <span className="text-success">Complete</span>
                        : <span className="text-[#6B7280]">Incomplete</span>
                      }
                    </td>
                    <td className={tdCls}>
                      {user.is_admin
                        ? <span className="font-semibold text-[#facc15]">Admin</span>
                        : <span className="text-[#6B7280]">User</span>
                      }
                    </td>
                    <td className={tdCls}>{user.createdAt ? formatDate(user.createdAt) : '—'}</td>
                    <td className={tdCls}>{user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}</td>
                    <td className={tdCls}>
                      <button
                        onClick={() => { void handleToggleDisable(user.user_id); }}
                        className={badgeCls}
                        style={{
                          backgroundColor: user.disabled ? '#5f1e1e' : '#1a3b2a',
                          color: user.disabled ? '#fa6060' : '#4ade80',
                        }}
                        title={user.disabled ? 'Click to enable' : 'Click to disable'}
                      >
                        {user.disabled ? 'Disabled' : 'Active'}
                      </button>
                    </td>
                  </tr>
                ))}
                {usersList.length === 0 && !usersLoading && (
                  <tr>
                    <td colSpan={8} className={`
                      ${tdCls}
                      text-center text-[#6B7280]
                    `}>No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {usersLoading && <p className="mt-4 text-center text-[#9DA7B7]">Loading...</p>}
          {usersHasMore && !usersLoading && (
            <div className="mt-4 text-center">
              <button onClick={() => { void fetchUsers(usersList.length, true); }} className={btnCls}>Load More</button>
            </div>
          )}
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <select
              value={feedbackFilter}
              onChange={(e) => setFeedbackFilter(e.target.value)}
              className="
                cursor-pointer rounded-md border border-brand-border-dark
                bg-brand-panel px-3 py-2 font-inter text-sm text-[#E5E7EB]
              "
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <span className="flex-1 text-sm text-[#6B7280]">{feedbackTotal} total</span>
            <button onClick={() => { void handleExportCSV(); }} className="
              cursor-pointer rounded-md border border-[#2563eb] bg-[#1e3a5f]
              px-4 py-2 font-inter text-sm font-medium text-[#60a5fa]
            ">
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-brand-card">
            <table className="w-full border-collapse bg-brand-panel text-sm">
              <thead>
                <tr>
                  <th className={thCls}>Date</th>
                  <th className={thCls}>User</th>
                  <th className={thCls}>Category</th>
                  <th className={`
                    ${thCls}
                    min-w-50
                  `}>Feedback</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Screenshot</th>
                  <th className={thCls}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedbackList.map((fb) => {
                  const isExpanded = expandedIds.has(fb._id);
                  const needsTruncate = fb.feedback.length > 80;
                  const displayText = (!needsTruncate || isExpanded)
                    ? fb.feedback
                    : fb.feedback.slice(0, 80) + '...';
                  const statusColor = STATUS_COLORS[fb.status];

                  return (
                    <tr key={fb._id} className="border-b border-[#1e2d4a]">
                      <td className={tdCls}>{formatDate(fb.created_at)}</td>
                      <td className={tdCls}>{fb.user_id === 'anonymous' ? 'Anonymous' : fb.user_id}</td>
                      <td className={tdCls}>{fb.category}</td>
                      <td className={tdCls}>
                        {displayText}
                        {needsTruncate && (
                          <button
                            onClick={() => toggleExpand(fb._id)}
                            className="
                              ml-1.5 cursor-pointer border-none bg-transparent
                              p-0 font-inter text-[13px] text-[#60a5fa]
                            "
                          >
                            {isExpanded ? 'Less' : 'More'}
                          </button>
                        )}
                      </td>
                      <td className={tdCls}>
                        <button
                          onClick={() => { void handleStatusToggle(fb._id, fb.status); }}
                          className={badgeCls}
                          style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                          title="Click to cycle status"
                        >
                          {STATUS_LABELS[fb.status] || fb.status}
                        </button>
                      </td>
                      <td className={tdCls}>
                        {fb.has_screenshot ? (
                          <a
                            href={`${BACKEND_URL}/feedback_file/${fb.screenshot_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                              text-[13px] font-medium text-[#60a5fa]
                              no-underline
                            "
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-[#6B7280]">—</span>
                        )}
                      </td>
                      <td className={tdCls}>
                        <button
                          onClick={() => { void handleDeleteFeedback(fb._id); }}
                          className="
                            cursor-pointer rounded-md border-none bg-[#5f1e1e]
                            px-2.5 py-1 font-inter text-xs font-semibold
                            whitespace-nowrap text-error
                          "
                          title="Delete feedback"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {feedbackList.length === 0 && !feedbackLoading && (
                  <tr>
                    <td colSpan={7} className={`
                      ${tdCls}
                      text-center text-[#6B7280]
                    `}>No feedback found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {feedbackLoading && <p className="mt-4 text-center text-[#9DA7B7]">Loading...</p>}
          {feedbackHasMore && !feedbackLoading && (
            <div className="mt-4 text-center">
              <button onClick={() => { void fetchFeedback(feedbackList.length, true); }} className={btnCls}>Load More</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

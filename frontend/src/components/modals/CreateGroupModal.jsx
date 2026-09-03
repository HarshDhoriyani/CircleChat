import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Search, Check, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Avatar } from '../common/Avatar';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { useChat } from '../../hooks/useChat';
import { useToast } from '../common/Toast';
import { DEFAULT_GROUP_AVATARS, SOCKET_EVENTS } from '../../utils/constants';

export const CreateGroupModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { socket, isUserOnline } = useSocket();
  const { createGroupChat } = useChat();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_GROUP_AVATARS[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await userApi.getAllUsers();
      const rawUsers = res.data?.users || [];
      const currentId = user?._id || user?.id;
      const map = new Map();
      rawUsers.forEach((u) => {
        if (!u || !u._id) return;
        if (currentId && String(u._id) === String(currentId)) return;
        if (!map.has(String(u._id))) {
          map.set(String(u._id), u);
        }
      });
      setUsers(Array.from(map.values()));
    } catch (err) {
      console.warn('Failed to load user directory:', err.message);
    } finally {
      setLoadingUsers(false);
    }
  }, [user]);

  // Fetch users directory on modal open
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setSelectedMemberIds([]);
      setSearchQuery('');
      setError('');
      return;
    }

    loadUsers();
  }, [isOpen, loadUsers]);

  // Real-time synchronization when new user registers
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewUserRegistered = ({ user: newUser }) => {
      const currentId = user?._id || user?.id;
      if (newUser && newUser._id && (!currentId || String(newUser._id) !== String(currentId))) {
        setUsers((prev) => {
          if (prev.some((u) => String(u._id) === String(newUser._id))) return prev;
          return [newUser, ...prev];
        });
      }
    };

    const handleUserStatusChange = ({ userId, status, customStatus, user: updatedUser }) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (String(u._id) === String(userId)) {
            return {
              ...u,
              ...(updatedUser || {}),
              status: status || u.status,
              customStatus: customStatus !== undefined ? customStatus : u.customStatus,
            };
          }
          return u;
        })
      );
    };

    socket.on(SOCKET_EVENTS.NEW_USER_REGISTERED, handleNewUserRegistered);
    socket.on(SOCKET_EVENTS.USER_STATUS_CHANGE, handleUserStatusChange);

    return () => {
      socket.off(SOCKET_EVENTS.NEW_USER_REGISTERED, handleNewUserRegistered);
      socket.off(SOCKET_EVENTS.USER_STATUS_CHANGE, handleUserStatusChange);
    };
  }, [socket, user]);

  const toggleMember = (id) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const currentId = user?._id || user?.id;
    const map = new Map();
    (users || []).forEach((u) => {
      if (!u || !u._id) return;
      if (currentId && String(u._id) === String(currentId)) return;
      if (!map.has(String(u._id))) {
        map.set(String(u._id), u);
      }
    });
    const uniqueList = Array.from(map.values());
    if (!q) return uniqueList;
    return uniqueList.filter((u) => {
      return (
        u.name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery, user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for the group');
      return;
    }
    if (selectedMemberIds.length === 0) {
      setError('Please select at least 1 member to join the group');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await createGroupChat({
        name: name.trim(),
        description: description.trim(),
        avatar: selectedAvatar,
        memberIds: selectedMemberIds,
      });

      if (res.success) {
        addToast(`Group "${name}" created successfully!`, 'success');
        onClose();
      } else {
        setError(res.error || 'Failed to create group');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Group"
      subtitle="Assemble team channels, project rooms, or topic threads"
      icon={Users}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleCreate} className="flex flex-col gap-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Group Name"
          placeholder="e.g. Design & Engineering, Sprint Alpha..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          required
        />

        <Input
          label="Description (Optional)"
          placeholder="What is this channel about?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={200}
        />

        {/* Group Avatar Presets */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-2">
            Group Cover Avatar
          </label>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
            {DEFAULT_GROUP_AVATARS.map((av, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedAvatar(av)}
                className={`relative rounded-xl overflow-hidden p-0.5 transition-all flex-shrink-0 ${
                  selectedAvatar === av
                    ? 'ring-2 ring-brand-500 scale-105 shadow-glow-sm'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <img src={av} alt="Preset" className="w-11 h-11 object-cover rounded-lg" />
              </button>
            ))}
          </div>
        </div>

        {/* Members Multi-Picker */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Add Members ({selectedMemberIds.length} selected)
            </label>
          </div>

          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search teammates by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-dark-100 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500/50"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl bg-slate-50 dark:bg-dark-100/60 p-1.5 border border-slate-200 dark:border-white/5">
            {loadingUsers ? (
              <div className="text-center py-6 text-xs text-slate-400">Loading user roster...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No teammates found</div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedMemberIds.includes(u._id);
                return (
                  <div
                    key={u._id}
                    onClick={() => toggleMember(u._id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-600/20 border border-brand-300 dark:border-brand-500/30'
                        : 'hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar src={u.avatar} name={u.name} size="sm" isOnline={isUserOnline(u._id)} status={u.status} />
                      <div className="truncate">
                        <p className="text-xs font-medium text-slate-900 dark:text-slate-200 truncate">{u.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">@{u.username}</p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-brand-600 border-brand-500 text-white'
                          : 'border-slate-300 dark:border-white/20 bg-white dark:bg-dark-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10 mt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={submitting}>
            Create Channel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateGroupModal;

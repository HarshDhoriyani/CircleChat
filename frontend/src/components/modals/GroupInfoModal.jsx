import React, { useState, useEffect } from 'react';
import { Users, Shield, UserMinus, UserPlus, LogOut, Edit3, Check, X, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { useChat } from '../../hooks/useChat';
import { userApi } from '../../api/userApi';
import { useToast } from '../common/Toast';
import { ConfirmModal } from '../common/ConfirmModal';
import { UserProfileModal } from './UserProfileModal';

export const GroupInfoModal = ({ isOpen, onClose, conversation }) => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const { updateGroupChat, addMembersToGroup, removeMemberFromGroup, leaveGroupChat } = useChat();
  const { addToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState('');
  const [selectedMemberProfile, setSelectedMemberProfile] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: null,
    icon: null,
    loading: false,
  });

  useEffect(() => {
    if (conversation) {
      setName(conversation.name || '');
      setDescription(conversation.description || '');
      setIsEditing(false);
      setIsAddingMembers(false);
      setSelectedToAdd([]);
      setError('');
    }
  }, [conversation, isOpen]);

  if (!conversation) return null;

  const isAdmin =
    conversation.creator?._id === user?._id ||
    conversation.admins?.some((a) => (typeof a === 'object' ? a._id : a) === user?._id);

  // Load users for add member picker
  const handleOpenAddMembers = async () => {
    setIsAddingMembers(true);
    try {
      const res = await userApi.getAllUsers();
      const existingIds = new Set(
        (conversation.participants || []).map((p) => (typeof p === 'object' ? p._id : p))
      );
      const remaining = (res.data?.users || []).filter((u) => !existingIds.has(u._id));
      setAvailableUsers(remaining);
    } catch (err) {
      console.warn('Failed to load user directory:', err.message);
    }
  };

  const handleSaveGroupDetails = async () => {
    if (!name.trim()) {
      setError('Group name cannot be empty');
      return;
    }
    setLoadingAction(true);
    try {
      const res = await updateGroupChat(conversation._id, {
        name: name.trim(),
        description: description.trim(),
      });
      if (res.success) {
        addToast('Group details updated', 'success');
        setIsEditing(false);
      } else {
        setError(res.error || 'Failed to update group');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAddMembersSubmit = async () => {
    if (selectedToAdd.length === 0) return;
    setLoadingAction(true);
    try {
      const res = await addMembersToGroup(conversation._id, selectedToAdd);
      if (res.success) {
        addToast('Members added to group', 'success');
        setIsAddingMembers(false);
        setSelectedToAdd([]);
      } else {
        setError(res.error || 'Failed to add members');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRemoveMember = (memberId, memberName) => {
    setConfirmDialog({
      isOpen: true,
      title: `Remove ${memberName}?`,
      message: `Are you sure you want to remove ${memberName} from this group? They will lose access to the conversation.`,
      confirmText: 'Remove Member',
      icon: UserMinus,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          const res = await removeMemberFromGroup(conversation._id, memberId);
          if (res.success) {
            addToast(`${memberName} removed`, 'info');
          } else {
            addToast(res.error || 'Failed to remove member', 'error');
          }
        } catch (err) {
          addToast(err.message, 'error');
        } finally {
          setConfirmDialog({ isOpen: false, title: '', message: '', confirmText: '', onConfirm: null, icon: null, loading: false });
        }
      },
      loading: false,
    });
  };

  const handleLeaveGroup = () => {
    setConfirmDialog({
      isOpen: true,
      title: `Leave ${conversation.name}?`,
      message: `Are you sure you want to leave "${conversation.name}"? You will no longer receive updates or messages in this channel.`,
      confirmText: 'Leave Channel',
      icon: LogOut,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          const res = await leaveGroupChat(conversation._id);
          if (res.success) {
            addToast(`You left ${conversation.name}`, 'info');
            onClose();
          } else {
            addToast(res.error || 'Failed to leave group', 'error');
          }
        } catch (err) {
          addToast(err.message, 'error');
        } finally {
          setConfirmDialog({ isOpen: false, title: '', message: '', confirmText: '', onConfirm: null, icon: null, loading: false });
        }
      },
      loading: false,
    });
  };

  return (
    <>
      <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Group Overview"
      subtitle={`${conversation.participants?.length || 0} participants`}
      icon={Users}
      maxWidth="max-w-lg"
    >
      <div className="flex flex-col gap-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Group Header Card */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-dark-100/70 border border-slate-200 dark:border-white/5">
          <Avatar
            src={conversation.avatar}
            name={conversation.name}
            isGroup={true}
            size="xl"
            showStatus={false}
          />

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white dark:bg-dark-200 border border-brand-500/50 rounded-lg px-2.5 py-1 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none"
                  placeholder="Group Name"
                />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white dark:bg-dark-200 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                  placeholder="Group Description"
                />
                <div className="flex items-center gap-2 pt-1">
                  <Button size="xs" variant="primary" icon={Check} loading={loadingAction} onClick={handleSaveGroupDetails}>
                    Save
                  </Button>
                  <Button size="xs" variant="ghost" icon={X} onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{conversation.name}</h4>
                  {isAdmin && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 p-1 rounded-md transition-colors"
                      title="Edit group info"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  {conversation.description || 'No description provided for this channel.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Members Management Area */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Members ({conversation.participants?.length || 0})
            </span>

            {isAdmin && !isAddingMembers && (
              <Button size="xs" variant="ghost" icon={UserPlus} onClick={handleOpenAddMembers}>
                Add Member
              </Button>
            )}
          </div>

          {/* Add Members Drawer */}
          {isAddingMembers ? (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-100/90 border border-brand-500/30 mb-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">Select Teammates to Add</span>
                <button
                  type="button"
                  onClick={() => setIsAddingMembers(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1">
                {availableUsers.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">All teammates are already in this group</p>
                ) : (
                  availableUsers.map((u) => {
                    const isSelected = selectedToAdd.includes(u._id);
                    return (
                      <div
                        key={u._id}
                        onClick={() =>
                          setSelectedToAdd((prev) =>
                            isSelected ? prev.filter((id) => id !== u._id) : [...prev, u._id]
                          )
                        }
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs ${
                          isSelected ? 'bg-brand-50 dark:bg-brand-600/20 border border-brand-300 dark:border-brand-500/30' : 'hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar src={u.avatar} name={u.name} size="xs" isOnline={isUserOnline(u._id)} status={u.status} />
                          <span className="text-slate-800 dark:text-slate-200">{u.name}</span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-brand-600 border-brand-500 text-white' : 'border-slate-300 dark:border-white/20'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/5">
                <Button size="xs" variant="ghost" onClick={() => setIsAddingMembers(false)}>
                  Cancel
                </Button>
                <Button
                  size="xs"
                  variant="primary"
                  loading={loadingAction}
                  disabled={selectedToAdd.length === 0}
                  onClick={handleAddMembersSubmit}
                >
                  Add {selectedToAdd.length} Member{selectedToAdd.length > 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          ) : null}

          {/* Members List */}
          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {(conversation.participants || []).map((member) => {
              const memberId = member._id || member;
              const memberName = member.name || 'Member';
              const memberUsername = member.username || '';
              const memberAvatar = member.avatar;
              const isSelf = String(memberId) === String(user?._id || user?.id);
              const isOnline = isSelf || isUserOnline(memberId);

              const isMemberAdmin =
                conversation.creator?._id === memberId ||
                (conversation.admins || []).some((a) => (typeof a === 'object' ? a._id : a) === memberId);

              const isMemberCreator = conversation.creator?._id === memberId;

              return (
                <div
                  key={memberId}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-dark-100/50 hover:bg-slate-100 dark:hover:bg-dark-100/80 border border-slate-200 dark:border-white/5 transition-colors"
                >
                  <div
                    onClick={() => setSelectedMemberProfile(member)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-90 flex-1"
                    title={`View ${memberName}'s profile`}
                  >
                    <Avatar
                      src={memberAvatar}
                      name={memberName}
                      size="sm"
                      isOnline={isOnline}
                      status={member.status}
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">{memberName}</span>
                        {isSelf && <span className="text-[10px] text-slate-400">(You)</span>}
                      </div>
                      {memberUsername && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">@{memberUsername}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isMemberCreator ? (
                      <Badge variant="brand" size="xs">
                        <Shield className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                        Creator
                      </Badge>
                    ) : isMemberAdmin ? (
                      <Badge variant="cyan" size="xs">
                        Admin
                      </Badge>
                    ) : null}

                    {isAdmin && !isMemberCreator && !isSelf && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(memberId, memberName)}
                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title={`Remove ${memberName}`}
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Leave Group Button */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/10">
          <Button size="sm" variant="danger" icon={LogOut} onClick={handleLeaveGroup}>
            Leave Channel
          </Button>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>

    {/* In-App Confirmation Modal */}
    <ConfirmModal
      isOpen={confirmDialog.isOpen}
      onClose={() => setConfirmDialog({ isOpen: false, title: '', message: '', confirmText: '', onConfirm: null, icon: null, loading: false })}
      onConfirm={confirmDialog.onConfirm}
      title={confirmDialog.title}
      message={confirmDialog.message}
      confirmText={confirmDialog.confirmText}
      cancelText="Cancel"
      confirmVariant="danger"
      icon={confirmDialog.icon}
      loading={confirmDialog.loading}
    />

    {/* Member User Profile Modal */}
    {selectedMemberProfile && (
      <UserProfileModal
        isOpen={Boolean(selectedMemberProfile)}
        onClose={() => setSelectedMemberProfile(null)}
        onChatStarted={() => {
          setSelectedMemberProfile(null);
          onClose?.();
        }}
        user={selectedMemberProfile}
      />
    )}
  </>
);
};

export default GroupInfoModal;

import React, { useState, useEffect } from 'react';
import { User, Check, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../common/Toast';
import { DEFAULT_AVATARS, USER_STATUS } from '../../utils/constants';

export const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [customStatus, setCustomStatus] = useState(user?.customStatus || '');
  const [avatar, setAvatar] = useState(user?.avatar || DEFAULT_AVATARS[0]);
  const initialStatus =
    user?.presencePreference ||
    (user?.status && user.status !== 'offline' ? user.status : USER_STATUS.ONLINE) ||
    USER_STATUS.ONLINE;
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Synchronize state whenever modal is opened
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setCustomStatus(user.customStatus || '');
      setAvatar(user.avatar || DEFAULT_AVATARS[0]);
      setStatus(
        user.presencePreference ||
        (user.status && user.status !== 'offline' ? user.status : USER_STATUS.ONLINE) ||
        USER_STATUS.ONLINE
      );
      setError('');
    }
  }, [isOpen, user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await updateProfile({
        name: name.trim(),
        customStatus: customStatus.trim(),
        avatar,
        status,
      });

      if (res.success) {
        addToast('Profile updated successfully', 'success');
        onClose();
      } else {
        setError(res.error || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      subtitle="Customize how teammates see you across CircleChat"
      icon={User}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Current Avatar Preview */}
        <div className="flex flex-col items-center justify-center gap-2 py-2">
          <Avatar
            src={avatar}
            name={name || user?.name}
            size="2xl"
            status={status}
            isOnline={true}
            showStatus={true}
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">@{user?.username}</span>
        </div>

        {/* Display Name */}
        <Input
          label="Display Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          maxLength={60}
          required
        />

        {/* Custom Status */}
        <Input
          label="Custom Status"
          value={customStatus}
          onChange={(e) => setCustomStatus(e.target.value)}
          placeholder="What are you currently working on?"
          maxLength={100}
        />

        {/* Presence Status Selector */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-2">
            Presence Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: USER_STATUS.ONLINE, label: 'Online', color: 'bg-emerald-500' },
              { id: USER_STATUS.AWAY, label: 'Away', color: 'bg-amber-500' },
              { id: USER_STATUS.BUSY, label: 'Busy', color: 'bg-rose-500' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatus(st.id)}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  status === st.id
                    ? 'bg-white dark:bg-dark-100 border-brand-500 text-slate-900 dark:text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-dark-200/50 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/15'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${st.color}`} />
                <span>{st.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Avatar Selection */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-2">
            Choose Avatar
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {DEFAULT_AVATARS.map((av, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAvatar(av)}
                className={`relative rounded-full overflow-hidden p-0.5 transition-all flex-shrink-0 ${
                  avatar === av
                    ? 'ring-2 ring-brand-500 scale-105 shadow-glow-sm'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <img src={av} alt="Avatar Preset" className="w-10 h-10 object-cover rounded-full" />
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10 mt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={saving} icon={Check}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProfileModal;

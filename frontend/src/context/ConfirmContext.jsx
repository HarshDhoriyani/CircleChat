import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ConfirmModal } from '../components/common/ConfirmModal';

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: 'Are you sure?',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmVariant: 'danger',
    icon: null,
    loading: false,
  });

  const resolverRef = useRef(null);

  const confirm = useCallback(
    ({
      title = 'Are you sure?',
      message = 'Are you sure you want to perform this action? This cannot be undone.',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmVariant = 'danger',
      icon = null,
    } = {}) => {
      return new Promise((resolve) => {
        resolverRef.current = resolve;
        setDialogState({
          isOpen: true,
          title,
          message,
          confirmText,
          cancelText,
          confirmVariant,
          icon,
          loading: false,
        });
      });
    },
    []
  );

  const handleClose = useCallback(() => {
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
    setDialogState((prev) => ({ ...prev, isOpen: false, loading: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
    setDialogState((prev) => ({ ...prev, isOpen: false, loading: false }));
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        isOpen={dialogState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        confirmVariant={dialogState.confirmVariant}
        icon={dialogState.icon}
        loading={dialogState.loading}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export default ConfirmContext;

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/common/Toast';
import { ConfirmProvider } from './context/ConfirmContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ChatPage } from './pages/ChatPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <SocketProvider>
              <ChatProvider>
                <ErrorBoundary title="CircleChat Application Error">
                <Routes>
                  {/* Public Landing Page */}
                  <Route path="/" element={<LandingPage />} />

                  {/* Public Auth Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Protected Chat Workspace Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/chat/:id" element={<ChatPage />} />
                    <Route path="/app" element={<Navigate to="/chat" replace />} />
                    <Route path="/messages" element={<Navigate to="/chat" replace />} />
                  </Route>

                  {/* 404 Not Found */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </ErrorBoundary>
            </ChatProvider>
          </SocketProvider>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  </ThemeProvider>
);
}

export default App;

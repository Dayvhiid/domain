import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import DashboardScreen from './components/DashboardScreen';
import AddConvertScreen from './components/AddConvertScreen';
import ConvertsListScreen from './components/ConvertsListScreen';
import ConvertDetailsScreen from './components/ConvertDetailsScreen';
import ReportsDashboardScreen from './components/ReportsDashboardScreen';
import DetailedReportScreen from './components/DetailedReportScreen';
import ParishAdminScreen from './components/ParishAdminScreen';
import AreaAdminScreen from './components/AreaAdminScreen';
import ZonalAdminScreen from './components/ZonalAdminScreen';
import ProfileScreen from './components/ProfileScreen';
import EditProfileScreen from './components/EditProfileScreen';
import ChangePasswordScreen from './components/ChangePasswordScreen';
import NotificationSettingsScreen from './components/NotificationSettingsScreen';
import EditConvertScreen from './components/EditConvertScreen';
import UserManagementScreen from './components/UserManagementScreen';
import { AuthResponse, User } from './services/authService';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('swa_user');
    localStorage.removeItem('swa_token');
    setCurrentScreen('login');
    setShowSplash(false);
  };

  useEffect(() => {
    // Check for Reset Password Token in URL
    const searchParams = new URLSearchParams(window.location.search);
    const resetToken = searchParams.get('token');

    if (resetToken) {
      setCurrentScreen('reset-password');
      setShowSplash(false);
      return;
    }

    // Check for existing token and user
    const storedUser = localStorage.getItem('swa_user');
    const token = localStorage.getItem('swa_token');

    if (storedUser && token && storedUser !== 'undefined' && token !== 'undefined') {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser) {
          setUser(parsedUser);
          setCurrentScreen('dashboard');
          setShowSplash(false);
        } else {
          handleLogout();
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
        handleLogout();
      }
    } else {
      // If we have partial or invalid data, clear it
      if (storedUser === 'undefined' || token === 'undefined') {
        handleLogout();
      }

      // Show splash for 3 seconds if no session
      const timer = setTimeout(() => {
        setShowSplash((prev) => {
          if (prev) {
            setCurrentScreen((screen) => (screen === 'splash' ? 'login' : screen));
            return false;
          }
          return prev;
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleLogin = (authData: any) => {
    console.log('Login response received:', authData);

    // Most robust extraction
    const token = authData.token || authData.data?.token || authData.result?.token || authData.accessToken || authData.access_token;

    let user = authData.user || authData.data?.user || authData.result?.user;
    if (!user && (authData.name || authData.email || authData._id || authData.id)) {
      user = { ...authData };
      delete user.token;
    }

    if (user && token) {
      console.log('User and token found, navigating to dashboard');
      setUser(user);
      localStorage.setItem('swa_user', JSON.stringify(user));
      localStorage.setItem('swa_token', token);
      setShowSplash(false);
      setCurrentScreen('dashboard');
    } else {
      console.error('Login validation failed. Keys found:', {
        hasUser: !!user,
        hasToken: !!token,
        authData
      });
    }
  };

  const handleSignup = (authData: any) => {
    console.log('Signup response received:', authData);
    // Most robust extraction
    const token = authData.token || authData.data?.token || authData.result?.token || authData.accessToken || authData.access_token;

    let user = authData.user || authData.data?.user || authData.result?.user;
    if (!user && (authData.name || authData.email || authData._id || authData.id)) {
      user = { ...authData };
      delete user.token;
    }

    if (user && token) {
      console.log('User and token found, navigating to dashboard');
      setUser(user);
      localStorage.setItem('swa_user', JSON.stringify(user));
      localStorage.setItem('swa_token', token);
      setShowSplash(false);
      setCurrentScreen('dashboard');
    } else {
      console.error('Signup validation failed. Keys found:', {
        hasUser: !!user,
        hasToken: !!token,
        authData
      });
    }
  };



  const handleSaveProfile = (updatedUser: User) => {
    if (updatedUser) {
      setUser(updatedUser);
      localStorage.setItem('swa_user', JSON.stringify(updatedUser));
    } else {
      console.error('Save profile failed: updatedUser is undefined');
    }
  };

  const [selectedConvertId, setSelectedConvertId] = useState<string | null>(null);
  const [reportFilters, setReportFilters] = useState<any>(null);

  const navigate = (screen: string, data: any = null) => {
    if (screen === 'detailed-report' && typeof data === 'object' && data !== null) {
      setReportFilters(data);
    } else if (typeof data === 'string') {
      setSelectedConvertId(data);
    }
    setCurrentScreen(screen);
  };

  if (showSplash) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <SplashScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-screen-xl mx-auto min-h-screen bg-white shadow-sm relative">
        <div className="h-full">
          {currentScreen === 'login' && (
            <LoginScreen
              onLogin={handleLogin}
              onNavigateSignup={() => navigate('signup')}
              onNavigateForgotPassword={() => navigate('forgot-password')}
            />
          )}
          {currentScreen === 'signup' && (
            <SignupScreen
              onSignup={handleSignup}
              onNavigateLogin={() => navigate('login')}
            />
          )}
          {currentScreen === 'forgot-password' && (
            <ForgotPasswordScreen
              onNavigateLogin={() => navigate('login')}
            />
          )}
          {currentScreen === 'reset-password' && (
            <ResetPasswordScreen
              token={new URLSearchParams(window.location.search).get('token') || ''}
              onNavigateLogin={() => {
                // Clear URL params
                window.history.replaceState({}, '', '/');
                navigate('login');
              }}
            />
          )}
          {currentScreen === 'dashboard' && (
            <DashboardScreen onNavigate={navigate} user={user} />
          )}
          {currentScreen === 'add-convert' && (
            <AddConvertScreen onNavigate={navigate} />
          )}
          {currentScreen === 'converts-list' && (
            <ConvertsListScreen onNavigate={navigate} user={user} />
          )}
          {currentScreen === 'convert-details' && (
            <ConvertDetailsScreen onNavigate={navigate} convertId={selectedConvertId} />
          )}
          {currentScreen === 'edit-convert' && (
            <EditConvertScreen onNavigate={navigate} convertId={selectedConvertId} />
          )}
          {currentScreen === 'reports' && (
            <ReportsDashboardScreen onNavigate={navigate} initialParishId={selectedConvertId} />
          )}
          {currentScreen === 'detailed-report' && (
            <DetailedReportScreen onNavigate={navigate} filters={reportFilters} />
          )}
          {currentScreen === 'parish-admin' && (
            <ParishAdminScreen onNavigate={navigate} user={user} />
          )}
          {currentScreen === 'area-admin' && (
            <AreaAdminScreen onNavigate={navigate} user={user} />
          )}
          {currentScreen === 'zonal-admin' && (
            <ZonalAdminScreen onNavigate={navigate} user={user} />
          )}
          {currentScreen === 'profile' && (
            <ProfileScreen onNavigate={navigate} onLogout={handleLogout} user={user} />
          )}
          {currentScreen === 'edit-profile' && (
            <EditProfileScreen onNavigate={navigate} onSaveProfile={handleSaveProfile} user={user} />
          )}
          {currentScreen === 'change-password' && (
            <ChangePasswordScreen onNavigate={navigate} />
          )}
          {currentScreen === 'notification-settings' && (
            <NotificationSettingsScreen onNavigate={navigate} />
          )}
          {currentScreen === 'user-management' && (
            <UserManagementScreen onNavigate={navigate} user={user} />
          )}
        </div>
      </div>
    </div>
  );
}
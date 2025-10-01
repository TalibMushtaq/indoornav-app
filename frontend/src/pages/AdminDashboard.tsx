import { useEffect, useState, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  LogOut,
  LayoutDashboard,
  Building,
  MapPin,
  Route,
  Menu,
  Settings,
  Edit,
  KeyRound,
  X,
  PlusCircle,
  Users, // ✨ 1. ICON IMPORTED HERE
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Admin {
  id: string;
  name: string;
  email: string;
}

interface DashboardStats {
  buildings: number;
  landmarks: number;
  paths: number;
}

interface EditProfileModalProps {
  admin: Admin;
  onUpdate: (admin: Admin) => void;
  onClose: () => void;
}

interface ChangePasswordModalProps {
  onClose: () => void;
}

// Utility functions
const getToken = () => localStorage.getItem('adminToken');
const logout = (navigate: ReturnType<typeof useNavigate>) => {
  localStorage.removeItem('adminToken');
  navigate('/admin/login');
};

// Modal for Editing Profile
const EditProfileModal: React.FC<EditProfileModalProps> = ({ admin, onUpdate, onClose }) => {
  const [name, setName] = useState(admin.name);
  const [email, setEmail] = useState(admin.email);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = getToken();
      if (!token) throw new Error('Unauthorized');

      const response = await fetch(`${API_BASE_URL}/api/admin/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update profile.');

      setSuccess('Profile updated successfully!');
      onUpdate(data.data.admin);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Profile</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-label="Name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          {success && <p className="text-green-500 text-sm mt-4">{success}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal for Changing Password
const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = getToken();
      if (!token) throw new Error('Unauthorized');

      const response = await fetch(`${API_BASE_URL}/api/admin/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to change password.');

      setSuccess('Password changed successfully!');
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Change Password</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          {success && <p className="text-green-500 text-sm mt-4">{success}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ buildings: 0, landmarks: 0, paths: 0 });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Fetch Admin Profile
  useEffect(() => {
    const controller = new AbortController();
    const fetchAdminProfile = async () => {
      const token = getToken();
      if (!token) return logout(navigate);

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok) throw new Error('Failed to fetch profile');

        const data = await response.json();
        setAdmin(data.data.admin);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching profile:', error);
          logout(navigate);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
    return () => controller.abort();
  }, [navigate]);

  // Fetch Dashboard Stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data.data.counts);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    if (!loading) fetchDashboardStats();
  }, [loading]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  const SidebarContent = () => (
    <nav className="flex flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-bold text-primary mb-6">NaviGuide</h1>

      {[
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/buildings', icon: Building, label: 'Buildings' },
        { path: '/admin/landmarks', icon: MapPin, label: 'Landmarks' },
        { path: '/admin/paths', icon: Route, label: 'Paths' },
        { path: '/admin/visitors', icon: Users, label: 'Visitor Logs' }, // ✨ 2. NEW LINK ADDED HERE
      ].map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
              isActive ? 'bg-muted text-primary font-medium' : 'text-muted-foreground hover:text-primary'
            }`
          }
          onClick={() => setMobileMenuOpen(false)}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <>
      {showEditModal && (
        <EditProfileModal
          admin={admin!}
          onClose={() => setShowEditModal(false)}
          onUpdate={(updatedAdmin) => setAdmin(updatedAdmin)}
        />
      )}
      {showChangePasswordModal && <ChangePasswordModal onClose={() => setShowChangePasswordModal(false)} />}
      <div className="min-h-screen bg-muted/40">
        <div className="sm:hidden fixed top-4 left-4 z-50">
          <Button variant="outline" size="sm" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-60 border-r bg-background transform transition-transform sm:flex ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="sm:hidden flex justify-end p-4">
              <Button variant="outline" size="sm" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SidebarContent />
          </div>
        </aside>

        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-60">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <div className="ml-auto flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden md:inline-block">{admin?.email}</span>
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-label="Settings menu"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-background ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowEditModal(true);
                          setDropdownOpen(false);
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted"
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit Profile
                      </button>
                      <button
                        onClick={() => {
                          setShowChangePasswordModal(true);
                          setDropdownOpen(false);
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted"
                      >
                        <KeyRound className="h-4 w-4 mr-2" /> Change Password
                      </button>
                      <div className="border-t my-1"></div>
                      <button
                        onClick={() => logout(navigate)}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-muted"
                      >
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back, {admin?.name || 'Admin'}!</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    You can manage your indoor navigation data from here.
                  </p>
                </CardContent>
              </Card>

              {/* Statistics Cards */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Overview</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { title: 'Total Buildings', icon: Building, value: stats.buildings, subtitle: 'Active building locations' },
                    { title: 'Total Landmarks', icon: MapPin, value: stats.landmarks, subtitle: 'Points of interest' },
                    { title: 'Total Paths', icon: Route, value: stats.paths, subtitle: 'Navigation routes' },
                  ].map((item) => (
                    <Card key={item.title}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {statsLoading ? <span className="animate-pulse">Loading...</span> : item.value}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{item.subtitle}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { title: 'Add Building', path: '/admin/buildings/new' },
                    { title: 'Add Landmark', path: '/admin/landmarks/new' },
                    { title: 'Add Path', path: '/admin/paths' },
                  ].map((action) => (
                    <Card
                      key={action.title}
                      className="hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(action.path)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <PlusCircle className="
                                                    h-5 w-5 text-primary" />
                          {action.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {action.title === 'Add Path'
                            ? 'Create a new navigation route'
                            : `Create a new ${action.title.split(' ')[1].toLowerCase()}`}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
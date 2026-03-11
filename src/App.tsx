import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  LayoutDashboard, 
  FileText, 
  LogOut, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  ChevronRight,
  Plus,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Staff {
  EmployeeID: number;
  FirstName: string;
  LastName: string;
  Gender: string;
  DOB: string;
  Email: string;
  Phone: string;
  Address: string;
  PostID: number;
  DeptId: number;
  PostTitle?: string;
  DeptName?: string;
  HireDate: string;
  Salary: number;
  Status: string;
  Experience: number;
}

interface Department {
  DeptId: number;
  DeptName: string;
}

interface Post {
  PostID: number;
  PostTitle: string;
}

// --- Components ---

const Input = ({ label, ...props }: any) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</label>
    <input 
      {...props} 
      className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
    />
  </div>
);

const Select = ({ label, options, ...props }: any) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</label>
    <select 
      {...props} 
      className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
    >
      <option value="">Select {label}</option>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <h3 className="font-bold text-zinc-800 text-lg">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'staff' | 'docs'>('dashboard');
  
  // Auth State
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');

  // Staff State
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filters, setFilters] = useState({ deptId: '', postId: '', minExperience: '' });
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<Partial<Staff>>({
    FirstName: '', LastName: '', Gender: 'Male', DOB: '', Email: '', Phone: '', 
    Address: '', PostID: 0, DeptId: 0, HireDate: '', Salary: 0, Status: 'Active', Experience: 0
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchMetadata();
      fetchStaff();
    }
  }, [user, filters]);

  const checkAuth = async () => {
    try {
      const res = await axios.get('/api/me');
      setUser(res.data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/login', loginData);
      setUser(res.data.user);
      setAuthError('');
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Login failed');
    }
  };

  const handleLogout = async () => {
    await axios.post('/api/logout');
    setUser(null);
  };

  const fetchMetadata = async () => {
    const [d, p] = await Promise.all([
      axios.get('/api/departments'),
      axios.get('/api/posts')
    ]);
    setDepts(d.data);
    setPosts(p.data);
  };

  const fetchStaff = async () => {
    const res = await axios.get('/api/staff', { params: filters });
    setStaffList(res.data);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await axios.put(`/api/staff/${editingStaff.EmployeeID}`, formData);
      } else {
        await axios.post('/api/staff', formData);
      }
      setIsModalOpen(false);
      setEditingStaff(null);
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error saving staff');
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      await axios.delete(`/api/staff/${id}`);
      fetchStaff();
    }
  };

  const openEditModal = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData(staff);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingStaff(null);
    setFormData({
      FirstName: '', LastName: '', Gender: 'Male', DOB: '', Email: '', Phone: '', 
      Address: '', PostID: depts[0]?.DeptId || 0, DeptId: posts[0]?.PostID || 0, 
      HireDate: new Date().toISOString().split('T')[0], Salary: 0, Status: 'Active', Experience: 0
    });
    setIsModalOpen(true);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 p-4">
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="p-8 bg-emerald-600 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <Users size={32} />
          </div>
          <h1 className="text-2xl font-bold">Hospital HR System</h1>
          <p className="text-emerald-100 text-sm mt-1">Please sign in to continue</p>
        </div>
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {authError && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              {authError}
            </div>
          )}
          <Input 
            label="Username" 
            type="text" 
            required 
            value={loginData.username}
            onChange={(e: any) => setLoginData({ ...loginData, username: e.target.value })}
          />
          <Input 
            label="Password" 
            type="password" 
            required 
            value={loginData.password}
            onChange={(e: any) => setLoginData({ ...loginData, password: e.target.value })}
          />
          <button 
            type="submit" 
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
          >
            Sign In
          </button>
        </form>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-zinc-200 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-zinc-100">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
            <Users size={24} />
          </div>
          <div>
            <h2 className="font-bold text-zinc-800 leading-tight">CarePoint HR</h2>
            <p className="text-xs text-zinc-500 font-medium">Management Suite</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')}
          />
          <SidebarItem 
            icon={<Users size={20} />} 
            label="Staff Directory" 
            active={view === 'staff'} 
            onClick={() => setView('staff')}
          />
          <SidebarItem 
            icon={<FileText size={20} />} 
            label="Documentation" 
            active={view === 'docs'} 
            onClick={() => setView('docs')}
          />
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl mb-4">
            <div className="w-10 h-10 bg-zinc-200 rounded-full flex items-center justify-center text-zinc-600 font-bold uppercase">
              {user.username[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-zinc-800 truncate">{user.username}</p>
              <p className="text-xs text-zinc-500">Administrator</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-semibold text-sm"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <header>
                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Welcome back, {user.username}</h1>
                <p className="text-zinc-500 mt-1">Here's what's happening with your staff today.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Total Staff" value={staffList.length} icon={<Users className="text-emerald-600" />} color="bg-emerald-50" />
                <StatCard label="Departments" value={depts.length} icon={<LayoutDashboard className="text-blue-600" />} color="bg-blue-50" />
                <StatCard label="Active Roles" value={posts.length} icon={<Filter className="text-purple-600" />} color="bg-purple-50" />
              </div>

              <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
                <h3 className="text-lg font-bold text-zinc-800 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={openAddModal}
                    className="flex items-center gap-4 p-6 bg-zinc-50 hover:bg-emerald-50 border border-zinc-100 hover:border-emerald-200 rounded-2xl transition-all group text-left"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                      <UserPlus size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-800">Add New Staff</p>
                      <p className="text-sm text-zinc-500">Register a new hospital employee</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setView('staff')}
                    className="flex items-center gap-4 p-6 bg-zinc-50 hover:bg-blue-50 border border-zinc-100 hover:border-blue-200 rounded-2xl transition-all group text-left"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                      <Search size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-800">Browse Directory</p>
                      <p className="text-sm text-zinc-500">Search and filter staff records</p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'staff' && (
            <motion.div 
              key="staff"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Staff Directory</h1>
                  <p className="text-zinc-500 mt-1">Manage and monitor hospital personnel</p>
                </div>
                <button 
                  onClick={openAddModal}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                >
                  <Plus size={20} />
                  Add Staff
                </button>
              </div>

              {/* Filters */}
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <Select 
                    label="Department" 
                    options={depts.map(d => ({ value: d.DeptId, label: d.DeptName }))}
                    value={filters.deptId}
                    onChange={(e: any) => setFilters({ ...filters, deptId: e.target.value })}
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Select 
                    label="Role" 
                    options={posts.map(p => ({ value: p.PostID, label: p.PostTitle }))}
                    value={filters.postId}
                    onChange={(e: any) => setFilters({ ...filters, postId: e.target.value })}
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Input 
                    label="Min. Experience (Years)" 
                    type="number"
                    value={filters.minExperience}
                    onChange={(e: any) => setFilters({ ...filters, minExperience: e.target.value })}
                  />
                </div>
                <button 
                  onClick={() => setFilters({ deptId: '', postId: '', minExperience: '' })}
                  className="px-6 py-2 text-zinc-500 hover:text-zinc-800 font-semibold text-sm transition-colors"
                >
                  Reset Filters
                </button>
              </div>

              {/* Table */}
              <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50 border-b border-zinc-100">
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Department & Role</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Experience</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {staffList.map((staff) => (
                      <tr key={staff.EmployeeID} className="hover:bg-zinc-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 font-bold">
                              {staff.FirstName[0]}{staff.LastName[0]}
                            </div>
                            <div>
                              <p className="font-bold text-zinc-800">{staff.FirstName} {staff.LastName}</p>
                              <p className="text-xs text-zinc-500">{staff.Email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-zinc-700">{staff.DeptName}</p>
                          <p className="text-xs text-zinc-500">{staff.PostTitle}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-zinc-600">{staff.Experience} Years</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            staff.Status === 'Active' ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                          )}>
                            {staff.Status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => openEditModal(staff)}
                              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteStaff(staff.EmployeeID)}
                              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {staffList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                          <div className="flex flex-col items-center gap-2">
                            <Search size={48} className="text-zinc-200" />
                            <p className="font-medium">No staff members found matching your criteria.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {view === 'docs' && (
            <motion.div 
              key="docs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <header>
                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">System Documentation</h1>
                <p className="text-zinc-500 mt-1">Architecture and data flow diagrams for the HR module.</p>
              </header>

              <div className="grid grid-cols-1 gap-8">
                <section className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                  <h2 className="text-xl font-bold text-zinc-800 mb-6 flex items-center gap-2">
                    <LayoutDashboard size={24} className="text-emerald-600" />
                    Entity Relationship Diagram (ERD)
                  </h2>
                  <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 font-mono text-sm leading-relaxed overflow-x-auto">
                    <pre>{`
[Department] 1 --- * [Staff]
  - DeptId (PK)
  - DeptName

[Post] 1 --- * [Staff]
  - PostID (PK)
  - PostTitle

[Staff] 1 --- 1 [Recruitment (Inlined in Staff)]
  - EmployeeID (PK)
  - FirstName, LastName, Email, etc.
  - HireDate, Salary, Status

[Staff] 1 --- 1 [Users]
  - UserID (PK)
  - EmployeeID (FK)
  - Username, Password
                    `}</pre>
                  </div>
                </section>

                <section className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                  <h2 className="text-xl font-bold text-zinc-800 mb-6 flex items-center gap-2">
                    <ChevronRight size={24} className="text-emerald-600" />
                    Level 1 Data Flow Diagram (DFD)
                  </h2>
                  <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 font-mono text-sm leading-relaxed overflow-x-auto">
                    <pre>{`
[HR Admin] --(Staff Data)--> [1.0 Manage Staff] <--(Staff Info)--> (Staff DB)
[HR Admin] --(Filters)-----> [2.0 View Directory] <--(Staff List)--> (Staff DB)
[HR Admin] --(Credentials)--> [3.0 Authentication] <--(User Info)--> (Users DB)
                    `}</pre>
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Staff Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingStaff ? "Edit Staff Member" : "Register New Staff"}
      >
        <form onSubmit={handleSaveStaff} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="First Name" 
              required 
              value={formData.FirstName}
              onChange={(e: any) => setFormData({ ...formData, FirstName: e.target.value })}
            />
            <Input 
              label="Last Name" 
              required 
              value={formData.LastName}
              onChange={(e: any) => setFormData({ ...formData, LastName: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Gender" 
              options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]}
              value={formData.Gender}
              onChange={(e: any) => setFormData({ ...formData, Gender: e.target.value })}
            />
            <Input 
              label="Date of Birth" 
              type="date" 
              required 
              value={formData.DOB}
              onChange={(e: any) => setFormData({ ...formData, DOB: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Email" 
              type="email" 
              required 
              value={formData.Email}
              onChange={(e: any) => setFormData({ ...formData, Email: e.target.value })}
            />
            <Input 
              label="Phone" 
              type="tel" 
              required 
              value={formData.Phone}
              onChange={(e: any) => setFormData({ ...formData, Phone: e.target.value })}
            />
          </div>

          <Input 
            label="Address" 
            value={formData.Address}
            onChange={(e: any) => setFormData({ ...formData, Address: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Department" 
              options={depts.map(d => ({ value: d.DeptId, label: d.DeptName }))}
              value={formData.DeptId}
              onChange={(e: any) => setFormData({ ...formData, DeptId: parseInt(e.target.value) })}
            />
            <Select 
              label="Role" 
              options={posts.map(p => ({ value: p.PostID, label: p.PostTitle }))}
              value={formData.PostID}
              onChange={(e: any) => setFormData({ ...formData, PostID: parseInt(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input 
              label="Hire Date" 
              type="date" 
              value={formData.HireDate}
              onChange={(e: any) => setFormData({ ...formData, HireDate: e.target.value })}
            />
            <Input 
              label="Salary" 
              type="number" 
              value={formData.Salary}
              onChange={(e: any) => setFormData({ ...formData, Salary: parseFloat(e.target.value) })}
            />
            <Input 
              label="Experience (Years)" 
              type="number" 
              value={formData.Experience}
              onChange={(e: any) => setFormData({ ...formData, Experience: parseInt(e.target.value) })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2 text-zinc-500 hover:text-zinc-800 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-8 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
            >
              {editingStaff ? "Update Staff" : "Register Staff"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// --- Sub-components ---

function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm",
        active 
          ? "bg-emerald-50 text-emerald-700 shadow-sm" 
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", color)}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-zinc-900">{value}</p>
      </div>
    </div>
  );
}

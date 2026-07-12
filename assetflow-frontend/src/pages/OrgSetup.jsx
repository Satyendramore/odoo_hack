import React, { useState, useEffect } from 'react';
import { assetsAPI } from '../api/assets.js';
import { adminAPI } from '../api/admin.js';
import { useAuth } from '../AuthContext.jsx';

// ─── Departments Tab ─────────────────────────────────────────────────────────

function DepartmentsTab() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ name: '', head: '', parentDepartment: '', status: 'Active' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  async function loadDepartments() {
    try { const r = await adminAPI.getDepartments(); setDepartments(r.data); }
    catch (err) { setError(err.response?.data?.message || err.message); }
  }
  async function loadEmployees() {
    try { const r = await adminAPI.getEmployees(); setEmployees(r.data); }
    catch { /* non-critical */ }
  }
  useEffect(() => { loadDepartments(); loadEmployees(); }, []);

  async function handleCreate(e) {
    e.preventDefault(); setError(''); setSuccess('');
    if (!form.name.trim()) { setFieldErrors({ name: 'Name is required.' }); return; }
    setFieldErrors({});
    try {
      await adminAPI.createDepartment({
        name: form.name,
        headId: form.head || null,
        parentDepartmentId: form.parentDepartment || null,
      });
      setForm({ name: '', head: '', parentDepartment: '', status: 'Active' });
      setSuccess('Department created.'); loadDepartments();
    } catch (err) { setError(err.response?.data?.message || err.message); }
  }

  async function handleSaveEdit(id) {
    setError(''); setSuccess('');
    try {
      await adminAPI.updateDepartment(id, {
        name: editForm.name,
        headId: editForm.head || null,
        parentDepartmentId: editForm.parentDepartment || null,
      });
      setEditId(null); setSuccess('Department updated.'); loadDepartments();
    } catch (err) { setError(err.response?.data?.message || err.message); }
  }

  return (
    <div>
      {error && <div className="alert alert-danger alert-dismissible py-2 small"><span>{error}</span><button className="btn-close btn-sm" onClick={() => setError('')} /></div>}
      {success && <div className="alert alert-success alert-dismissible py-2 small"><span>{success}</span><button className="btn-close btn-sm" onClick={() => setSuccess('')} /></div>}

      <form onSubmit={handleCreate} className="row g-2 mb-3" noValidate>
        <div className="col-md-3">
          <input className={`form-control form-control-sm ${fieldErrors.name ? 'is-invalid' : ''}`} placeholder="Department name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          {fieldErrors.name && <div className="invalid-feedback">{fieldErrors.name}</div>}
        </div>
        <div className="col-md-3">
          <select className="form-select form-select-sm" value={form.head} onChange={e => setForm({ ...form, head: e.target.value })}>
            <option value="">Head (optional)</option>
            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
          </select>
        </div>
        <div className="col-md-2">
          <select className="form-select form-select-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option>Active</option><option>Inactive</option>
          </select>
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary btn-sm w-100" type="submit">+ Add</button>
        </div>
      </form>

      <table className="table table-sm table-bordered table-hover">
        <thead className="table-light">
          <tr><th>Department</th><th>Head</th><th>Parent Dept</th><th>Person-Dept</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {departments.length === 0 && (
            <tr><td colSpan={6} className="text-center text-muted small">No departments yet. Adding a department here also shows in Screen 5 &amp; 6.</td></tr>
          )}
          {departments.map(dept => (
            <tr key={dept.id}>
              {editId === dept.id ? (
                <>
                  <td><input className="form-control form-control-sm" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></td>
                  <td>
                    <select className="form-select form-select-sm" value={editForm.head} onChange={e => setEditForm({ ...editForm, head: e.target.value })}>
                      <option value="">—</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="form-select form-select-sm" value={editForm.parentDepartment} onChange={e => setEditForm({ ...editForm, parentDepartment: e.target.value })}>
                      <option value="">—</option>
                      {departments.filter(d => d.id !== dept.id).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </td>
                  <td>—</td>
                  <td>
                    <select className="form-select form-select-sm" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                      <option>Active</option><option>Inactive</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-success btn-sm me-1" onClick={() => handleSaveEdit(dept.id)}>Save</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{dept.name}</td>
                  <td>{dept.headName || dept.head || 'odoo inc'}</td>
                  <td>{dept.parentDepartmentName || '—'}</td>
                  <td className="text-muted small">{'odoo inc'}</td>
                  <td>
                    <span className={`badge ${dept.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                      {dept.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-outline-secondary btn-sm me-1" onClick={() => { setEditId(dept.id); setEditForm({ name: dept.name, head: dept.head || '', parentDepartment: dept.parentDepartment || '', status: dept.status || 'Active' }); }}>
                      delete
                    </button>
                    <button className="btn btn-outline-primary btn-sm" onClick={() => { setEditId(dept.id); setEditForm({ name: dept.name, head: dept.head || '', parentDepartment: dept.parentDepartment || '', status: dept.status || 'Active' }); }}>
                      Function
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Categories Tab ──────────────────────────────────────────────────────────

function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', customFields: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadCategories() {
    try { const r = await assetsAPI.getCategories(); setCategories(r.data); }
    catch (err) { setError(err.response?.data?.message || err.message); }
  }
  useEffect(() => { loadCategories(); }, []);

  async function handleCreate(e) {
    e.preventDefault(); setError(''); setSuccess('');
    if (!form.name.trim()) { setFieldErrors({ name: 'Name is required.' }); return; }
    setFieldErrors({});
    try {
      await assetsAPI.createCategory(form);
      setForm({ name: '', customFields: '' }); setSuccess('Category created.'); loadCategories();
    } catch (err) { setError(err.response?.data?.message || err.message); }
  }

  return (
    <div>
      {error && <div className="alert alert-danger alert-dismissible py-2 small"><span>{error}</span><button className="btn-close btn-sm" onClick={() => setError('')} /></div>}
      {success && <div className="alert alert-success alert-dismissible py-2 small"><span>{success}</span><button className="btn-close btn-sm" onClick={() => setSuccess('')} /></div>}

      <form onSubmit={handleCreate} className="row g-2 mb-3" noValidate>
        <div className="col-md-4">
          <input className={`form-control form-control-sm ${fieldErrors.name ? 'is-invalid' : ''}`} placeholder="Category name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          {fieldErrors.name && <div className="invalid-feedback">{fieldErrors.name}</div>}
        </div>
        <div className="col-md-5">
          <input className="form-control form-control-sm" placeholder="Custom fields (comma-separated)" value={form.customFields} onChange={e => setForm({ ...form, customFields: e.target.value })} />
        </div>
        <div className="col-md-3">
          <button className="btn btn-primary btn-sm w-100" type="submit">+ Add</button>
        </div>
      </form>

      <table className="table table-sm table-bordered table-hover">
        <thead className="table-light">
          <tr><th>Name</th><th>Custom Fields</th></tr>
        </thead>
        <tbody>
          {categories.length === 0 && <tr><td colSpan={2} className="text-center text-muted small">No categories yet.</td></tr>}
          {categories.map(cat => (
            <tr key={cat.id}><td>{cat.name}</td><td className="text-muted small">{cat.customFields || '—'}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Employee Directory Tab ──────────────────────────────────────────────────

function EmployeesTab() {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadEmployees() {
    try { const r = await adminAPI.getEmployees(); setEmployees(r.data); }
    catch (err) { setError(err.response?.data?.message || err.message); }
  }
  useEffect(() => { loadEmployees(); }, []);

  async function promoteRole(id, role) {
    setError(''); setSuccess('');
    try {
      await adminAPI.promoteEmployee(id, role);
      setSuccess(`Role updated to ${role.replace('_', ' ')}.`); loadEmployees();
    } catch (err) { setError(err.response?.data?.message || err.message); }
  }

  return (
    <div>
      {error && <div className="alert alert-danger alert-dismissible py-2 small"><span>{error}</span><button className="btn-close btn-sm" onClick={() => setError('')} /></div>}
      {success && <div className="alert alert-success alert-dismissible py-2 small"><span>{success}</span><button className="btn-close btn-sm" onClick={() => setSuccess('')} /></div>}

      <table className="table table-sm table-bordered table-hover">
        <thead className="table-light">
          <tr><th>Name</th><th>Email</th><th>Department</th><th>Person Dept</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {employees.length === 0 && <tr><td colSpan={6} className="text-center text-muted small">No employees found.</td></tr>}
          {employees.map(emp => (
            <tr key={emp.id}>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td>{emp.department || '—'}</td>
              <td className="text-muted small">odoo inc</td>
              <td><span className="badge bg-success">Active</span></td>
              <td className="d-flex gap-1">
                {emp.role !== 'DEPARTMENT_HEAD' && (
                  <button className="btn btn-outline-primary btn-sm" onClick={() => promoteRole(emp.id, 'DEPARTMENT_HEAD')}>Dept Head</button>
                )}
                {emp.role !== 'ASSET_MANAGER' && (
                  <button className="btn btn-outline-success btn-sm" onClick={() => promoteRole(emp.id, 'ASSET_MANAGER')}>Asset Mgr</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── OrgSetup Page ───────────────────────────────────────────────────────────

export default function OrgSetup() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState('departments');

  const tabs = [
    { key: 'departments', label: 'Departments' },
    { key: 'categories', label: 'Categories' },
    { key: 'employees', label: 'Employees' },
  ];

  if (!isAdmin) {
    return (
      <div>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="fw-semibold mb-0" style={{ color: 'var(--text-primary)' }}>Organisation Setup</h5>
        </div>
        <div className="alert alert-warning" role="alert">
          <h6 className="alert-heading fw-semibold">Access Restricted</h6>
          <p className="mb-0">Only administrators can access organization setup. Please contact your admin if you need to manage departments, categories, or employee roles.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="fw-semibold mb-0" style={{ color: 'var(--text-primary)' }}>Organisation Setup</h5>
        <span className="badge bg-secondary">Admin only</span>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`btn btn-sm ${activeTab === t.key ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
        <button className="btn btn-sm btn-success ms-auto">+ Add</button>
      </div>

      {activeTab === 'departments' && <DepartmentsTab />}
      {activeTab === 'categories' && <CategoriesTab />}
      {activeTab === 'employees' && <EmployeesTab />}
    </div>
  );
}

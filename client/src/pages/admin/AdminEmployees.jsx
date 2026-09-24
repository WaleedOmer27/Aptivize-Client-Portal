import UserManagementPage from './UserManagementPage';

/**
 * AdminEmployees
 * Lists, creates, edits, and soft-deletes users with role = 'employee' or 'admin'.
 * allowRoleSelect lets the admin choose employee vs admin role during create/edit.
 */
const AdminEmployees = () => (
  <UserManagementPage
    role="employee"
    title="Employees"
    allowRoleSelect={true}
  />
);

export default AdminEmployees;

import UserManagementPage from './UserManagementPage';

/**
 * AdminClients
 * Lists, creates, edits, and soft-deletes users with role = 'client'.
 */
const AdminClients = () => (
  <UserManagementPage
    role="client"
    title="Clients"
    allowRoleSelect={false}
  />
);

export default AdminClients;

# Ticket Management System

A comprehensive ticket management system for copropriétés (condominiums).

## Security Information

This application uses Supabase with Row Level Security (RLS) policies to protect your data. The publishable key is exposed in the client-side code, but strict RLS policies ensure that users can only access data they are authorized to see.

### Security Measures Implemented:

1. **Row Level Security (RLS)**: All database tables have comprehensive RLS policies that restrict access based on user roles and ownership.

2. **Environment Variables**: The application now properly uses environment variables for configuration. Create a `.env` file based on `.env.example` for production deployments.

3. **JWT Token Management**: Automatic token refresh and secure session management.

4. **Role-Based Access Control**: Different user roles (Propriétaire, Conseil Syndical, Syndicat de Copropriété, ASL, Superadmin) have specific permissions.

### Setting Up Environment Variables

1. Copy `.env.example` to `.env`
2. Add your Supabase URL and publishable key:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   ```
3. Configure any additional environment variables as needed

### Important Security Notes:

- The publishable key is safe to use in client-side code when proper RLS policies are in place
- Never expose your Supabase service role key in client-side code
- Regularly review and update your RLS policies as your application evolves
- Monitor your Supabase dashboard for any suspicious activity

## Running the Application

```bash
pnpm install
pnpm dev
```

## Building for Production

```bash
pnpm build
pnpm preview
```

## Features

- User authentication and authorization
- Ticket creation and management
- Role-based access control
- Comprehensive filtering and search
- User profile management
- Admin dashboard for user management
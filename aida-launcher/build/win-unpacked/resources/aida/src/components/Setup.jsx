import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Setup({ onSetupComplete }) {
  const { pb } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pb) return;
    setError('');
    setIsLoading(true);

    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (password.length < 10) {
      setError('Password must be at least 10 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      await pb.send('/api/aida-setup-execute', {
        method: 'POST',
        body: {
          email,
          password,
          passwordConfirm,
        },
        requestKey: null
      });
      // If successful, call the parent component's handler to re-render the app
      onSetupComplete();
    } catch (err) {
      console.error('Setup failed:', err);
      const response = err.data;
      const validationErrors = response?.data;
      let errorMessage = response?.error || 'An unknown error occurred.';

      // Prettify PocketBase validation errors
      if (validationErrors) {
        const field = Object.keys(validationErrors)[0];
        errorMessage = validationErrors[field].message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">AIDA Initial Setup</h2>
        <p className="text-center text-gray-600">
          Create the first administrator account to get started.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Admin Email</label>
            <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                   className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                   className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input id="passwordConfirm" name="passwordConfirm" type="password" required value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)}
                   className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <button type="submit" disabled={isLoading || !pb}
                    className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300">
              {isLoading ? 'Creating Account...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
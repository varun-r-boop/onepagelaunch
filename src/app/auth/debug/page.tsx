'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

export default function AuthDebugPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const allParams = Object.fromEntries(searchParams.entries());
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Auth Debug Tool</h1>
          <p className="text-gray-600">Diagnostic information for authentication issues</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* URL Parameters */}
          <Card>
            <CardHeader>
              <CardTitle>URL Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.keys(allParams).length > 0 ? (
                  Object.entries(allParams).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-mono text-sm font-medium">{key}:</span>
                      <span className="font-mono text-sm text-gray-600">{value}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No URL parameters found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Auth State */}
          <Card>
            <CardHeader>
              <CardTitle>Current Auth State</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">User Status:</h4>
                  <p className={`px-3 py-1 rounded text-sm ${user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user ? 'Authenticated' : 'Not Authenticated'}
                  </p>
                </div>
                
                {user && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">User Info:</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <p><strong>ID:</strong> {user.id}</p>
                      <p><strong>Email:</strong> {user.email}</p>
                      <p><strong>Email Confirmed:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</p>
                      <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expected Parameters */}
          <Card>
            <CardHeader>
              <CardTitle>Expected Email Confirmation Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-2 bg-blue-50 rounded">
                  <span className="font-mono text-sm font-medium">token_hash:</span>
                  <span className="ml-2 text-sm text-gray-600">Required for email verification</span>
                </div>
                <div className="p-2 bg-blue-50 rounded">
                  <span className="font-mono text-sm font-medium">type:</span>
                  <span className="ml-2 text-sm text-gray-600">Should be &apos;signup&apos; for email confirmation</span>
                </div>
                <div className="p-2 bg-blue-50 rounded">
                  <span className="font-mono text-sm font-medium">next:</span>
                  <span className="ml-2 text-sm text-gray-600">Optional redirect URL</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 rounded">
                  <h5 className="font-medium text-yellow-800 mb-1">Missing token_hash?</h5>
                  <p className="text-sm text-yellow-700">Check your Supabase Site URL configuration</p>
                </div>
                <div className="p-3 bg-blue-50 rounded">
                  <h5 className="font-medium text-blue-800 mb-1">Wrong type parameter?</h5>
                  <p className="text-sm text-blue-700">Email template might be misconfigured</p>
                </div>
                <div className="p-3 bg-red-50 rounded">
                  <h5 className="font-medium text-red-800 mb-1">Getting auth error?</h5>
                  <p className="text-sm text-red-700">Token might be expired or invalid</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-x-4">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
          <Link href="/auth/signup">
            <Button>Try Signup Again</Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 
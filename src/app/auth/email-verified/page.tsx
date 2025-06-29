'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function EmailVerifiedPage() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <Card className="max-w-lg w-full text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-600">Email Verified!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-gray-600 text-lg">
              Great! Your email address has been successfully verified.
            </p>
            
            {slug && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">
                  <strong>Your project URL:</strong>
                </p>
                <p className="font-mono text-blue-800 bg-white px-3 py-2 rounded border">
                  onepagelaunch.vercel.app/{slug}
                </p>
              </div>
            )}
            
            <p className="text-gray-500 text-sm">
              You can now go back to the page where you came from and sign in with your verified email address.
            </p>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-400">
              If you have any issues, please contact support or try the signup process again.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
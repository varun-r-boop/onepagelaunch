import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Home } from 'lucide-react';

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader>
            <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <CardTitle className="text-2xl text-red-600">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-lg">
              Sorry, there was an error signing you in. This could be due to:
            </p>
            <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
              <li>• Network connectivity issues</li>
              <li>• OAuth configuration problems</li>
              <li>• Temporary service interruption</li>
            </ul>
            <div className="pt-4">
              <Link href="/">
                <Button size="lg">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home & Try Again
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Copy, ExternalLink } from 'lucide-react';

export default function EmailTemplatePage() {
  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  const emailTemplate = `<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup&next=/auth/email-verified">Confirm your mail</a></p>`;

  const emailTemplateWithSlug = `<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user and start building your project:</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup&next=/auth/email-verified">Confirm your mail</a></p>`;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Template Setup</h1>
          <p className="text-gray-600">Configure your Supabase email confirmation template</p>
        </div>

        <div className="grid gap-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Setup Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Step 1: Go to Supabase Dashboard</h3>
                  <p className="text-blue-800 text-sm">
                    Navigate to your Supabase project → Authentication → Email Templates → Confirm signup
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Step 2: Replace the Template</h3>
                  <p className="text-green-800 text-sm">
                    Replace the existing template with one of the templates below
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-medium text-purple-900 mb-2">Step 3: Save & Test</h3>
                  <p className="text-purple-800 text-sm">
                    Save the template and test with a new signup
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Template */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Basic Email Template
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(emailTemplate)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                  Use this template for basic email confirmation that redirects to verification confirmation page:
                </p>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm whitespace-pre-wrap">{emailTemplate}</pre>
                </div>
                <div className="p-3 bg-yellow-50 rounded text-sm">
                  <strong>What this does:</strong> After clicking the confirmation link, users will be redirected to a dedicated &quot;Email Verified&quot; page with next steps.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Issue */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">❌ Your Current Template (Problem)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <pre className="text-sm text-red-800">&lt;p&gt;&lt;a href=&quot;&#123;&#123; .ConfirmationURL &#125;&#125;&quot;&gt;Confirm your mail&lt;/a&gt;&lt;/p&gt;</pre>
                </div>
                <p className="text-red-600 text-sm">
                  <strong>Problem:</strong> The default <code>&#123;&#123; .ConfirmationURL &#125;&#125;</code> doesn&apos;t allow custom redirects and causes authentication errors.
                </p>
              </div>
            </CardContent>
          </Card>

                     {/* Advanced Template */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Project Creation Template
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(emailTemplateWithSlug)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                  Use this template to redirect users to email verification confirmation page (slug will be preserved automatically):
                </p>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm whitespace-pre-wrap">{emailTemplateWithSlug}</pre>
                </div>
                <div className="p-3 bg-blue-50 rounded text-sm">
                  <strong>Recommended:</strong> The slug parameter is automatically preserved through the confirmation flow and shown on the verification page.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testing */}
          <Card>
            <CardHeader>
              <CardTitle>🧪 Testing Your Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Update your email template in Supabase</li>
                  <li>Sign up with a new email address and slug</li>
                  <li>Check your email for the confirmation link</li>
                  <li>Click the link - you should be redirected to &quot;Email Verified&quot; page</li>
                  <li>Click &quot;Continue to Sign In&quot; from the verification page</li>
                  <li>Sign in with your email and password</li>
                  <li>You should be taken to create your project with the slug you entered</li>
                </ol>
                
                <div className="flex gap-4 flex-wrap">
                  <Link href="/auth/signup">
                    <Button>Test Signup</Button>
                  </Link>
                  <Link href="/auth/email-verified">
                    <Button variant="outline">Preview Verified Page</Button>
                  </Link>
                  <Link href="/auth/debug">
                    <Button variant="outline">Debug Tool</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 
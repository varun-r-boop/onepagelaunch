import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Palette, Smartphone, Download, Rocket } from "lucide-react";
import { AuthButton } from "@/components/auth/auth-button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="flex justify-end mb-4">
            <AuthButton />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            OnePageLaunch
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create beautiful, block-style one-page websites for your side projects in minutes. 
            Sign in to save and manage your projects.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/builder">
              <Button size="lg" className="cursor-pointer">
                <Rocket className="h-4 w-4 mr-2" />
                Start Building
              </Button>
            </Link>
          </div>
        </header>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Zap className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <CardTitle>Lightning Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Build your one-pager in minutes with our intuitive block-based editor
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Palette className="h-12 w-12 mx-auto text-purple-600 mb-4" />
              <CardTitle>Bento Style</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Modern block-grid layout that makes your features look stunning
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Smartphone className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <CardTitle>Mobile Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Fully responsive design that looks great on all devices
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Download className="h-12 w-12 mx-auto text-orange-600 mb-4" />
              <CardTitle>Export Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Download your page as HTML to host anywhere you want
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <section className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <Badge variant="outline" className="text-2xl w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                1
              </Badge>
              <h3 className="text-xl font-semibold">Fill the Form</h3>
              <p className="text-gray-600">
                Add your project name, tagline, features, and call-to-action
              </p>
            </div>
            <div className="space-y-4">
              <Badge variant="outline" className="text-2xl w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                2
              </Badge>
              <h3 className="text-xl font-semibold">Preview Live</h3>
              <p className="text-gray-600">
                See your one-pager come to life with real-time preview
              </p>
            </div>
            <div className="space-y-4">
              <Badge variant="outline" className="text-2xl w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                3
              </Badge>
              <h3 className="text-xl font-semibold">Publish & Share</h3>
              <p className="text-gray-600">
                Get a unique URL to share your project with the world
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to launch your project?</CardTitle>
              <CardDescription className="text-blue-100">
                Join thousands of makers who&apos;ve already launched their side projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/builder">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                  Create Your One-Pager Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

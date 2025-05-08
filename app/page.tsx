import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Image src="/images/logo/idx-logo.png" alt="IDX Logo" width={100} height={24} className="w-[100px]" />
          </div>
          <nav className="flex items-center gap-6">
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="mx-auto container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Manage AI Services & Clients with Precision
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    A unified AI dashboard for managing translation and prompt-based services. Generate API keys, track usage, and monitor AI-specific analytics in one place.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/login">Login to Dashboard</Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[350px] w-full overflow-hidden rounded-xl p-2">
                  <div className="absolute inset-0 flex items-center justify-center text-white bg-cover bg-center" style={{ backgroundImage: "url('/images/portal/tranlate-ai-image.jpeg')" }}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="mx-auto container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">AI Services Overview</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our AI dashboard supports multiple intelligent services for your business needs.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard title="Prompt AI" description="Generate intelligent text completions, summaries, or creative content using GPT-powered prompts." />
              <FeatureCard title="Translate AI" description="Offer multilingual support through Basic, Advanced, and Expert translation APIs." />
              <FeatureCard title="Client Management" description="Create, update, and manage client profiles with ease." />
              <FeatureCard title="API Key Generation" description="Generate and manage secure API keys for each AI service." />
              <FeatureCard title="Token & Cost Tracking" description="Monitor token usage, character counts, and associated costs for each service." />
              <FeatureCard title="Role-Based Access" description="Control access with Admin and Viewer roles for secure collaboration." />
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="mx-auto container px-4 md:px-6">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What is IDX AI Dashboard Do ?</h2>
                <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                  <li>Unified management for multiple AI services</li>
                  <li>Granular control over user roles and permissions</li>
                  <li>Detailed analytics on cost and token usage</li>
                  <li>Robust API gateway for easy integration</li>
                  <li>Scalable infrastructure built for enterprise AI workloads</li>
                </ul>
              </div>
              <div className="w-full h-96 rounded-xl overflow-hidden shadow-xl">
                <Image src="/images/portal/ai-dashboard-preview.png" alt="Dashboard Preview" width={600} height={400} className="object-cover w-full h-full" />
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="mx-auto container px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Built for Translation & Prompt Workflows</h2>
            <p className="mx-auto max-w-3xl text-muted-foreground text-lg">
              Whether you're managing localization teams or generating AI content across clients, IDX AI Dashboard provides the tools to simplify your operations and scale with confidence.
            </p>
          </div>
        </section>
      </main>

      <footer className="w-full border-t py-6">
        <div className="mx-auto container px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
            <p className="text-center text-sm leading-loose md:text-left">
              © 2025 IDX AI Dashboard
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center space-y-2 rounded-none border p-6 bg-background shadow-sm transition-all hover:shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <span className="text-lg font-bold">{title.charAt(0)}</span>
      </div>
      <h3 className="text-xl font-bold text-center">{title}</h3>
      <p className="text-center text-muted-foreground">{description}</p>
    </div>
  );
}

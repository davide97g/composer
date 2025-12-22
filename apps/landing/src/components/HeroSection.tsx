import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <img
                  src="/logo.png"
                  alt="Composer Logo"
                  className="h-12 w-12 md:h-16 md:w-16"
                />
                <span className="text-2xl md:text-3xl font-bold">Composer</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                Automate QA Testing with{" "}
                <span className="text-primary">AI-Powered</span> Form Detection
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
                Save hours of manual testing. Composer automatically detects forms,
                generates theme-based test data, and fills them with intelligent
                automation.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg px-8 py-6">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-2xl font-bold">1000+</div>
                <div className="text-sm text-muted-foreground">Forms Tested</div>
              </div>
              <div>
                <div className="text-2xl font-bold">50+</div>
                <div className="text-sm text-muted-foreground">Themes Available</div>
              </div>
              <div>
                <div className="text-2xl font-bold">99%</div>
                <div className="text-sm text-muted-foreground">Time Saved</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-video bg-muted rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="text-4xl mb-4">📱</div>
                <p className="text-muted-foreground font-medium">
                  Hero App Screenshot
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Placeholder for app preview
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


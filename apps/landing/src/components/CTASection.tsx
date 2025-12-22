import { Button } from "@/components/ui/button";
import { ArrowRight, Download } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Transform Your QA Workflow?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of developers and QA engineers who are already
              saving time with Composer.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6">
              <Download className="mr-2 h-5 w-5" />
              Download for Free
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Start Testing Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="pt-8 text-sm text-muted-foreground">
            No credit card required • Free forever • Available on macOS, Windows, and Web
          </div>
        </div>
      </div>
    </section>
  );
};


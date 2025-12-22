import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Palette, Search, CheckCircle } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Globe,
    title: "Add Website URL",
    description:
      "Simply paste the URL of the website you want to test. Composer will navigate to it automatically.",
  },
  {
    number: "02",
    icon: Palette,
    title: "Select Theme",
    description:
      "Choose from our collection of fun themes or create your own custom theme for data generation.",
  },
  {
    number: "03",
    icon: Search,
    title: "Detect & Fill Forms",
    description:
      "AI automatically detects forms on the page and fills them with contextually appropriate test data.",
  },
  {
    number: "04",
    icon: CheckCircle,
    title: "Review Results",
    description:
      "View before/after screenshots, track form submissions, and review generated data in one place.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started with Composer in four simple steps. No complex setup
            required.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-4xl font-bold text-muted-foreground/20">
                        {step.number}
                      </span>
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border transform -translate-y-1/2 z-10">
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-border border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};


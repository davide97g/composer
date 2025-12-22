import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bot, Camera, Monitor, Sparkles, Zap } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI-Powered Form Detection",
    description:
      "Intelligent form detection using advanced AI models to identify and analyze form fields automatically.",
  },
  {
    icon: Sparkles,
    title: "Theme-Based Data Generation",
    description:
      "Generate test data with fun themes like Star Wars, Marvel, Harry Potter, and more. Make testing enjoyable!",
  },
  {
    icon: Zap,
    title: "Automated Form Filling",
    description:
      "Fill forms automatically with contextually appropriate data. No more manual typing or copy-pasting.",
  },
  {
    icon: Camera,
    title: "Screenshot Tracking",
    description:
      "Capture before and after screenshots automatically. Track changes and verify form submissions visually.",
  },
  {
    icon: Monitor,
    title: "Desktop & Web App",
    description:
      "Available as both a native desktop application and web app. Use it anywhere, anytime.",
  },
  {
    icon: Sparkles,
    title: "Custom Themes",
    description:
      "Create your own custom themes with personalized data generation rules. Tailor testing to your needs.",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            Everything You Need for QA Testing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to streamline your QA workflow and make
            form testing effortless.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

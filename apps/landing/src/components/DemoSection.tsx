import { Card, CardContent } from "@/components/ui/card";

export const DemoSection = () => {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            See Composer in Action
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Watch how easy it is to automate form testing with intelligent
            detection and data generation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="overflow-hidden">
            <div className="aspect-video bg-muted flex items-center justify-center border-b">
              <div className="text-center space-y-2">
                <div className="text-4xl mb-4">🎥</div>
                <p className="text-muted-foreground font-medium">
                  Demo Video Placeholder
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Product demonstration video
                </p>
              </div>
            </div>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">
                Quick Start Demo
              </h3>
              <p className="text-muted-foreground">
                See how to set up and use Composer in under 5 minutes.
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className="aspect-video bg-muted flex items-center justify-center border-b">
              <div className="text-center space-y-2">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-muted-foreground font-medium">
                  Advanced Features Demo
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Custom themes and automation
                </p>
              </div>
            </div>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">
                Advanced Workflows
              </h3>
              <p className="text-muted-foreground">
                Learn about custom themes, screenshot tracking, and more.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((num) => (
            <Card key={num} className="overflow-hidden">
              <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="text-3xl mb-2">📱</div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Screenshot {num}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};


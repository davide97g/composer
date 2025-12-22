import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "QA Engineer",
    company: "TechCorp",
    quote:
      "Composer has completely transformed our QA workflow. We've cut form testing time by 90% and the theme-based data generation makes testing actually enjoyable!",
    avatar: "👩‍💻",
  },
  {
    name: "Michael Rodriguez",
    role: "Senior Developer",
    company: "StartupXYZ",
    quote:
      "The AI-powered form detection is incredibly accurate. It saves us hours every week, and the screenshot tracking helps us catch issues we might have missed.",
    avatar: "👨‍💻",
  },
  {
    name: "Emily Johnson",
    role: "QA Lead",
    company: "Enterprise Inc",
    quote:
      "Best QA tool we've used. The custom themes feature allows us to test edge cases we never thought of before. Highly recommend!",
    avatar: "👩‍💼",
  },
  {
    name: "David Kim",
    role: "Full Stack Developer",
    company: "DevStudio",
    quote:
      "Composer's automated form filling is a game-changer. The before/after screenshots are perfect for documentation and bug reports.",
    avatar: "👨‍🔧",
  },
  {
    name: "Lisa Wang",
    role: "Product Manager",
    company: "InnovateCo",
    quote:
      "We've integrated Composer into our CI/CD pipeline. The time savings are incredible, and our test coverage has improved significantly.",
    avatar: "👩‍💼",
  },
  {
    name: "James Taylor",
    role: "QA Automation Engineer",
    company: "ScaleUp",
    quote:
      "The desktop app is smooth and reliable. Being able to test forms across different websites quickly has made my job so much easier.",
    avatar: "👨‍💻",
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            Loved by QA Teams Everywhere
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See what developers and QA engineers are saying about Composer.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div className="flex-1">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-muted-foreground/70">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  "{testimonial.quote}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};


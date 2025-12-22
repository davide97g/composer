export const StatsSection = () => {
  const stats = [
    {
      value: "10,000+",
      label: "Forms Detected",
      description: "Successfully analyzed and tested",
    },
    {
      value: "50+",
      label: "Themes Available",
      description: "From Star Wars to custom themes",
    },
    {
      value: "500+",
      label: "Hours Saved",
      description: "By QA teams worldwide",
    },
    {
      value: "99%",
      label: "Accuracy Rate",
      description: "In form field detection",
    },
  ];

  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-lg font-semibold mb-1">{stat.label}</div>
              <div className="text-sm text-muted-foreground">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

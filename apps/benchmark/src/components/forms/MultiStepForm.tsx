import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

type Step = 1 | 2 | 3 | 4;

const MultiStepForm = () => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: "",
    email: "",
    phone: "",
    // Step 2: Preferences
    accountType: "",
    newsletter: false,
    notifications: false,
    // Step 3: Additional Info
    company: "",
    position: "",
    website: "",
    bio: "",
    // Step 4: Review
    terms: false,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Multi-Step Form Data:", formData);
    alert("Form submitted successfully!");
  };

  const isStepValid = (step: Step): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name && formData.email);
      case 2:
        return !!formData.accountType;
      case 3:
        return true; // Optional fields
      case 4:
        return formData.terms;
      default:
        return false;
    }
  };

  const progress = ((currentStep / 4) * 100).toFixed(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-Step Form</CardTitle>
        <CardDescription>
          A complex multi-step wizard with validation and conditional fields
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStep} of 4</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Preferences */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Account Preferences</h3>
              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type</Label>
                <Select
                  id="accountType"
                  value={formData.accountType}
                  onChange={(e) =>
                    handleInputChange("accountType", e.target.value)
                  }
                  required
                >
                  <option value="">Select Account Type</option>
                  <option value="personal">Personal</option>
                  <option value="business">Business</option>
                  <option value="enterprise">Enterprise</option>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="newsletter"
                    checked={formData.newsletter}
                    onChange={(e) =>
                      handleInputChange("newsletter", e.target.checked)
                    }
                  />
                  <Label htmlFor="newsletter">Subscribe to Newsletter</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notifications"
                    checked={formData.notifications}
                    onChange={(e) =>
                      handleInputChange("notifications", e.target.checked)
                    }
                  />
                  <Label htmlFor="notifications">Enable Notifications</Label>
                </div>
              </div>

              {/* Conditional Fields based on Account Type */}
              {formData.accountType === "business" && (
                <div className="space-y-2 p-4 border rounded-md bg-muted/50">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder="Acme Inc."
                    value={formData.company}
                    onChange={(e) =>
                      handleInputChange("company", e.target.value)
                    }
                  />
                </div>
              )}

              {formData.accountType === "enterprise" && (
                <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      type="text"
                      placeholder="Acme Inc."
                      value={formData.company}
                      onChange={(e) =>
                        handleInputChange("company", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      type="text"
                      placeholder="CEO"
                      value={formData.position}
                      onChange={(e) =>
                        handleInputChange("position", e.target.value)
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Additional Information */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself"
                  rows={6}
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review & Submit</h3>
              <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                <div>
                  <strong>Name:</strong> {formData.name || "Not provided"}
                </div>
                <div>
                  <strong>Email:</strong> {formData.email || "Not provided"}
                </div>
                <div>
                  <strong>Phone:</strong> {formData.phone || "Not provided"}
                </div>
                <div>
                  <strong>Account Type:</strong>{" "}
                  {formData.accountType || "Not provided"}
                </div>
                {formData.company && (
                  <div>
                    <strong>Company:</strong> {formData.company}
                  </div>
                )}
                {formData.position && (
                  <div>
                    <strong>Position:</strong> {formData.position}
                  </div>
                )}
                {formData.website && (
                  <div>
                    <strong>Website:</strong> {formData.website}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.terms}
                  onChange={(e) => handleInputChange("terms", e.target.checked)}
                  required
                />
                <Label htmlFor="terms">
                  I agree to the terms and conditions
                </Label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid(currentStep)}
              >
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={!isStepValid(currentStep)}>
                Submit
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export { MultiStepForm };

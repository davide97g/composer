import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const TextForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    heading: "",
    description: "",
    longDescription: "",
    notes: "",
    comments: "",
    feedback: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    bio: "",
    summary: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Text Form Data:", formData);
  };

  const getCharacterCount = (text: string) => text.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Text-Heavy Form</CardTitle>
        <CardDescription>
          Multiple text inputs and large textareas for content-heavy forms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Text Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                type="text"
                placeholder="Enter subtitle"
                value={formData.subtitle}
                onChange={(e) => handleInputChange("subtitle", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="heading">Heading</Label>
            <Input
              id="heading"
              type="text"
              placeholder="Enter heading"
              value={formData.heading}
              onChange={(e) => handleInputChange("heading", e.target.value)}
            />
          </div>

          {/* Description Fields */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter description"
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longDescription">Long Description</Label>
            <Textarea
              id="longDescription"
              placeholder="Enter detailed description"
              rows={5}
              value={formData.longDescription}
              onChange={(e) => handleInputChange("longDescription", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {getCharacterCount(formData.longDescription)} characters
            </p>
          </div>

          {/* Notes and Comments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter notes"
                rows={4}
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {getCharacterCount(formData.notes)} characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                placeholder="Enter comments"
                rows={4}
                value={formData.comments}
                onChange={(e) => handleInputChange("comments", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {getCharacterCount(formData.comments)} characters
              </p>
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Enter your feedback"
              rows={6}
              value={formData.feedback}
              onChange={(e) => handleInputChange("feedback", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {getCharacterCount(formData.feedback)} characters
            </p>
          </div>

          {/* Address Fields */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Address Information</h3>
            <div className="space-y-2">
              <Label htmlFor="address1">Address Line 1</Label>
              <Input
                id="address1"
                type="text"
                placeholder="Street address"
                value={formData.address1}
                onChange={(e) => handleInputChange("address1", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address2">Address Line 2</Label>
              <Input
                id="address2"
                type="text"
                placeholder="Apartment, suite, etc."
                value={formData.address2}
                onChange={(e) => handleInputChange("address2", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  type="text"
                  placeholder="Zip code"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange("zipCode", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                type="text"
                placeholder="Country"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
              />
            </div>
          </div>

          {/* Bio and Summary */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Biography</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself"
                rows={8}
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {getCharacterCount(formData.bio)} characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                placeholder="Enter summary"
                rows={6}
                value={formData.summary}
                onChange={(e) => handleInputChange("summary", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {getCharacterCount(formData.summary)} characters
              </p>
            </div>
          </div>

          <Button type="submit">Submit</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export { TextForm };


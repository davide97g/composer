import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";

const UserDataForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    gender: "",
    pronouns: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("User Data Form:", formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Standard User Data Form</CardTitle>
        <CardDescription>
          Typical registration/profile form with standard user information fields
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Address Information</h3>
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                type="text"
                placeholder="123 Main Street"
                value={formData.street}
                onChange={(e) => handleInputChange("street", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="New York"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  type="text"
                  placeholder="NY"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip/Postal Code</Label>
                <Input
                  id="zipCode"
                  type="text"
                  placeholder="10001"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange("zipCode", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                >
                  <option value="">Select Country</option>
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="ca">Canada</option>
                  <option value="au">Australia</option>
                  <option value="de">Germany</option>
                  <option value="fr">France</option>
                  <option value="it">Italy</option>
                  <option value="es">Spain</option>
                  <option value="nl">Netherlands</option>
                  <option value="be">Belgium</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Gender and Pronouns */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Gender & Pronouns</h3>
            <div className="space-y-2">
              <Label>Gender</Label>
              <RadioGroup>
                <RadioItem
                  id="gender-male"
                  name="gender"
                  value="male"
                  checked={formData.gender === "male"}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  label="Male"
                />
                <RadioItem
                  id="gender-female"
                  name="gender"
                  value="female"
                  checked={formData.gender === "female"}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  label="Female"
                />
                <RadioItem
                  id="gender-other"
                  name="gender"
                  value="other"
                  checked={formData.gender === "other"}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  label="Other"
                />
                <RadioItem
                  id="gender-prefer-not-to-say"
                  name="gender"
                  value="prefer-not-to-say"
                  checked={formData.gender === "prefer-not-to-say"}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  label="Prefer not to say"
                />
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pronouns">Pronouns</Label>
              <Select
                id="pronouns"
                value={formData.pronouns}
                onChange={(e) => handleInputChange("pronouns", e.target.value)}
              >
                <option value="">Select Pronouns</option>
                <option value="he-him">He/Him</option>
                <option value="she-her">She/Her</option>
                <option value="they-them">They/Them</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </Select>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Contact Name</Label>
                <Input
                  id="emergencyContactName"
                  type="text"
                  placeholder="Jane Doe"
                  value={formData.emergencyContactName}
                  onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  placeholder="+1 (555) 987-6543"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContactRelation">Relationship</Label>
              <Select
                id="emergencyContactRelation"
                value={formData.emergencyContactRelation}
                onChange={(e) => handleInputChange("emergencyContactRelation", e.target.value)}
              >
                <option value="">Select Relationship</option>
                <option value="spouse">Spouse</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="child">Child</option>
                <option value="friend">Friend</option>
                <option value="other">Other</option>
              </Select>
            </div>
          </div>

          <Button type="submit">Submit</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export { UserDataForm };


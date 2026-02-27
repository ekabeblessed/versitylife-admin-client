"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useCreateTenant } from "@/hooks/use-tenants";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import type { CreateTenantInput } from "@/types/tenant";

const STEPS = [
  "University Info",
  "Institution Details",
  "Resources",
  "Secrets",
  "Admin & URLs",
  "Review",
];

export default function NewTenantPage() {
  const router = useRouter();
  const createTenant = useCreateTenant();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState<CreateTenantInput>({
    tenantId: "",
    university: {
      name: "",
      fullName: "",
      code: "",
      country: "",
      timezone: "Africa/Douala",
    },
    deployment: { region: "europe-west1" },
    resources: { cpu: "1", memory: "512Mi" },
    scaling: { minInstances: 0, maxInstances: 3 },
    secrets: { MONGODB_URL: "" },
    environment: {},
    cronJobs: { enabled: true, backup: { schedule: "0 2 * * *", enabled: true } },
    initialAdmin: { email: "", firstName: "", lastName: "" },
  });

  const updateForm = (path: string, value: any) => {
    setForm((prev) => {
      const newForm = { ...prev };
      const keys = path.split(".");
      let obj: any = newForm;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return newForm;
    });
  };

  const handleSubmit = async () => {
    try {
      const result = await createTenant.mutateAsync(form);
      toast.success("University created!", { description: "Provisioning has started." });
      const jobId = result.provisioningJob?._id;
      if (jobId) {
        router.push(`/tenants/${form.tenantId}?tab=provisioning&jobId=${jobId}`);
      } else {
        router.push(`/tenants/${form.tenantId}`);
      }
    } catch (err: any) {
      toast.error("Failed to create university", {
        description: err.data?.message || err.message,
      });
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add University</h1>
          <p className="text-muted-foreground">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </p>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <Card>
        <CardContent className="pt-6">
          {/* Step 1: University Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>University Name *</Label>
                  <Input
                    value={form.university.name}
                    onChange={(e) => updateForm("university.name", e.target.value)}
                    placeholder="UBa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={form.university.fullName}
                    onChange={(e) => updateForm("university.fullName", e.target.value)}
                    placeholder="University of Bamenda"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>University Code *</Label>
                  <Input
                    value={form.university.code}
                    onChange={(e) => updateForm("university.code", e.target.value)}
                    placeholder="UBA"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tenant ID *</Label>
                  <Input
                    value={form.tenantId}
                    onChange={(e) => updateForm("tenantId", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="uba"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lowercase letters, numbers, and hyphens only
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country *</Label>
                  <Input
                    value={form.university.country}
                    onChange={(e) => updateForm("university.country", e.target.value)}
                    placeholder="Cameroon"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={form.university.timezone}
                    onValueChange={(v) => updateForm("university.timezone", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Douala">Africa/Douala (WAT)</SelectItem>
                      <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                      <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris (CET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    value={form.university.contactEmail || ""}
                    onChange={(e) => updateForm("university.contactEmail", e.target.value)}
                    placeholder="admin@university.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    value={form.university.contactPhone || ""}
                    onChange={(e) => updateForm("university.contactPhone", e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Institution Details */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                These details populate the tenant&apos;s institution profile. All fields have sensible defaults and can be updated later.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Institution Motto</Label>
                  <Input
                    value={form.environment?.INSTITUTION_MOTTO || ""}
                    onChange={(e) => updateForm("environment.INSTITUTION_MOTTO", e.target.value)}
                    placeholder="Excellence in Education"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country Motto</Label>
                  <Input
                    value={form.environment?.INSTITUTION_COUNTRY_MOTTO || ""}
                    onChange={(e) => updateForm("environment.INSTITUTION_COUNTRY_MOTTO", e.target.value)}
                    placeholder="Peace - Work - Fatherland"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={form.environment?.INSTITUTION_DESCRIPTION || ""}
                  onChange={(e) => updateForm("environment.INSTITUTION_DESCRIPTION", e.target.value)}
                  placeholder="Leading institution in higher education"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Established Year</Label>
                  <Input
                    value={form.environment?.INSTITUTION_ESTABLISHED_YEAR || ""}
                    onChange={(e) => updateForm("environment.INSTITUTION_ESTABLISHED_YEAR", e.target.value)}
                    placeholder="2020"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={form.environment?.INSTITUTION_WEBSITE || ""}
                    onChange={(e) => updateForm("environment.INSTITUTION_WEBSITE", e.target.value)}
                    placeholder="www.university.edu"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={form.environment?.INSTITUTION_ADDRESS || ""}
                  onChange={(e) => updateForm("environment.INSTITUTION_ADDRESS", e.target.value)}
                  placeholder="P.O. Box 123, City, Region, Country"
                />
              </div>
              <Separator />
              <p className="text-sm font-medium">Department Emails</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>General Email</Label>
                  <Input
                    value={form.environment?.INSTITUTION_EMAIL || ""}
                    onChange={(e) => updateForm("environment.INSTITUTION_EMAIL", e.target.value)}
                    placeholder="info@university.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={form.environment?.INSTITUTION_PHONE || ""}
                    onChange={(e) => updateForm("environment.INSTITUTION_PHONE", e.target.value)}
                    placeholder="+237 000 000 000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Registrar Email</Label>
                  <Input
                    value={form.environment?.INSTITUTION_REGISTRAR_EMAIL || ""}
                    onChange={(e) => updateForm("environment.INSTITUTION_REGISTRAR_EMAIL", e.target.value)}
                    placeholder="registrar@university.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Finance Email</Label>
                  <Input
                    value={form.environment?.INSTITUTION_FINANCE_EMAIL || ""}
                    onChange={(e) => updateForm("environment.INSTITUTION_FINANCE_EMAIL", e.target.value)}
                    placeholder="finance@university.edu"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Admissions Email</Label>
                  <Input
                    value={form.environment?.INSTITUTION_ADMISSIONS_EMAIL || ""}
                    onChange={(e) => updateForm("environment.INSTITUTION_ADMISSIONS_EMAIL", e.target.value)}
                    placeholder="admissions@university.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Admissions Phone</Label>
                  <Input
                    value={form.environment?.INSTITUTION_ADMISSIONS_PHONE || ""}
                    onChange={(e) => updateForm("environment.INSTITUTION_ADMISSIONS_PHONE", e.target.value)}
                    placeholder="+237 000 000 000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  value={form.environment?.INSTITUTION_LOGO_URL || ""}
                  onChange={(e) => updateForm("environment.INSTITUTION_LOGO_URL", e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
          )}

          {/* Step 3: Resources */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select
                    value={form.deployment?.region}
                    onValueChange={(v) => updateForm("deployment.region", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="europe-west1">Europe West 1 (Belgium)</SelectItem>
                      <SelectItem value="us-central1">US Central 1 (Iowa)</SelectItem>
                      <SelectItem value="us-east1">US East 1 (S. Carolina)</SelectItem>
                      <SelectItem value="asia-southeast1">Asia SE 1 (Singapore)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CPU</Label>
                  <Select
                    value={form.resources?.cpu}
                    onValueChange={(v) => updateForm("resources.cpu", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 vCPU</SelectItem>
                      <SelectItem value="2">2 vCPU</SelectItem>
                      <SelectItem value="4">4 vCPU</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Memory</Label>
                  <Select
                    value={form.resources?.memory}
                    onValueChange={(v) => updateForm("resources.memory", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="256Mi">256 MB</SelectItem>
                      <SelectItem value="512Mi">512 MB</SelectItem>
                      <SelectItem value="1Gi">1 GB</SelectItem>
                      <SelectItem value="2Gi">2 GB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Instances</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.scaling?.minInstances}
                    onChange={(e) => updateForm("scaling.minInstances", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Instances</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.scaling?.maxInstances}
                    onChange={(e) => updateForm("scaling.maxInstances", parseInt(e.target.value) || 3)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Secrets */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>MongoDB Connection URI *</Label>
                <Input
                  value={form.secrets.MONGODB_URL}
                  onChange={(e) => updateForm("secrets.MONGODB_URL", e.target.value)}
                  placeholder="mongodb+srv://user:pass@cluster.mongodb.net/dbname"
                  type="password"
                />
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                JWT and CRON secrets are auto-generated. Optional integrations below:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SES From Email</Label>
                  <Input
                    value={form.secrets.SES_FROM_EMAIL || ""}
                    onChange={(e) => updateForm("secrets.SES_FROM_EMAIL", e.target.value)}
                    placeholder="noreply@university.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SES From Name</Label>
                  <Input
                    value={form.secrets.SES_FROM_NAME || ""}
                    onChange={(e) => updateForm("secrets.SES_FROM_NAME", e.target.value)}
                    placeholder="University Name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>AWS Access Key ID</Label>
                  <Input
                    value={form.secrets.AWS_ACCESS_KEY_ID || ""}
                    onChange={(e) => updateForm("secrets.AWS_ACCESS_KEY_ID", e.target.value)}
                    type="password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>AWS Secret Access Key</Label>
                  <Input
                    value={form.secrets.AWS_SECRET_ACCESS_KEY || ""}
                    onChange={(e) => updateForm("secrets.AWS_SECRET_ACCESS_KEY", e.target.value)}
                    type="password"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>AWS Region</Label>
                  <Input
                    value={form.secrets.AWS_REGION || ""}
                    onChange={(e) => updateForm("secrets.AWS_REGION", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>AWS S3 Bucket</Label>
                  <Input
                    value={form.secrets.AWS_BUCKET_NAME || ""}
                    onChange={(e) => updateForm("secrets.AWS_BUCKET_NAME", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Admin Account & URLs */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will be the first super_admin user for the university.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input
                    value={form.initialAdmin.firstName}
                    onChange={(e) => updateForm("initialAdmin.firstName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input
                    value={form.initialAdmin.lastName}
                    onChange={(e) => updateForm("initialAdmin.lastName", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.initialAdmin.email}
                  onChange={(e) => updateForm("initialAdmin.email", e.target.value)}
                  placeholder="admin@university.edu"
                />
              </div>
              <div className="space-y-2">
                <Label>Password (optional — auto-generated if empty)</Label>
                <Input
                  type="password"
                  value={form.initialAdmin.password || ""}
                  onChange={(e) => updateForm("initialAdmin.password", e.target.value)}
                  placeholder="Leave empty to auto-generate"
                />
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                Frontend URLs — the Staff URL is used as the login link in the welcome email. You can update these later in the Configuration tab.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Staff Dashboard URL</Label>
                  <Input
                    value={form.environment?.FRONTEND_ADMIN_URL || ""}
                    onChange={(e) => updateForm("environment.FRONTEND_ADMIN_URL", e.target.value)}
                    placeholder="https://staff.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Student Portal URL</Label>
                  <Input
                    value={form.environment?.FRONTEND_STUDENT_URL || ""}
                    onChange={(e) => updateForm("environment.FRONTEND_STUDENT_URL", e.target.value)}
                    placeholder="https://student.example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Applicant Portal URL</Label>
                  <Input
                    value={form.environment?.FRONTEND_APPLICANT_URL || ""}
                    onChange={(e) => updateForm("environment.FRONTEND_APPLICANT_URL", e.target.value)}
                    placeholder="https://apply.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Base / Main URL</Label>
                  <Input
                    value={form.environment?.BASE_URL || ""}
                    onChange={(e) => updateForm("environment.BASE_URL", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frontend URL</Label>
                  <Input
                    value={form.environment?.FRONTEND_URL || ""}
                    onChange={(e) => updateForm("environment.FRONTEND_URL", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input
                    value={form.environment?.SUPPORT_EMAIL || ""}
                    onChange={(e) => updateForm("environment.SUPPORT_EMAIL", e.target.value)}
                    placeholder="support@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Allowed Origins (comma-separated)</Label>
                <Input
                  value={form.environment?.ALLOWED_ORIGINS || ""}
                  onChange={(e) => updateForm("environment.ALLOWED_ORIGINS", e.target.value)}
                  placeholder="https://example.com,https://staff.example.com,https://student.example.com"
                />
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {step === 5 && (
            <div className="space-y-4">
              <CardTitle className="text-lg">Review Configuration</CardTitle>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div className="text-muted-foreground">University</div>
                <div className="font-medium">{form.university.fullName}</div>
                <div className="text-muted-foreground">Tenant ID</div>
                <div className="font-mono">{form.tenantId}</div>
                <div className="text-muted-foreground">Code</div>
                <div>{form.university.code}</div>
                <div className="text-muted-foreground">Country</div>
                <div>{form.university.country}</div>
                <div className="text-muted-foreground">Region</div>
                <div>{form.deployment?.region}</div>
                <div className="text-muted-foreground">Resources</div>
                <div>{form.resources?.cpu} CPU / {form.resources?.memory}</div>
                <div className="text-muted-foreground">Scaling</div>
                <div>{form.scaling?.minInstances}-{form.scaling?.maxInstances} instances</div>
                {form.environment?.INSTITUTION_MOTTO && (
                  <>
                    <div className="text-muted-foreground">Motto</div>
                    <div>{form.environment.INSTITUTION_MOTTO}</div>
                  </>
                )}
                {form.environment?.INSTITUTION_WEBSITE && (
                  <>
                    <div className="text-muted-foreground">Website</div>
                    <div>{form.environment.INSTITUTION_WEBSITE}</div>
                  </>
                )}
                <div className="text-muted-foreground">Admin Email</div>
                <div>{form.initialAdmin.email}</div>
                {form.environment?.FRONTEND_ADMIN_URL && (
                  <>
                    <div className="text-muted-foreground">Staff Dashboard</div>
                    <div className="font-mono text-xs">{form.environment.FRONTEND_ADMIN_URL}</div>
                  </>
                )}
                {form.environment?.FRONTEND_STUDENT_URL && (
                  <>
                    <div className="text-muted-foreground">Student Portal</div>
                    <div className="font-mono text-xs">{form.environment.FRONTEND_STUDENT_URL}</div>
                  </>
                )}
                {form.environment?.FRONTEND_APPLICANT_URL && (
                  <>
                    <div className="text-muted-foreground">Applicant Portal</div>
                    <div className="font-mono text-xs">{form.environment.FRONTEND_APPLICANT_URL}</div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={createTenant.isPending}
            className="bg-deepBlue-600 hover:bg-deepBlue-700"
          >
            {createTenant.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Create & Provision
          </Button>
        )}
      </div>
    </div>
  );
}

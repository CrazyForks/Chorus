"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Key, Check, X, Copy } from "lucide-react";
import { authFetch } from "@/lib/auth-client";

interface ApiKey {
  uuid: string;
  keyPrefix: string;
  name: string | null;
  lastUsed: string | null;
  expiresAt: string | null;
  createdAt: string;
  roles: string[];
}

// PM Agent Persona presets
const PM_PERSONAS = [
  {
    id: "dev_pm",
    label: "Dev-focused PM",
    description:
      "You are a product manager who prioritizes developer experience and builds developer-first products. You understand technical constraints and communicate effectively with engineering teams.",
  },
  {
    id: "full_pm",
    label: "Full-fledged PM",
    description:
      "You are a comprehensive product manager with the mindset of building products that solve real problems for your target audience. You balance business goals, user needs, and technical feasibility.",
  },
  {
    id: "simple_pm",
    label: "Simple PM",
    description:
      "You are a focused product manager who prioritizes core features first, avoiding over-engineering. You believe in shipping fast, gathering feedback, and iterating quickly.",
  },
];

// Developer Agent Persona presets
const DEV_PERSONAS = [
  {
    id: "senior_dev",
    label: "Senior Developer",
    description:
      "You are a senior software developer with extensive experience in building scalable systems. You write clean, maintainable code and follow best practices. You mentor junior developers and make architectural decisions.",
  },
  {
    id: "fullstack_dev",
    label: "Full-stack Developer",
    description:
      "You are a versatile full-stack developer comfortable working across the entire stack. You can build APIs, design databases, and create responsive UIs. You prioritize user experience and performance.",
  },
  {
    id: "pragmatic_dev",
    label: "Pragmatic Developer",
    description:
      "You are a practical developer who focuses on delivering working solutions quickly. You avoid premature optimization, write tests for critical paths, and prefer simple solutions over complex abstractions.",
  },
];

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [customPersona, setCustomPersona] = useState("");

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await authFetch("/api/api-keys");
      const data = await response.json();
      if (data.success) {
        const keys = data.data.map(
          (key: ApiKey & { agent?: { roles: string[] } }) => ({
            ...key,
            roles: key.agent?.roles || [],
          })
        );
        setApiKeys(keys);
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const selectPersonaPreset = (description: string) => {
    setCustomPersona(description);
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName || selectedRoles.length === 0) return;

    setSubmitting(true);
    try {
      // First create an agent with the specified roles and persona
      const agentResponse = await authFetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName,
          roles: selectedRoles,
          persona: customPersona || null,
        }),
      });
      const agentData = await agentResponse.json();

      if (!agentData.success) {
        console.error("Failed to create agent:", agentData.error);
        return;
      }

      // Then create an API key for the agent
      const keyResponse = await authFetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentUuid: agentData.data.uuid,
          name: newKeyName,
        }),
      });
      const keyData = await keyResponse.json();

      if (keyData.success) {
        setCreatedKey(keyData.data.key);
        fetchApiKeys();
      }
    } catch (error) {
      console.error("Failed to create API key:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteKey = async (uuid: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      const response = await authFetch(`/api/api-keys/${uuid}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        setApiKeys(apiKeys.filter((k) => k.uuid !== uuid));
      }
    } catch (error) {
      console.error("Failed to delete API key:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setNewKeyName("");
    setSelectedRoles([]);
    setCustomPersona("");
    setCreatedKey(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Get available persona presets based on selected roles
  const getAvailablePersonas = () => {
    const personas: { id: string; label: string; description: string }[] = [];
    if (selectedRoles.includes("pm_agent")) {
      personas.push(...PM_PERSONAS);
    }
    if (selectedRoles.includes("developer_agent")) {
      personas.push(...DEV_PERSONAS);
    }
    return personas;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-[#6B6B6B]">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-xs text-[#9A9A9A]">Chorus / Settings</div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#2C2C2C]">Settings</h1>
        <p className="mt-1 text-[13px] text-[#6B6B6B]">
          Manage your account and agent configurations
        </p>
      </div>

      {/* Agents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Agents</h2>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create API Key
          </Button>
        </div>

        <p className="text-[13px] text-muted-foreground">
          Create API keys to allow your personal agents to access Chorus. Each
          key can be assigned different roles.
        </p>

        {/* API Keys List */}
        {apiKeys.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Key className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No API keys yet. Create one to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.uuid}
                className="rounded-xl border border-border bg-card p-5"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        key.roles.includes("developer_agent")
                          ? "bg-green-100"
                          : "bg-primary/10"
                      }`}
                    >
                      <Key
                        className={`h-[18px] w-[18px] ${
                          key.roles.includes("developer_agent")
                            ? "text-green-600"
                            : "text-primary"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {key.name || key.keyPrefix + "..."}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {key.keyPrefix}... · Created{" "}
                        {new Date(key.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(key.keyPrefix + "...")}
                    >
                      <Copy className="mr-1.5 h-3 w-3" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteKey(key.uuid)}
                      className="text-destructive hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Roles Row */}
                <div className="mt-4 flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">Roles:</span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-[18px] w-[18px] items-center justify-center rounded ${
                        key.roles.includes("developer_agent")
                          ? "bg-primary"
                          : "border-2 border-border"
                      }`}
                    >
                      {key.roles.includes("developer_agent") && (
                        <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                      )}
                    </div>
                    <span
                      className={`text-xs ${key.roles.includes("developer_agent") ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      Developer Agent
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-[18px] w-[18px] items-center justify-center rounded ${
                        key.roles.includes("pm_agent")
                          ? "bg-primary"
                          : "border-2 border-border"
                      }`}
                    >
                      {key.roles.includes("pm_agent") && (
                        <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                      )}
                    </div>
                    <span
                      className={`text-xs ${key.roles.includes("pm_agent") ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      PM Agent
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create API Key Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25">
          <div className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-card shadow-xl">
            {createdKey ? (
              // Success State
              <div className="p-6">
                <div className="mb-4 flex items-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">API Key Created</span>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Copy this key now. You won&apos;t be able to see it again!
                </p>
                <div className="mb-4 flex items-center gap-2">
                  <code className="flex-1 rounded bg-foreground px-3 py-2 font-mono text-sm text-background">
                    {createdKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(createdKey)}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <Button onClick={closeModal} className="w-full">
                  Done
                </Button>
              </div>
            ) : (
              // Form State
              <form onSubmit={handleCreateKey}>
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-5">
                  <h3 className="text-lg font-semibold text-foreground">
                    Create API Key
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={closeModal}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Modal Body */}
                <div className="space-y-5 p-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="keyName" className="text-[13px]">
                      Name
                    </Label>
                    <Input
                      id="keyName"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="My Agent Key"
                      className="border-[#E5E0D8]"
                      required
                    />
                  </div>

                  {/* Agent Roles */}
                  <div className="space-y-3">
                    <Label className="text-[13px]">Agent Roles</Label>
                    <p className="text-xs text-muted-foreground">
                      Select the roles this API key has access to.
                    </p>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleRole("developer_agent")}
                        className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                          selectedRoles.includes("developer_agent")
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded ${
                            selectedRoles.includes("developer_agent")
                              ? "bg-primary"
                              : "border-2 border-border"
                          }`}
                        >
                          {selectedRoles.includes("developer_agent") && (
                            <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            Developer Agent
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Execute tasks, write code, report issues, commits
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleRole("pm_agent")}
                        className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                          selectedRoles.includes("pm_agent")
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded ${
                            selectedRoles.includes("pm_agent")
                              ? "bg-primary"
                              : "border-2 border-border"
                          }`}
                        >
                          {selectedRoles.includes("pm_agent") && (
                            <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            PM Agent
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Analyze requirements, write proposals, manage tasks
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Agent Persona - Always visible */}
                  <div className="space-y-3">
                    <Label className="text-[13px]">Agent Persona</Label>
                    <p className="text-xs text-muted-foreground">
                      {selectedRoles.length > 0
                        ? "Select a preset or write your own persona. This defines how the agent behaves in all interactions."
                        : "Define how this agent should behave in all interactions."}
                    </p>

                    {/* Persona Presets - Only show when roles are selected */}
                    {selectedRoles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {getAvailablePersonas().map((persona) => (
                          <Button
                            key={persona.id}
                            type="button"
                            variant={customPersona === persona.description ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              selectPersonaPreset(persona.description)
                            }
                            className="rounded-full"
                          >
                            {persona.label}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Editable Persona Textarea - Always visible */}
                    <Textarea
                      value={customPersona}
                      onChange={(e) => setCustomPersona(e.target.value)}
                      placeholder="Describe how this agent should behave. For example: 'You are a helpful assistant that focuses on clarity and simplicity...'"
                      rows={4}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {selectedRoles.length > 0
                        ? "You can edit the text above or write your own custom persona."
                        : "Write a custom persona for your agent."}
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      !newKeyName || selectedRoles.length === 0 || submitting
                    }
                  >
                    {submitting ? "Creating..." : "Create API Key"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

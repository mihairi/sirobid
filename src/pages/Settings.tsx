import { useSettings, Currency, Language, ColorScheme, currencyConfig, languageLabels, colorSchemeLabels, iconLabels, AppBranding } from "@/contexts/SettingsContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Gavel, Crown, Diamond, Star, Hammer, Settings as SettingsIcon, Palette, Globe, DollarSign, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const iconComponents: Record<AppBranding["icon"], React.ElementType> = {
  gavel: Gavel,
  crown: Crown,
  diamond: Diamond,
  star: Star,
  hammer: Hammer,
};

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const { settings, updateCurrency, updateLanguage, updateColorScheme, updateBranding } = useSettings();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleNameChange = (name: string) => {
    updateBranding({ ...settings.branding, name });
  };

  const handleIconChange = (icon: AppBranding["icon"]) => {
    updateBranding({ ...settings.branding, icon });
  };

  return (
    <div className="container py-8 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <SettingsIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Customize your auction experience</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Currency Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gold" />
                <CardTitle className="font-display">Currency</CardTitle>
              </div>
              <CardDescription>Choose your preferred currency for displaying prices</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={settings.currency} onValueChange={(value) => updateCurrency(value as Currency)}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(currencyConfig) as Currency[]).map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-muted-foreground">{currencyConfig[currency].symbol}</span>
                        <span>{currency}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-gold" />
                <CardTitle className="font-display">Language</CardTitle>
              </div>
              <CardDescription>Select your preferred language</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={settings.language} onValueChange={(value) => updateLanguage(value as Language)}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(languageLabels) as Language[]).map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {languageLabels[lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Color Scheme Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-gold" />
                <CardTitle className="font-display">Color Scheme</CardTitle>
              </div>
              <CardDescription>Personalize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={settings.colorScheme}
                onValueChange={(value) => updateColorScheme(value as ColorScheme)}
                className="grid gap-3 sm:grid-cols-2"
              >
                {(Object.keys(colorSchemeLabels) as ColorScheme[]).map((scheme) => (
                  <Label
                    key={scheme}
                    htmlFor={scheme}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all hover:border-gold/50 ${
                      settings.colorScheme === scheme ? "border-gold bg-gold/5" : "border-border"
                    }`}
                  >
                    <RadioGroupItem value={scheme} id={scheme} />
                    <div>
                      <div className="font-medium">{colorSchemeLabels[scheme].name}</div>
                      <div className="text-sm text-muted-foreground">{colorSchemeLabels[scheme].description}</div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Branding Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gold" />
                <CardTitle className="font-display">Application Branding</CardTitle>
              </div>
              <CardDescription>Customize the application name and icon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="app-name">Application Name</Label>
                <Input
                  id="app-name"
                  value={settings.branding.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter application name"
                  className="max-w-sm"
                  maxLength={30}
                />
                <p className="text-sm text-muted-foreground">This name will appear in the header</p>
              </div>

              <div className="space-y-3">
                <Label>Application Icon</Label>
                <div className="flex flex-wrap gap-3">
                  {(Object.keys(iconComponents) as AppBranding["icon"][]).map((iconKey) => {
                    const IconComponent = iconComponents[iconKey];
                    return (
                      <button
                        key={iconKey}
                        onClick={() => handleIconChange(iconKey)}
                        className={`flex h-14 w-14 items-center justify-center rounded-lg border-2 transition-all hover:border-gold/50 ${
                          settings.branding.icon === iconKey
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                        title={iconLabels[iconKey]}
                      >
                        <IconComponent className="h-6 w-6" />
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground">Selected: {iconLabels[settings.branding.icon]}</p>
              </div>

              {/* Preview */}
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
                <p className="mb-3 text-sm font-medium text-muted-foreground">Preview</p>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    {(() => {
                      const IconComponent = iconComponents[settings.branding.icon];
                      return <IconComponent className="h-5 w-5 text-primary-foreground" />;
                    })()}
                  </div>
                  <span className="font-display text-xl font-semibold text-foreground">
                    {settings.branding.name || "EliteAuctions"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

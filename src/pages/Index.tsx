import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Gavel, Shield, Clock, TrendingUp, ArrowRight } from "lucide-react";

export default function Index() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary py-24 lg:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyek0zNiAyNnYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50 bg-[#083891]" />

        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            




            




            <p className="mt-6 text-lg text-primary-foreground/70">
              {t("home.heroDescription")}
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              {user ?
              <Link to="/auctions">
                  <Button variant="gold" size="xl" className="group">
                    {t("home.browseAuctions")}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link> :

              <>
                  <Link to="/signup">
                    <Button variant="gold" size="xl" className="group">
                      {t("home.startBidding")}
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline-gold" size="xl">
                      {t("header.signIn")}
                    </Button>
                  </Link>
                </>
              }
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              {t("home.whyChoose")}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {t("home.whyChooseDesc")}
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={Shield} title={t("home.secureBidding")} description={t("home.secureBiddingDesc")} />
            <FeatureCard icon={Clock} title={t("home.smartTimer")} description={t("home.smartTimerDesc")} />
            <FeatureCard icon={TrendingUp} title={t("home.realTimeUpdates")} description={t("home.realTimeUpdatesDesc")} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/50 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground">
              {t("home.readyToStart")}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {t("home.readyToStartDesc")}
            </p>
            {!user &&
            <Link to="/signup" className="mt-8 inline-block">
                <Button variant="gold" size="xl">
                  {t("home.createFreeAccount")}
                </Button>
              </Link>
            }
          </div>
        </div>
      </section>
    </div>);

}

function FeatureCard({
  icon: Icon,
  title,
  description




}: {icon: React.ElementType;title: string;description: string;}) {
  return (
    <div className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:border-gold/30 hover:shadow-lg">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10 text-gold transition-colors group-hover:bg-gold group-hover:text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-display text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>);

}
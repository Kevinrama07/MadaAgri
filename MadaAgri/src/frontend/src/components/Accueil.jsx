import HeroSection from './HeroSection';
import FeedPreview from './FeedPreview';
import FeaturesSection from './FeaturesSection';
import CommunitySection from './CommunitySection';
import StatsSection from './StatsSection';
import CTASection from './CTASection';
import ModernFooter from './ModernFooter';
import '../styles/LandingPage.css';

export default function Accueil({ onConnect }) {
  const handleSignUp = () => {
    onConnect?.();
  };

  const handleLogin = () => {
    onConnect?.();
  };

  return (
    <div className="landing-page">
      <HeroSection onSignUp={handleSignUp} onLogin={handleLogin} />
      <FeedPreview />
      <FeaturesSection />
      <CommunitySection />
      <StatsSection />
      <CTASection onSignUp={handleSignUp} onLogin={handleLogin} />
      <ModernFooter />
    </div>
  );
}

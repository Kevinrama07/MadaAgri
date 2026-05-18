import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LandingNavbar } from '../../components/LandingNavbar';
import { useAuth } from '../../contexts/ContextAuthentification';
import HeroSection from './HeroSection';
import ValueProps from './ValueProps';
import StatsSection from './StatsSection';
import FeaturesSection from './FeaturesSection';
import CTASection from './CTASection';
import ModernFooter from './ModernFooter';
import styles from './LandingPage.module.css';

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export default function LandingPage() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className={styles.page}>
      <LandingNavbar />
      <main className={styles.main}>
        <motion.div variants={sectionVariants} initial="hidden" animate="visible">
          <HeroSection />
        </motion.div>
        <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          <ValueProps />
        </motion.div>
        <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          <StatsSection />
        </motion.div>
        <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          <FeaturesSection />
        </motion.div>
        <motion.div variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          <CTASection />
        </motion.div>
      </main>
      <ModernFooter />
    </div>
  );
}

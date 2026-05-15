/**
 * MeteoPage - Météo détaillée
 */

import clsx from 'clsx';
import MeteoWeather from '../../../Meteo/MeteoWeather';
import styles from '../../../../styles/Composants/TableauDeBord.module.css';

export default function MeteoPage() {
  return (
    <section className={clsx(styles['mg-panel'])}>
      <MeteoWeather />
    </section>
  );
}
